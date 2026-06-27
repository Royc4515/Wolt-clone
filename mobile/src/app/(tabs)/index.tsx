import { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { getRestaurants, MEDIA_BASE, type Restaurant } from '../../services/api';

function RestaurantImage({ uri, style }: { uri: string | undefined; style: object }) {
    const [err, setErr] = useState(false);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;

    if (!uri || err) {
        return (
            <View style={[style, { backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="fast-food-outline" size={36} color={c.textMuted} />
            </View>
        );
    }
    return <Image source={uri} style={style} contentFit="cover" onError={() => setErr(true)} />;
}

export default function HomeScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const data = await getRestaurants();
            setRestaurants(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load restaurants');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        load();
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
                <Text style={[styles.errorText, { color: c.textMuted }]}>{error}</Text>
                <Pressable onPress={load} style={[styles.retryBtn, { backgroundColor: c.accent }]}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <FlatList
            style={{ backgroundColor: c.background }}
            contentContainerStyle={styles.list}
            data={restaurants}
            keyExtractor={(r) => r.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
            ListHeaderComponent={
                <Text style={[styles.header, { color: c.text }]}>Restaurants near you</Text>
            }
            renderItem={({ item }) => (
                <Pressable
                    style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
                    onPress={() => router.push(`/restaurant/${item.id}`)}
                >
                    <RestaurantImage
                        uri={item.image ? `${MEDIA_BASE}${item.image}` : undefined}
                        style={styles.cardImage}
                    />
                    <View style={styles.cardBody}>
                        <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.cardMeta, { color: c.textMuted }]}>
                            {item.category}
                            {item.rating > 0 ? `  ·  ★ ${item.rating.toFixed(1)}` : ''}
                        </Text>
                        <View style={styles.cardRow}>
                            <View style={[styles.badge, { backgroundColor: c.accent + '20' }]}>
                                <Text style={[styles.badgeText, { color: c.accent }]}>
                                    {item.deliveryFee === 0 ? 'Free delivery' : `Delivery ₪${item.deliveryFee}`}
                                </Text>
                            </View>
                            {item.deliveryTime > 0 && (
                                <Text style={[styles.cardMeta, { color: c.textMuted, marginLeft: Spacing[2] }]}>
                                    {item.deliveryTime} min
                                </Text>
                            )}
                        </View>
                    </View>
                </Pressable>
            )}
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Text style={{ color: c.textMuted }}>No restaurants found.</Text>
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: Spacing[4] },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
    header: { fontSize: Typography.h2, fontWeight: '900', marginBottom: Spacing[4], letterSpacing: -0.5 },
    card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: Spacing[4] },
    cardImage: { width: '100%', height: 160 },
    cardBody: { padding: Spacing[4] },
    cardName: { fontSize: Typography.h3, fontWeight: 'bold', marginBottom: Spacing[1] },
    cardMeta: { fontSize: Typography.sm, marginBottom: Spacing[2] },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: 999 },
    badgeText: { fontSize: Typography.xs, fontWeight: 'bold' },
    errorText: { fontSize: Typography.base, marginTop: Spacing[3], marginBottom: Spacing[4], textAlign: 'center' },
    retryBtn: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: 'bold', fontSize: Typography.base },
});
