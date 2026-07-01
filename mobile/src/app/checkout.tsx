import React, { useContext, useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Alert, 
    TextInput, 
    Switch, 
    Modal,
    FlatList
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { Colors, Spacing, Typography } from '../constants/theme';
import { createOrder, getRestaurant, type Restaurant } from '../services/api';
import { calcAerialDistance } from '@/utils/distance';

// Helper function to format location as readable text
const formatLocation = (loc: any) => {
    if (!loc) return null;
    if (typeof loc === 'string') return loc;
    if (loc.lat !== undefined && loc.lng !== undefined) {
        return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
    }
    return 'Missing location';
};

export default function CheckoutScreen() {
    const { restaurantId, notes, forcePickup } = useLocalSearchParams<{ restaurantId: string, notes?: string, forcePickup?: string }>();
    const { carts, clearCart } = useContext(CartContext);
    const { token, user } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const c = isDark ? Colors.dark : Colors.light;

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form States
    const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>(forcePickup === 'true' ? 'pickup' : 'delivery');
    const [leaveAtDoor, setLeaveAtDoor] = useState(false);
    const [cutleryQty, setCutleryQty] = useState<number>(0);

    // Scheduling States
    const [when, setWhen] = useState<'now' | 'later'>('now');
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [scheduledTime, setScheduledTime] = useState<string | null>(null);

    // Payment & Tip States
    const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'cash' | 'apple_pay'>('credit_card');
    const [promoCode, setPromoCode] = useState('');
    const [tip, setTip] = useState<number>(0);
    const [isCustomTip, setIsCustomTip] = useState(false);
    const [customTipStr, setCustomTipStr] = useState('');

    const items = carts[restaurantId] || [];
    
    useEffect(() => {
        if (restaurantId) {
            getRestaurant(restaurantId).then(setRestaurant).catch(console.error);
        }
    }, [restaurantId]);

    // --- Server-synced calculations ---
    const totalItemsCount = items.reduce((sum, current) => sum + current.qty, 0);
    const subtotal = items.reduce((sum, current) => sum + (current.item.price * current.qty), 0);
    const SERVICE_FEE = 2.00;
    
    let distanceKm = 0;
    let DELIVERY_FEE = 0;
    let estimatedTimeStr = 'Loading...';

    if (restaurant) {
        if (deliveryMode === 'delivery' && user?.location && typeof user.location !== 'string') {
            distanceKm = calcAerialDistance(
                restaurant.location?.lat, restaurant.location?.lng, 
                user.location.lat, user.location.lng
            );
            DELIVERY_FEE = (restaurant.deliveryFee || 0) + (distanceKm * 2);
            const estTimeNum = (restaurant.deliveryTime || 30) + (totalItemsCount * 2) + Math.round(distanceKm * 3);
            estimatedTimeStr = `Estimated delivery: ${estTimeNum - 5}-${estTimeNum + 10} min`;
        } else if (deliveryMode === 'pickup') {
            const estTimeNum = 15 + (totalItemsCount * 2);
            estimatedTimeStr = `Estimated prep time: ${estTimeNum - 5}-${estTimeNum + 5} min`;
        }
    }

    const total = subtotal + SERVICE_FEE + DELIVERY_FEE + tip;

    // Generate dynamic time slots based on minimum estimated time
    const generateTimeOptions = () => {
        const options = [];
        let baseMin = deliveryMode === 'pickup' ? 15 : 45; // Base estimated minimum time
        for(let i = 0; i < 4; i++) {
            options.push(`In ${baseMin} - ${baseMin + 30} min`);
            baseMin += 30;
        }
        return options;
    };
    const dynamicTimes = generateTimeOptions();

    const handlePlaceOrder = async () => {
        if (!token || !user) return;

        setIsLoading(true);
        try {
            const orderPayload = {
                restaurantId,
                items: items.map(i => ({ productId: i.item.id, quantity: i.qty })),
                mode: deliveryMode,
                paymentMethod,
                location: deliveryMode === 'delivery' ? user.location : undefined,
                totalAmount: total,
                notes: notes || '',
                cutlery: cutleryQty,
                tip: tip,
                scheduledTime: when === 'later' ? scheduledTime : 'now'
            };

            await createOrder(orderPayload, token);
            Alert.alert("Success", "Order placed successfully!");
            clearCart(restaurantId);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert("Checkout Failed", error.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.fill, { backgroundColor: c.background }]}>
            <Stack.Screen options={{ 
                title: 'Checkout',
                headerBackTitle: 'Cart',
                headerRight: () => <ThemeToggleButton />
            }} />
            
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* 1. Delivery / Pickup Toggle */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <View style={styles.pillContainer}>
                        <TouchableOpacity 
                            style={[styles.pillBtn, 
                                deliveryMode === 'delivery' && { backgroundColor: c.accent },
                                forcePickup === 'true' && { opacity: 0.4 }
                            ]}
                            onPress={() => setDeliveryMode('delivery')}
                            disabled={forcePickup === 'true'}
                        >
                            <Ionicons name="bicycle-outline" size={20} color={deliveryMode === 'delivery' ? '#fff' : c.textMuted} />
                            <Text style={[styles.pillText, deliveryMode === 'delivery' ? { color: '#fff' } : { color: c.textMuted }]}>Delivery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.pillBtn, deliveryMode === 'pickup' && { backgroundColor: c.accent }]}
                            onPress={() => { setDeliveryMode('pickup'); setTip(0); }}
                        >
                            <Ionicons name="walk-outline" size={20} color={deliveryMode === 'pickup' ? '#fff' : c.textMuted} />
                            <Text style={[styles.pillText, deliveryMode === 'pickup' ? { color: '#fff' } : { color: c.textMuted }]}>Pickup</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.subSection}>
                        {deliveryMode === 'delivery' ? (
                            <>
                                <View style={styles.iconRow}>
                                    <Ionicons name="location-outline" size={20} color={c.text} />
                                    <Text style={[styles.addressText, { color: c.text }]}>
                                        {formatLocation(user?.location) || "No address saved"}
                                    </Text>
                                </View>
                                <View style={[styles.switchRow, { marginTop: Spacing[4], backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9F9F9' }]}>
                                    <Text style={{ color: c.text, fontWeight: '500' }}>Leave at my door</Text>
                                    <Switch value={leaveAtDoor} onValueChange={setLeaveAtDoor} trackColor={{ true: c.accent }} />
                                </View>
                            </>
                        ) : (
                            <View style={styles.iconRow}>
                                <Ionicons name="storefront-outline" size={20} color={c.text} />
                                <Text style={[styles.addressText, { color: c.text }]}>
                                    {formatLocation(restaurant?.location) || (restaurant?.name ? `Pick up at ${restaurant.name}` : "Restaurant location")}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 2. Cutlery & Notes (Passed from Cart) */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <View style={[styles.iconRow, { justifyContent: 'space-between' }]}>
                        <View style={styles.iconRow}>
                            <Ionicons name="restaurant-outline" size={20} color={c.text} />
                            <Text style={{ color: c.text, fontWeight: '500' }}>Add Cutlery (+0.00₪)</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[3] }}>
                            <TouchableOpacity onPress={() => setCutleryQty(Math.max(0, cutleryQty - 1))} style={[styles.stepperBtn, { backgroundColor: c.border }]}>
                                <Ionicons name="remove" size={18} color={c.text} />
                            </TouchableOpacity>
                            <Text style={{ color: c.text, fontWeight: 'bold', fontSize: Typography.base }}>{cutleryQty}</Text>
                            <TouchableOpacity onPress={() => setCutleryQty(cutleryQty + 1)} style={[styles.stepperBtn, { backgroundColor: c.border }]}>
                                <Ionicons name="add" size={18} color={c.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {notes ? (
                        <View style={{ marginTop: Spacing[3], paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: c.border }}>
                            <Text style={{ color: c.textMuted, fontSize: Typography.sm }}>
                                <Ionicons name="chatbubble-ellipses-outline" /> Notes: {notes}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* 3. When? */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>When?</Text>
                    <View style={styles.pillContainer}>
                        <TouchableOpacity 
                            style={[styles.pillBtn, when === 'now' && { backgroundColor: c.accent }]}
                            onPress={() => { setWhen('now'); setScheduledTime(null); }}
                        >
                            <Text style={[styles.pillText, when === 'now' ? { color: '#fff' } : { color: c.textMuted }]}>Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.pillBtn, when === 'later' && { backgroundColor: c.accent }]}
                            onPress={() => setShowTimeModal(true)}
                        >
                            <Text style={[styles.pillText, when === 'later' ? { color: '#fff' } : { color: c.textMuted }]}>
                                {when === 'later' && scheduledTime ? scheduledTime : 'Schedule'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.subText, { color: c.textMuted, marginTop: Spacing[3], textAlign: 'center' }]}>
                        {when === 'now' ? estimatedTimeStr : 'Order will be prepared for your selected time'}
                    </Text>
                </View>

                {/* 4. Courier Tip (Only if delivery) */}
                {deliveryMode === 'delivery' && (
                    <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>Courier Tip</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[2] }}>
                            {[0, 5, 10, 15].map(amount => (
                                <TouchableOpacity 
                                    key={amount}
                                    style={[styles.tipBtn, tip === amount && !isCustomTip ? { backgroundColor: c.accent, borderColor: c.accent } : { borderColor: c.border }]}
                                    onPress={() => { setIsCustomTip(false); setTip(amount); }}
                                >
                                    <Text style={[styles.tipText, tip === amount && !isCustomTip ? { color: '#fff' } : { color: c.text }]}>
                                        { `₪${amount}` }
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity 
                                style={[styles.tipBtn, isCustomTip ? { backgroundColor: c.accent, borderColor: c.accent } : { borderColor: c.border }]}
                                onPress={() => setIsCustomTip(true)}
                            >
                                <Text style={[styles.tipText, isCustomTip ? { color: '#fff' } : { color: c.text }]}>Other</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Custom Tip Input */}
                        {isCustomTip && (
                            <View style={{ marginTop: Spacing[3], flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                                <Text style={{ color: c.text, fontSize: Typography.base }}>₪</Text>
                                <TextInput
                                    style={[styles.input, { flex: 1, backgroundColor: c.background, color: c.text, borderColor: c.border }]}
                                    placeholder="Enter custom amount"
                                    placeholderTextColor={c.textMuted}
                                    keyboardType="numeric"
                                    value={customTipStr}
                                    onChangeText={(val) => {
                                        setCustomTipStr(val);
                                        setTip(Number(val) || 0);
                                    }}
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* 5. Payment & Promo */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Payment Method</Text>
                    <View style={styles.paymentRow}>
                        {['credit_card', 'apple_pay', 'cash'].map((method) => (
                            <TouchableOpacity 
                                key={method}
                                style={[styles.paymentBtn, paymentMethod === method ? { borderColor: c.accent, backgroundColor: isDark ? 'rgba(0,194,232,0.1)' : '#E6F9FD' } : { borderColor: c.border }]}
                                onPress={() => setPaymentMethod(method as any)}
                            >
                                <Ionicons 
                                    name={method === 'credit_card' ? 'card-outline' : method === 'apple_pay' ? 'logo-apple' : 'cash-outline'} 
                                    size={24} 
                                    color={paymentMethod === method ? c.accent : c.textMuted} 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <View style={styles.promoContainer}>
                        <TextInput
                            style={[styles.input, styles.promoInput, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
                            placeholder="Promo code"
                            placeholderTextColor={c.textMuted}
                            value={promoCode}
                            onChangeText={setPromoCode}
                        />
                        <TouchableOpacity style={[styles.promoSubmitBtn, { backgroundColor: promoCode.length > 0 ? c.accent : c.border }]} disabled={promoCode.length === 0}>
                            <Text style={{ color: promoCode.length > 0 ? '#fff' : c.textMuted, fontWeight: '700' }}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 6. Breakdown */}
                <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Summary</Text>
                    <View style={styles.pricingRow}>
                        <Text style={{ color: c.textMuted }}>Items subtotal</Text>
                        <Text style={{ color: c.text }}>₪{subtotal.toFixed(2)}</Text>
                    </View>
                    {deliveryMode === 'delivery' && (
                        <View style={styles.pricingRow}>
                            <Text style={{ color: c.textMuted }}>Delivery fee</Text>
                            <Text style={{ color: c.text }}>₪{DELIVERY_FEE.toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={styles.pricingRow}>
                        <Text style={{ color: c.textMuted }}>Service fee</Text>
                        <Text style={{ color: c.text }}>₪{SERVICE_FEE.toFixed(2)}</Text>
                    </View>
                    {tip > 0 && (
                        <View style={styles.pricingRow}>
                            <Text style={{ color: c.textMuted }}>Courier tip</Text>
                            <Text style={{ color: c.text }}>₪{tip.toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={[styles.pricingRow, { marginTop: Spacing[3], paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: c.border }]}>
                        <Text style={[styles.totalText, { color: c.text }]}>Total</Text>
                        <Text style={[styles.totalText, { color: c.text }]}>₪{total.toFixed(2)}</Text>
                    </View>
                </View>

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
                <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: c.accent }]} onPress={handlePlaceOrder} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : (
                        <View style={styles.checkoutBtnContent}>
                            <Text style={styles.btnText}>Place Order</Text>
                            <Text style={styles.btnText}>₪{total.toFixed(2)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Time Picker Modal */}
            <Modal visible={showTimeModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
                        <Text style={[styles.sectionTitle, { color: c.text, textAlign: 'center' }]}>Select a time</Text>
                        <FlatList 
                            data={dynamicTimes}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.modalTimeBtn, { borderBottomColor: c.border }]}
                                    onPress={() => {
                                        setScheduledTime(item);
                                        setWhen('later');
                                        setShowTimeModal(false);
                                    }}
                                >
                                    <Text style={{ color: c.text, fontSize: Typography.base }}>{item}</Text>
                                    <Ionicons name="chevron-forward" color={c.textMuted} size={16} />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity 
                            style={{ marginTop: 20, alignItems: 'center', paddingVertical: 10 }}
                            onPress={() => setShowTimeModal(false)}
                        >
                            <Text style={{ color: c.textMuted, fontSize: Typography.base, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    scroll: { padding: Spacing[4], gap: Spacing[4] },
    
    section: { padding: Spacing[4], borderRadius: 16, borderWidth: 1 },
    sectionTitle: { fontSize: Typography.base, fontWeight: '800', marginBottom: Spacing[3] },
    subSection: { marginTop: Spacing[4], paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: '#eee' },
    
    pillContainer: { flexDirection: 'row', backgroundColor: 'rgba(150,150,150,0.15)', borderRadius: 999, padding: 4 },
    pillBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    pillText: { fontWeight: '700', fontSize: Typography.sm },
    
    iconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    addressText: { fontSize: Typography.sm, fontWeight: '600' },
    subText: { fontSize: Typography.sm },
    
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[3], borderRadius: 12 },
    stepperBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    
    input: { borderWidth: 1, borderRadius: 8, padding: Spacing[3], fontSize: Typography.sm, minHeight: 44 },
    
    tipBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
    tipText: { fontWeight: '700' },
    
    paymentRow: { flexDirection: 'row', gap: Spacing[3] },
    paymentBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    
    promoContainer: { flexDirection: 'row', marginTop: Spacing[3], gap: Spacing[2] },
    promoInput: { flex: 1 },
    promoSubmitBtn: { justifyContent: 'center', paddingHorizontal: Spacing[4], borderRadius: 8 },

    pricingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[2] },
    totalText: { fontSize: Typography.h3, fontWeight: '900' },
    
    footer: { padding: Spacing[4], borderTopWidth: 1, paddingBottom: 34 },
    checkoutBtn: { padding: Spacing[4], borderRadius: 12, alignItems: 'center' },
    checkoutBtnContent: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: Spacing[2] },
    btnText: { color: '#fff', fontSize: Typography.base, fontWeight: '800' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { padding: Spacing[5], borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    modalTimeBtn: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[4], borderBottomWidth: StyleSheet.hairlineWidth }
});