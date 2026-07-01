import { useCallback, useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { AuthContext } from '../../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../../constants/theme';
import { getRestaurantOrders, updateOrderStatus, type Order } from '../../../services/api';

type OrderStatus = Order['status'];

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: string }> = {
    pending:    { label: 'Pending',      color: '#FF9500', icon: 'time-outline' },
    accepted:   { label: 'Accepted',     color: '#007AFF', icon: 'checkmark-circle-outline' },
    preparing:  { label: 'Preparing',    color: '#AF52DE', icon: 'restaurant-outline' },
    on_the_way: { label: 'On the way',   color: '#00C7BE', icon: 'bicycle-outline' },
    delivered:  { label: 'Delivered',    color: '#34C759', icon: 'checkmark-done-outline' },
    cancelled:  { label: 'Cancelled',    color: '#FF3B30', icon: 'close-circle-outline' },
};

const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; icon: string }[]>> = {
    pending:    [{ label: 'Accept',          next: 'accepted',   icon: 'checkmark-outline' },
                 { label: 'Cancel',          next: 'cancelled',  icon: 'close-outline' }],
    accepted:   [{ label: 'Start preparing', next: 'preparing',  icon: 'restaurant-outline' },
                 { label: 'Cancel',          next: 'cancelled',  icon: 'close-outline' }],
    preparing:  [{ label: 'Out for delivery',next: 'on_the_way', icon: 'bicycle-outline' },
                 { label: 'Cancel',          next: 'cancelled',  icon: 'close-outline' }],
    on_the_way: [{ label: 'Mark delivered',  next: 'delivered',  icon: 'checkmark-done-outline' }],
};

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function OrderCard({
    order,
    onStatusChange,
    colors: c,
}: {
    order: Order;
    onStatusChange: (id: string, status: OrderStatus) => void;
    colors: typeof Colors.light;
}) {
    const meta = STATUS_META[order.status];
    const actions = NEXT_ACTIONS[order.status] ?? [];
    const shortId = (order.id || order._id || '').slice(-6).toUpperCase();

    return (
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            {/* Header row */}
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.orderId, { color: c.text }]}>#{shortId}</Text>
                    <Text style={[styles.orderDate, { color: c.textMuted }]}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: meta.color + '20' }]}>
                    <Ionicons name={meta.icon as any} size={13} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
            </View>

            {/* Mode + payment */}
            <View style={styles.modePill}>
                <Ionicons
                    name={order.mode === 'delivery' ? 'bicycle-outline' : 'walk-outline'}
                    size={14}
                    color={c.textMuted}
                />
                <Text style={[styles.modeText, { color: c.textMuted }]}>
                    {order.mode === 'delivery' ? 'Delivery' : 'Pickup'} · {order.paymentMethod.replace('_', ' ')}
                </Text>
            </View>

            {/* Items */}
            <View style={[styles.itemsSection, { borderTopColor: c.border }]}>
                {order.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={[styles.itemQty, { color: c.accent }]}>{item.quantity}×</Text>
                        <Text style={[styles.itemName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.itemPrice, { color: c.textMuted }]}>₪{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            {/* Pricing */}
            <View style={[styles.pricingRow, { borderTopColor: c.border }]}>
                <Text style={[styles.totalLabel, { color: c.textMuted }]}>Total</Text>
                <Text style={[styles.totalAmount, { color: c.text }]}>₪{order.pricing.total.toFixed(2)}</Text>
            </View>

            {/* Notes */}
            {!!order.notes && (
                <View style={[styles.notesRow, { borderTopColor: c.border }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={c.textMuted} />
                    <Text style={[styles.notesText, { color: c.textMuted }]} numberOfLines={2}>{order.notes}</Text>
                </View>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
                <View style={[styles.actionsRow, { borderTopColor: c.border }]}>
                    {actions.map((action) => {
                        const isCancel = action.next === 'cancelled';
                        return (
                            <Pressable
                                key={action.next}
                                style={({ pressed }) => [
                                    styles.actionBtn,
                                    {
                                        backgroundColor: isCancel
                                            ? '#FF3B30' + '15'
                                            : c.accent + '15',
                                        borderColor: isCancel ? '#FF3B30' : c.accent,
                                    },
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() => onStatusChange(order.id || order._id || '', action.next)}
                            >
                                <Ionicons
                                    name={action.icon as any}
                                    size={14}
                                    color={isCancel ? '#FF3B30' : c.accent}
                                />
                                <Text style={[styles.actionText, { color: isCancel ? '#FF3B30' : c.accent }]}>
                                    {action.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

export default function RestaurantOrdersScreen() {
    const { isDark } = useContext(ThemeContext);
    const { token } = useContext(AuthContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { rid } = useLocalSearchParams<{ rid: string }>();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (!token || !rid) return;
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const data = await getRestaurantOrders(rid, token);
            setOrders(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [rid, token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load(true);
    }, [load]);

    const handleStatusChange = useCallback((orderId: string, status: OrderStatus) => {
        const isCancel = status === 'cancelled';
        const label = STATUS_META[status].label;

        Alert.alert(
            isCancel ? 'Cancel order?' : `Mark as "${label}"?`,
            isCancel ? 'This cannot be undone.' : `Move this order to "${label}".`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: isCancel ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            const updated = await updateOrderStatus(orderId, status, token!);
                            setOrders(prev =>
                                prev.map(o => (o.id === orderId || o._id === orderId) ? updated : o)
                            );
                        } catch (err: unknown) {
                            Alert.alert('Error', err instanceof Error ? err.message : 'Update failed');
                        }
                    },
                },
            ]
        );
    }, [token]);

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <ActivityIndicator size="large" color={c.accent} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <Ionicons name="wifi-outline" size={48} color={c.textMuted} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{error}</Text>
                <Pressable onPress={() => load()} style={[styles.retryBtn, { backgroundColor: c.accent }]}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: c.accent + '15' }]}>
                    <Ionicons name="receipt-outline" size={56} color={c.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>No orders yet</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                    Orders placed at this restaurant will appear here.
                </Text>
            </View>
        );
    }

    const pending = orders.filter(o => o.status === 'pending').length;

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            {pending > 0 && (
                <View style={[styles.alertBanner, { backgroundColor: '#FF9500' + '18', borderColor: '#FF9500' + '40' }]}>
                    <Ionicons name="time-outline" size={16} color="#FF9500" />
                    <Text style={styles.alertText}>
                        {pending} order{pending > 1 ? 's' : ''} waiting for acceptance
                    </Text>
                </View>
            )}
            <ScrollView
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.counter, { color: c.textMuted }]}>
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </Text>
                {orders.map(order => (
                    <OrderCard
                        key={order.id || order._id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        colors={c}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[5], gap: Spacing[3] },
    list: { padding: Spacing[4], gap: Spacing[4] },

    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing[2],
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        borderBottomWidth: 1,
    },
    alertText: { color: '#FF9500', fontWeight: '700', fontSize: Typography.sm },

    counter: { fontSize: Typography.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[1] },

    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: Spacing[4],
        paddingBottom: Spacing[2],
    },
    cardHeaderLeft: { gap: 2 },
    orderId: { fontSize: Typography.base, fontWeight: '800' },
    orderDate: { fontSize: Typography.xs },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    statusText: { fontSize: Typography.xs, fontWeight: '700' },

    modePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing[4],
        paddingBottom: Spacing[3],
    },
    modeText: { fontSize: Typography.xs, fontWeight: '600', textTransform: 'capitalize' },

    itemsSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[2] },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    itemQty: { fontWeight: '800', fontSize: Typography.sm, width: 24 },
    itemName: { flex: 1, fontSize: Typography.sm, fontWeight: '600' },
    itemPrice: { fontSize: Typography.sm },

    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    totalLabel: { fontSize: Typography.sm, fontWeight: '700' },
    totalAmount: { fontSize: Typography.base, fontWeight: '900' },

    notesRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing[2],
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    notesText: { flex: 1, fontSize: Typography.xs, lineHeight: 18 },

    actionsRow: {
        flexDirection: 'row',
        gap: Spacing[2],
        padding: Spacing[3],
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing[3],
        borderRadius: 10,
        borderWidth: 1,
    },
    actionText: { fontSize: Typography.xs, fontWeight: '700' },

    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing[2],
    },
    emptyTitle: { fontSize: Typography.h3, fontWeight: '800', textAlign: 'center' },
    emptyText: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 22 },

    retryBtn: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '700', fontSize: Typography.sm },
});
