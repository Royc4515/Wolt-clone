import { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { deleteRestaurant, getRestaurants, type Restaurant } from '../../services/api';

export default function OwnerDashboardScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { token, user } = useAuth();

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const all = await getRestaurants();
            setRestaurants(all.filter((r) => r.ownerId === user?.id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load restaurants');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!token) { router.replace('/(tabs)/profile'); return; }
        load();
    }, [token, load]);

    const handleDelete = (r: Restaurant) => {
        Alert.alert(
            'Delete restaurant',
            `Delete "${r.name}"? This will also remove all its products.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteRestaurant(r.id, token!);
                            setRestaurants((prev) => prev.filter((x) => x.id !== r.id));
                        } catch (err: unknown) {
                            Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed');
                        }
                    },
                },
            ]
        );
    };

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
                <Pressable onPress={load} style={[styles.retryBtn, { backgroundColor: c.accent }]}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            <FlatList
                data={restaurants}
                keyExtractor={(r) => r.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Ionicons name="storefront-outline" size={48} color={c.textMuted} />
                        <Text style={[styles.emptyText, { color: c.textMuted }]}>
                            You have no restaurants yet.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                        <View style={styles.cardInfo}>
                            <Text style={[styles.cardName, { color: c.text }]}>{item.name}</Text>
                            <Text style={[styles.cardMeta, { color: c.textMuted }]}>
                                {item.category}
                                {item.rating > 0 ? `  ·  ★ ${item.rating.toFixed(1)}` : ''}
                            </Text>
                        </View>
                        <View style={styles.cardActions}>
                            <Pressable
                                onPress={() => router.push(`/restaurant/${item.id}`)}
                                style={[styles.actionBtn, { backgroundColor: c.accent + '20' }]}
                            >
                                <Ionicons name="eye-outline" size={18} color={c.accent} />
                            </Pressable>
                            <Pressable
                                onPress={() => handleDelete(item)}
                                style={[styles.actionBtn, { backgroundColor: c.danger + '20' }]}
                            >
                                <Ionicons name="trash-outline" size={18} color={c.danger} />
                            </Pressable>
                        </View>
                    </View>
                )}
            />

            <Pressable
                style={[styles.fab, { backgroundColor: c.accent }]}
                onPress={() => router.push('/owner/new-restaurant')}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[5] },
    list: { padding: Spacing[4], paddingBottom: 100 },
    emptyText: { marginTop: Spacing[3], fontSize: Typography.base, textAlign: 'center' },
    retryBtn: { marginTop: Spacing[4], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: 'bold', fontSize: Typography.base },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        padding: Spacing[4],
        marginBottom: Spacing[3],
    },
    cardInfo: { flex: 1 },
    cardName: { fontSize: Typography.base, fontWeight: '700', marginBottom: 2 },
    cardMeta: { fontSize: Typography.sm },
    cardActions: { flexDirection: 'row', gap: Spacing[2] },
    actionBtn: { padding: Spacing[2], borderRadius: 8 },
    fab: {
        position: 'absolute',
        bottom: Spacing[6],
        right: Spacing[5],
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
