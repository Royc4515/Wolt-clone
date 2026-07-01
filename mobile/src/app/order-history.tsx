import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator,
    Pressable
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getUserOrders, type Order } from '../services/api';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

// Helper to format ISO date to readable string
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

// Helper to get color based on order status
const getStatusColor = (status: string, c: any) => {
    switch (status) {
        case 'delivered': return '#34C759'; // Green
        case 'cancelled': return c.danger; // Red
        case 'pending': return '#FF9500'; // Orange
        default: return c.accent; // Blue/Brand color for processing states
    }
};

export default function OrderHistoryScreen() {
    const { token, user } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const c = isDark ? Colors.dark : Colors.light;

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

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

    const renderOrderItem = ({ item }: { item: Order }) => {
        const statusColor = getStatusColor(item.status, c);
        // Summarize items for display
        const itemsSummary = item.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

        return (
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.dateText, { color: c.textMuted }]}>
                        {formatDate(item.createdAt)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.status.toUpperCase()}
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
                    <Text style={[styles.totalLabel, { color: c.text }]}>Total</Text>
                    <Text style={[styles.totalAmount, { color: c.text }]}>
                        ₪{item.pricing.total.toFixed(2)}
                    </Text>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <Stack.Screen options={{ 
                    title: 'Order History', 
                    headerStyle: { backgroundColor: c.background }, 
                    headerTintColor: c.text,
                    headerRight: () => <ThemeToggleButton/>
                }} />
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
                    headerBackTitle: 'Profile',
                    headerRight: () => <ThemeToggleButton/>
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
                            <Ionicons name="receipt-outline" size={64} color={c.textMuted} />
                            <Text style={[styles.emptyText, { color: c.textMuted }]}>
                                You haven't placed any orders yet.
                            </Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: Spacing[3],
        paddingVertical: 4,
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
        padding: Spacing[4],
        borderTopWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)'
    },
    totalLabel: { fontSize: Typography.sm, fontWeight: '700' },
    totalAmount: { fontSize: Typography.base, fontWeight: '900' },
    
    errorText: { marginTop: Spacing[3], fontSize: Typography.base, fontWeight: '600' },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: Spacing[3] },
    emptyText: { fontSize: Typography.base, fontWeight: '600' }
});