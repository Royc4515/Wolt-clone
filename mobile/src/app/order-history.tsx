import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator,
    Pressable,
    Modal,
    ScrollView,
    Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { CartContext } from '../context/CartContext';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getUserOrders, getRestaurant, getMenu, type Order, type Product } from '../services/api';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

// Helper to format ISO date to a readable string
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Unified status metadata (Matches Roy's orders.tsx exactly)
const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
    pending:    { label: 'Pending',      color: '#FF9500', icon: 'time-outline' },
    accepted:   { label: 'Accepted',     color: '#007AFF', icon: 'checkmark-circle-outline' },
    preparing:  { label: 'Preparing',    color: '#AF52DE', icon: 'restaurant-outline' },
    on_the_way: { label: 'On the way',   color: '#00C7BE', icon: 'bicycle-outline' },
    delivered:  { label: 'Delivered',    color: '#34C759', icon: 'checkmark-done-outline' },
    cancelled:  { label: 'Cancelled',    color: '#FF3B30', icon: 'close-circle-outline' },
};

export default function OrderHistoryScreen() {
    const { token } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const { add } = useContext(CartContext); // Using 'add' from your CartContext
    const router = useRouter();
    const c = isDark ? Colors.dark : Colors.light;

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // State for Order Details Modal
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!token) return;
            try {
                const data = await getUserOrders(token);
                setOrders(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load order history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [token]);

    // Handle "Order Again" logic with item availability validation
    const handleReorder = async (order: Order) => {
        if (isReordering) return;
        setIsReordering(true);

        try {
            // 1. Verify if the restaurant still exists
            try {
                await getRestaurant(order.restaurantId);
            } catch (err) {
                Alert.alert("Restaurant Unavailable", "This restaurant is no longer available on our platform.");
                setIsReordering(false);
                return;
            }

            // 2. Fetch current menu to verify real-time item availability
            const menu = await getMenu(order.restaurantId);
            
            // Map available products for quick lookup
            const availableProducts = new Map<string, Product>();
            menu.forEach(section => {
                section.items.forEach(product => {
                    if (product.isAvailable !== false) {
                        availableProducts.set(product.id, product);
                    }
                });
            });

            // 3. Match previous order items with currently available products
            let addedCount = 0;
            let missingCount = 0;

            for (const orderItem of order.items) {
                const activeProduct = availableProducts.get(orderItem.productId);
                if (activeProduct) {
                    // Add the product to cart multiple times based on past quantity
                    for (let i = 0; i < orderItem.quantity; i++) {
                        add(activeProduct);
                    }
                    addedCount++;
                } else {
                    missingCount++;
                }
            }

            // 4. Provide feedback based on availability results
            if (addedCount === 0) {
                Alert.alert("Items Unavailable", "None of the items from this order are currently available.");
            } else if (missingCount > 0) {
                Alert.alert(
                    "Partial Order Recreated", 
                    "Some items are no longer available and were skipped. The available items have been added to your cart.",
                    [{ 
                        text: "View Cart", 
                        onPress: () => router.push({ pathname: '/cart', params: { restaurantId: order.restaurantId } }) 
                    }]
                );
            } else {
                // Everything was successfully added
                router.push({ pathname: '/cart', params: { restaurantId: order.restaurantId } });
            }

        } catch (err) {
            console.error("Reorder error:", err);
            Alert.alert("Error", "Could not process reorder. Please try again later.");
        } finally {
            setIsReordering(false);
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
        const meta = STATUS_META[item.status] || STATUS_META.pending;
        const itemsSummary = item.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

        return (
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.dateText, { color: c.textMuted }]}>
                        {formatDate(item.createdAt)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: meta.color + '15' }]}>
                        <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                        <Text style={[styles.statusText, { color: meta.color }]}>
                            {meta.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.row}>
                        <Ionicons name="fast-food-outline" size={20} color={c.text} />
                        <Text style={[styles.itemsText, { color: c.text }]} numberOfLines={2}>
                            {itemsSummary}
                        </Text>
                    </View>
                    
                    <View style={[styles.row, { marginTop: Spacing[2] }]}>
                        <Ionicons 
                            name={item.mode === 'delivery' ? 'bicycle-outline' : 'walk-outline'} 
                            size={20} 
                            color={c.textMuted} 
                        />
                        <Text style={[styles.modeText, { color: c.textMuted }]}>
                            {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: c.border }]}>
                    <Text style={[styles.totalAmount, { color: c.text }]}>
                        ₪{item.pricing?.total?.toFixed(2) || '0.00'}
                    </Text>
                    
                    <View style={styles.actionButtonsRow}>
                        <Pressable 
                            style={({ pressed }) => [styles.actionBtn, { borderColor: c.border }, pressed && { opacity: 0.7 }]} 
                            onPress={() => setSelectedOrder(item)}
                        >
                            <Text style={[styles.actionBtnText, { color: c.text }]}>Details</Text>
                        </Pressable>
                        <Pressable 
                            style={({ pressed }) => [styles.actionBtn, { backgroundColor: c.accent, borderColor: c.accent }, pressed && { opacity: 0.7 }]}
                            onPress={() => handleReorder(item)}
                            disabled={isReordering}
                        >
                            {isReordering ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Order Again</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <Stack.Screen options={{ title: 'Order History', headerStyle: { backgroundColor: c.background }, headerTintColor: c.text }} />
                <ActivityIndicator size="large" color={c.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.fill, { backgroundColor: c.background }]}>
            <Stack.Screen 
                options={{ 
                    title: 'Order History',
                    headerStyle: { backgroundColor: c.background },
                    headerShadowVisible: false,
                    headerTintColor: c.text,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} style={{ paddingRight: 15 }}>
                            <Ionicons name="chevron-back" size={28} color={c.text} />
                        </Pressable>
                    ),
                    headerRight: () => <ThemeToggleButton />
                }} 
            />

            {error ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
                    <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id || item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderOrderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: c.accent + '15' }]}>
                                <Ionicons name="receipt-outline" size={56} color={c.accent} />
                            </View>
                            <Text style={[styles.emptyText, { color: c.text }]}>
                                You haven't placed any orders yet.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Order Details Modal */}
            <Modal
                visible={selectedOrder !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedOrder(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: c.surface, borderTopColor: c.border }]}>
                        {selectedOrder && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: c.text }]}>Order Details</Text>
                                    <Pressable onPress={() => setSelectedOrder(null)} hitSlop={10}>
                                        <Ionicons name="close" size={24} color={c.text} />
                                    </Pressable>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {/* Items List */}
                                    <View style={styles.modalSection}>
                                        <Text style={[styles.modalSectionTitle, { color: c.textMuted }]}>Items</Text>
                                        {selectedOrder.items.map((item, idx) => (
                                            <View key={idx} style={styles.modalItemRow}>
                                                <View style={styles.modalItemQtyBox}>
                                                    <Text style={{ color: c.text, fontWeight: 'bold' }}>{item.quantity}</Text>
                                                </View>
                                                <Text style={[styles.modalItemName, { color: c.text }]} numberOfLines={2}>{item.name}</Text>
                                                <Text style={[styles.modalItemPrice, { color: c.text }]}>₪{(item.price * item.quantity).toFixed(2)}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Order Notes */}
                                    {selectedOrder.notes ? (
                                        <View style={styles.modalSection}>
                                            <Text style={[styles.modalSectionTitle, { color: c.textMuted }]}>Notes</Text>
                                            <Text style={{ color: c.text }}>{selectedOrder.notes}</Text>
                                        </View>
                                    ) : null}

                                    {/* Pricing Breakdown */}
                                    <View style={[styles.modalSection, { borderBottomWidth: 0 }]}>
                                        <Text style={[styles.modalSectionTitle, { color: c.textMuted }]}>Summary</Text>
                                        <View style={styles.modalPriceRow}>
                                            <Text style={{ color: c.textMuted }}>Subtotal</Text>
                                            <Text style={{ color: c.text }}>₪{selectedOrder.pricing?.subtotal?.toFixed(2) || '0.00'}</Text>
                                        </View>
                                        <View style={styles.modalPriceRow}>
                                            <Text style={{ color: c.textMuted }}>Service Fee</Text>
                                            <Text style={{ color: c.text }}>₪{selectedOrder.pricing?.serviceFee?.toFixed(2) || '0.00'}</Text>
                                        </View>
                                        {selectedOrder.mode === 'delivery' && (
                                            <View style={styles.modalPriceRow}>
                                                <Text style={{ color: c.textMuted }}>Delivery Fee</Text>
                                                <Text style={{ color: c.text }}>₪{selectedOrder.pricing?.deliveryFee?.toFixed(2) || '0.00'}</Text>
                                            </View>
                                        )}
                                        {selectedOrder.pricing?.finalTip > 0 && (
                                            <View style={styles.modalPriceRow}>
                                                <Text style={{ color: c.textMuted }}>Courier Tip</Text>
                                                <Text style={{ color: c.text }}>₪{selectedOrder.pricing.finalTip.toFixed(2)}</Text>
                                            </View>
                                        )}
                                        <View style={[styles.modalPriceRow, styles.modalTotalRow, { borderTopColor: c.border }]}>
                                            <Text style={[styles.modalTotalText, { color: c.text }]}>Total</Text>
                                            <Text style={[styles.modalTotalText, { color: c.text }]}>₪{selectedOrder.pricing?.total?.toFixed(2) || '0.00'}</Text>
                                        </View>
                                    </View>
                                </ScrollView>
                                
                                {/* Close Button */}
                                <Pressable 
                                    style={[styles.modalCloseBtn, { backgroundColor: c.background }]} 
                                    onPress={() => setSelectedOrder(null)}
                                >
                                    <Text style={[styles.modalCloseBtnText, { color: c.text }]}>Close</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: Spacing[4], paddingBottom: Spacing[6] },
    
    card: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: Spacing[4],
        overflow: 'hidden'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing[4],
        paddingBottom: Spacing[2]
    },
    dateText: { fontSize: Typography.sm, fontWeight: '600' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing[3],
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusText: { fontSize: Typography.xs, fontWeight: '800' },
    
    cardBody: { padding: Spacing[4], paddingTop: 0 },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    itemsText: { flex: 1, fontSize: Typography.base, fontWeight: '500', lineHeight: 22 },
    modeText: { fontSize: Typography.sm, fontWeight: '600' },
    
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing[3],
        paddingHorizontal: Spacing[4],
        borderTopWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)'
    },
    totalAmount: { fontSize: Typography.base, fontWeight: '900' },
    
    actionButtonsRow: {
        flexDirection: 'row',
        gap: Spacing[2]
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80
    },
    actionBtnText: {
        fontSize: Typography.sm,
        fontWeight: '700'
    },
    
    errorText: { marginTop: Spacing[3], fontSize: Typography.base, fontWeight: '600' },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: Spacing[3] },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing[2],
    },
    emptyText: { fontSize: Typography.base, fontWeight: '600' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        maxHeight: '85%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        padding: Spacing[5],
        paddingBottom: 40
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing[4]
    },
    modalTitle: {
        fontSize: Typography.h3,
        fontWeight: '800'
    },
    modalSection: {
        paddingVertical: Spacing[3],
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc'
    },
    modalSectionTitle: {
        fontSize: Typography.sm,
        fontWeight: '700',
        marginBottom: Spacing[3],
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    modalItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing[3]
    },
    modalItemQtyBox: {
        width: 26,
        height: 26,
        backgroundColor: 'rgba(150,150,150,0.2)',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing[3]
    },
    modalItemName: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: '600',
        marginRight: Spacing[2]
    },
    modalItemPrice: {
        fontSize: Typography.base,
        fontWeight: '600'
    },
    modalPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing[2]
    },
    modalTotalRow: {
        marginTop: Spacing[3],
        paddingTop: Spacing[3],
        borderTopWidth: 1
    },
    modalTotalText: {
        fontSize: Typography.base,
        fontWeight: '800'
    },
    modalCloseBtn: {
        marginTop: Spacing[5],
        padding: Spacing[4],
        borderRadius: 12,
        alignItems: 'center'
    },
    modalCloseBtnText: {
        fontSize: Typography.base,
        fontWeight: '700'
    }
});