import React, { useContext, useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    TextInput 
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { getRestaurant, getMenu, MEDIA_BASE, type Restaurant, type Product } from '../../services/api';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { calcAerialDistance } from '@/utils/distance';

// Reusing the components from the restaurant screen
import RecommendedCard from '../restaurant/_components/RecommendedCard';
import MenuItemModal from '../restaurant/_components/MenuItemModal';

export default function CartScreen() {
    const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
    const { carts, remove, add } = useContext(CartContext);
    const { token, user } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const c = isDark ? Colors.dark : Colors.light;

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orderNotes, setOrderNotes] = useState('');
    
    // States for Recommended Products
    const [recommended, setRecommended] = useState<Product[]>([]);
    const [modalItem, setModalItem] = useState<Product | null>(null);
    const stepperDismissRef = useRef<(() => void) | null>(null);

    const items = carts[restaurantId] || [];
    const subtotal = items.reduce((sum, current) => sum + (current.item.price * current.qty), 0);

    useEffect(() => {
        if (restaurantId) {
            // 1. Fetch Restaurant details
            getRestaurant(restaurantId).then(setRestaurant).catch(console.error);

            // 2. Fetch Recommended Products
            const fetchRecommended = async () => {
                try {
                    if (token) {
                        // Authorized user: hit the backend recommendations endpoint
                        const res = await fetch(`${MEDIA_BASE}/api/restaurants/${restaurantId}/products/recommended`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            setRecommended(data);
                        } else {
                            throw new Error('Failed to fetch recommended');
                        }
                    } else {
                        // Guest user fallback: get first 5 available items from the menu
                        const menu = await getMenu(restaurantId);
                        const fallbackItems = menu.flatMap(s => s.items).filter(i => i.isAvailable !== false).slice(0, 5);
                        setRecommended(fallbackItems);
                    }
                } catch (err) {
                    console.error("Error fetching recommendations:", err);
                    // Absolute fallback on network error
                    try {
                        const menu = await getMenu(restaurantId);
                        const fallbackItems = menu.flatMap(s => s.items).filter(i => i.isAvailable !== false).slice(0, 5);
                        setRecommended(fallbackItems);
                    } catch (e) {}
                }
            };
            fetchRecommended();
        }
    }, [restaurantId, token]);

    const handleGoToCheckout = () => {
        // Check if user is logged in.
        if (!token || !user) {
            Alert.alert(
                "Login Required", 
                "Please log in or create an account to proceed to checkout.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => router.push('/user/login') }
                ]
            );
            return;
        }

        // Validate delivery distance (Max 15km).
        if (user.location && restaurant?.location) {
            const distanceKm = calcAerialDistance(
                restaurant.location.lat, restaurant.location.lng,
                user.location.lat, user.location.lng
            );

            const MAX_DELIVERY_RADIUS_KM = 15;

            // If too far, warn the user and offer to proceed for Pickup only
            if (distanceKm > MAX_DELIVERY_RADIUS_KM) {
                Alert.alert(
                    "Out of Delivery Range",
                    `Your address is ${distanceKm.toFixed(1)}km away. The maximum delivery distance is ${MAX_DELIVERY_RADIUS_KM}km.\n\nYou can still proceed if you intend to pick up your order.`,
                    [
                        { text: "Cancel", style: "cancel" },
                        { 
                            text: "Proceed to Pickup", 
                            onPress: () => router.push({
                                pathname: '/orders/checkout',
                                params: { 
                                    restaurantId, 
                                    notes: orderNotes, 
                                    forcePickup: 'true'
                                }
                            }) 
                        }
                    ]
                );
                return; // Stop standard flow
            }
        }

        // Go to checkout page
        router.push({
            pathname: '/orders/checkout',
            params: { 
                restaurantId, 
                notes: orderNotes 
            }
        });
    };

    if (items.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: c.background }]}>
                <Ionicons name="cart-outline" size={64} color={c.textMuted} />
                <Text style={[styles.emptyText, { color: c.text }]}>Cart is empty</Text>
            </View>
        );
    }

    return (
        <View style={[styles.fill, { backgroundColor: c.background }]}>
            <Stack.Screen options={{ 
                title: restaurant?.name ? `${restaurant.name}` : 'Your Order',
                headerBackTitle: 'Back',
                headerRight: () => <ThemeToggleButton />
            }} />
            
            <ScrollView 
                contentContainerStyle={styles.scroll} 
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={() => stepperDismissRef.current?.()} // Close stepper on scroll
            >
                
                {/* 1. Items List */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Your items</Text>
                    {items.map(({ item, qty }) => (
                        <View key={item.id} style={styles.itemRow}>
                            {item.image ? (
                                <Image 
                                    source={{ uri: item.image.startsWith('http') || item.image.startsWith('data:') ? item.image : `${MEDIA_BASE}${item.image}` }} 
                                    style={[styles.itemImg, { backgroundColor: c.background }]} 
                                />
                            ) : (
                                /* Fallback for missing product image */
                                <View style={[styles.itemImg, { backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Ionicons name="fast-food-outline" size={24} color={c.textMuted} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemName, { color: c.text }]} numberOfLines={2}>{item.name}</Text>
                                <Text style={{ color: c.textMuted }}>₪{(item.price * qty).toFixed(2)}</Text>
                            </View>
                            <View style={styles.qtyControls}>
                                {/* Changed minus button color to match the plus button */}
                                <TouchableOpacity onPress={() => remove(restaurantId, item.id)}>
                                    <Ionicons name="remove-circle" size={28} color={c.accent} />
                                </TouchableOpacity>
                                <Text style={[styles.qtyText, { color: c.text }]}>{qty}</Text>
                                <TouchableOpacity onPress={() => add(item)}>
                                    <Ionicons name="add-circle" size={28} color={c.accent} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    
                    {/* Disclaimer note for fees */}
                    <View style={styles.disclaimerContainer}>
                        <Ionicons name="information-circle-outline" size={16} color={c.textMuted} />
                        <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
                            Price does not include delivery and service fees.
                        </Text>
                    </View>
                </View>

                {/* 2. Notes */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Notes for the restaurant</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
                        placeholder="e.g. No onions, extra spicy..."
                        placeholderTextColor={c.textMuted}
                        value={orderNotes}
                        onChangeText={setOrderNotes}
                        multiline
                    />
                </View>

                {/* 3. Recommended Products Carousel */}
                {recommended.length > 0 && (
                    <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border, paddingHorizontal: 0, paddingBottom: Spacing[4] }]}>
                        <Text style={[styles.sectionTitle, { color: c.text, paddingHorizontal: Spacing[4] }]}>Recommended for you</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={{ paddingHorizontal: Spacing[4], gap: Spacing[3] }}
                        >
                            {recommended.map(item => (
                                <RecommendedCard
                                    key={`rec-${item.id}`}
                                    item={item}
                                    onPress={() => setModalItem(item)}
                                    stepperDismissRef={stepperDismissRef}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

            </ScrollView>

            {/* Footer with subtotal and navigation */}
            <View style={[styles.footer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
                <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: c.accent }]} onPress={handleGoToCheckout}>
                    <View style={styles.checkoutBtnContent}>
                        <Text style={styles.btnText}>Go to checkout</Text>
                        <Text style={styles.btnText}>₪{subtotal.toFixed(2)}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Modal for viewing recommended item details */}
            <MenuItemModal
                item={modalItem}
                visible={modalItem !== null}
                onClose={() => setModalItem(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    scroll: { padding: Spacing[4], gap: Spacing[4] },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: Typography.h3, marginTop: Spacing[3] },
    
    section: { padding: Spacing[4], borderRadius: 16, borderWidth: 1 },
    sectionTitle: { fontSize: Typography.base, fontWeight: '800', marginBottom: Spacing[3] },
    
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3], gap: Spacing[3] },
    itemImg: { width: 56, height: 56, borderRadius: 8 },
    itemName: { fontSize: Typography.sm, fontWeight: '700', marginBottom: 2 },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    qtyText: { fontSize: Typography.base, fontWeight: 'bold', width: 20, textAlign: 'center' },
    
    disclaimerContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing[2], paddingTop: Spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ccc' },
    disclaimerText: { fontSize: Typography.xs },

    input: { borderWidth: 1, borderRadius: 8, padding: Spacing[3], fontSize: Typography.sm, minHeight: 44 },
    
    footer: { padding: Spacing[4], borderTopWidth: 1, paddingBottom: 34 },
    checkoutBtn: { padding: Spacing[4], borderRadius: 12, alignItems: 'center' },
    checkoutBtnContent: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: Spacing[2] },
    btnText: { color: '#fff', fontSize: Typography.base, fontWeight: '800' }
});