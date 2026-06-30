import React, { useContext, useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    TextInput, 
    Switch 
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getRestaurant, MEDIA_BASE, type Restaurant } from '../services/api';

export default function CartScreen() {
    const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
    const { carts, remove, add } = useContext(CartContext);
    const { token, user } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const c = isDark ? Colors.dark : Colors.light;

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orderNotes, setOrderNotes] = useState('');
    const [wantsCutlery, setWantsCutlery] = useState(false);

    const items = carts[restaurantId] || [];
    const subtotal = items.reduce((sum, current) => sum + (current.item.price * current.qty), 0);

    useEffect(() => {
        if (restaurantId) {
            getRestaurant(restaurantId).then(setRestaurant).catch(console.error);
        }
    }, [restaurantId]);

    const handleGoToCheckout = () => {
        if (!token || !user) {
            Alert.alert(
                "LOGGED IN USER REQUIRED", 
                "In order to proceed, please log in or register",
                [{ text: "Got it", style: "default" }]
                // TODO: Add a button referring to log in screen.
            );
            return;
        }

        // Go to checkout page.
        router.push({
            pathname: '/checkout',
            params: { 
                restaurantId, 
                notes: orderNotes, 
                cutlery: wantsCutlery ? 'true' : 'false' 
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
                title: restaurant?.name ? `Cart - ${restaurant.name}` : 'Your Order',
                headerBackTitle: 'Back'
            }} />
            
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* 1. Items List */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Your items</Text>
                    {items.map(({ item, qty }) => (
                        <View key={item.id} style={styles.itemRow}>
                            <Image 
                                source={{ uri: item.image?.startsWith('http') ? item.image : `${MEDIA_BASE}${item.image}` }} 
                                style={[styles.itemImg, { backgroundColor: c.background }]} 
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemName, { color: c.text }]} numberOfLines={2}>{item.name}</Text>
                                <Text style={{ color: c.textMuted }}>₪{(item.price * qty).toFixed(2)}</Text>
                            </View>
                            <View style={styles.qtyControls}>
                                <TouchableOpacity onPress={() => remove(restaurantId, item.id)}>
                                    <Ionicons name="remove-circle" size={28} color={c.border} />
                                </TouchableOpacity>
                                <Text style={[styles.qtyText, { color: c.text }]}>{qty}</Text>
                                <TouchableOpacity onPress={() => add(item)}>
                                    <Ionicons name="add-circle" size={28} color={c.accent} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    
                    <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing[3], marginTop: Spacing[2] }]}>
                        <View style={styles.iconRow}>
                            <Ionicons name="restaurant-outline" size={20} color={c.text} />
                            <Text style={{ color: c.text, marginLeft: 8 }}>I need cutlery</Text>
                        </View>
                        <Switch value={wantsCutlery} onValueChange={setWantsCutlery} trackColor={{ true: c.accent }} />
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

                {/* Placeholder for "Recommended Products" carousel in the future */}
                {/* <RecommendedProductsCarousel restaurantId={restaurantId} /> */}

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
    
    iconRow: { flexDirection: 'row', alignItems: 'center' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3], gap: Spacing[3] },
    itemImg: { width: 56, height: 56, borderRadius: 8 },
    itemName: { fontSize: Typography.sm, fontWeight: '700', marginBottom: 2 },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    qtyText: { fontSize: Typography.base, fontWeight: 'bold', width: 20, textAlign: 'center' },
    
    input: { borderWidth: 1, borderRadius: 8, padding: Spacing[3], fontSize: Typography.sm, minHeight: 44 },
    
    footer: { padding: Spacing[4], borderTopWidth: 1, paddingBottom: 34 },
    checkoutBtn: { padding: Spacing[4], borderRadius: 12, alignItems: 'center' },
    checkoutBtnContent: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: Spacing[2] },
    btnText: { color: '#fff', fontSize: Typography.base, fontWeight: '800' }
});