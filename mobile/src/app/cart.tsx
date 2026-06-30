import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Colors, Spacing, Typography } from '../constants/theme';
import { createOrder } from '../services/api';

export default function CartScreen() {
    // We get the restaurantId from the URL params
    const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
    const { carts, remove, add, clearCart } = useContext(CartContext);
    const { token, user } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const c = isDark ? Colors.dark : Colors.light;

    // Get items for this specific restaurant
    const items = carts[restaurantId] || [];
    const subtotal = items.reduce((sum, current) => sum + (current.item.price * current.qty), 0);

    const SERVICE_FEE = 2.00;
    const DELIVERY_FEE = 10.00; 
    const total = subtotal + SERVICE_FEE + DELIVERY_FEE;

    const handleCheckout = async () => {
        if (!token || !user) {
            Alert.alert("Authentication Required", "Please log in to place an order.");
            return;
        }

        setIsLoading(true);
        try {
            const orderPayload = {
                restaurantId: restaurantId,
                items: items.map(i => ({ productId: i.item.id, quantity: i.qty })),
                mode: 'delivery',
                paymentMethod: 'credit_card',
                location: user.location,
                totalAmount: total
            };

            await createOrder(orderPayload, token);
            Alert.alert("Success", "Order placed successfully!");
            clearCart(restaurantId); // Clear only this restaurant's cart
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert("Checkout Failed", error.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
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
            <Stack.Screen options={{ title: 'Your Order' }} />
            
            <ScrollView contentContainerStyle={styles.scroll}>
                {items.map(({ item, qty }) => (
                    <View key={item.id} style={[styles.row, { borderBottomColor: c.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: c.text }]}>{item.name}</Text>
                            <Text style={{ color: c.textMuted }}>₪{item.price.toFixed(2)}</Text>
                        </View>
                        <View style={styles.qtyControls}>
                            <TouchableOpacity onPress={() => remove(restaurantId, item.id)}>
                                <Ionicons name="remove-circle-outline" size={24} color={c.accent} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyText, { color: c.text }]}>{qty}</Text>
                            <TouchableOpacity onPress={() => add(item)}>
                                <Ionicons name="add-circle-outline" size={24} color={c.accent} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <View style={[styles.pricing, { marginTop: Spacing[4] }]}>
                    <Text style={{ color: c.textMuted }}>Subtotal: ₪{subtotal.toFixed(2)}</Text>
                    <Text style={{ color: c.textMuted }}>Service Fee: ₪{SERVICE_FEE.toFixed(2)}</Text>
                    <Text style={{ color: c.textMuted }}>Delivery: ₪{DELIVERY_FEE.toFixed(2)}</Text>
                    <Text style={[styles.total, { color: c.text }]}>Total: ₪{total.toFixed(2)}</Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: c.surface }]}>
                <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: c.accent }]} onPress={handleCheckout} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Checkout · ₪{total.toFixed(2)}</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    scroll: { padding: Spacing[4] },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: Typography.h3, marginTop: Spacing[3] },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3], borderBottomWidth: 1 },
    itemName: { fontSize: Typography.base, fontWeight: '600' },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    qtyText: { fontSize: Typography.base, fontWeight: 'bold', width: 24, textAlign: 'center' },
    pricing: { gap: Spacing[1], marginBottom: Spacing[4] },
    total: { fontSize: Typography.h3, fontWeight: '900', marginTop: Spacing[2] },
    footer: { padding: Spacing[4], borderTopWidth: 1, borderTopColor: '#eee' },
    checkoutBtn: { padding: Spacing[4], borderRadius: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: Typography.base, fontWeight: 'bold' }
});