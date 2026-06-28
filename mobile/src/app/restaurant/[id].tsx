import { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SectionList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { getMenu, getRestaurant, MEDIA_BASE, type MenuSection, type Product, type Restaurant } from '../../services/api';

function HeroImage({ uri, style }: { uri: string | undefined; style: object }) {
    const [err, setErr] = useState(false);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;

    if (!uri || err) {
        return (
            <View style={[style, { backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="fast-food-outline" size={64} color={c.textMuted} />
            </View>
        );
    }
    return <Image source={uri} style={style} contentFit="cover" onError={() => setErr(true)} />;
}

function ProductImage({ uri, style }: { uri: string | undefined; style: object }) {
    const [err, setErr] = useState(false);
    if (!uri || err) return null;
    return <Image source={uri} style={style} contentFit="cover" onError={() => setErr(true)} />;
}

export default function RestaurantScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [sections, setSections] = useState<MenuSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const [rest, menu] = await Promise.all([getRestaurant(id), getMenu(id)]);
            setRestaurant(rest);
            setSections(menu);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load menu');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <ActivityIndicator size="large" color={c.accent} />
            </View>
        );
    }

    if (error || !restaurant) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <Ionicons name="alert-circle-outline" size={48} color={c.textMuted} />
                <Text style={[styles.errorText, { color: c.textMuted }]}>{error ?? 'Restaurant not found'}</Text>
            </View>
        );
    }

    const sectionListData = sections.map((s) => ({
        title: s.title,
        data: s.items,
        key: s.id,
    }));

    return (
        <>
            <Stack.Screen options={{ title: restaurant.name }} />
            <SectionList
                style={{ backgroundColor: c.background }}
                contentContainerStyle={styles.list}
                sections={sectionListData}
                keyExtractor={(item: Product) => item.id}
                ListHeaderComponent={
                    <View>
                        <HeroImage
                            uri={restaurant.image ? `${MEDIA_BASE}${restaurant.image}` : undefined}
                            style={styles.heroImage}
                        />
                        <View style={[styles.heroBadgeRow, { backgroundColor: c.surface }]}>
                            <Text style={[styles.heroName, { color: c.text }]}>{restaurant.name}</Text>
                            <Text style={[styles.heroMeta, { color: c.textMuted }]}>
                                {restaurant.category}
                                {restaurant.rating > 0 ? `  ·  ★ ${restaurant.rating.toFixed(1)}` : ''}
                                {restaurant.openHours ? `  ·  ${restaurant.openHours}` : ''}
                            </Text>
                            {restaurant.description ? (
                                <Text style={[styles.heroDesc, { color: c.textMuted }]}>{restaurant.description}</Text>
                            ) : null}
                            <View style={styles.pillRow}>
                                <View style={[styles.pill, { backgroundColor: c.accent + '20' }]}>
                                    <Text style={[styles.pillText, { color: c.accent }]}>
                                        {restaurant.deliveryFee === 0 ? 'Free delivery' : `₪${restaurant.deliveryFee} delivery`}
                                    </Text>
                                </View>
                                {restaurant.deliveryTime > 0 && (
                                    <View style={[styles.pill, { backgroundColor: c.border }]}>
                                        <Text style={[styles.pillText, { color: c.textMuted }]}>
                                            {restaurant.deliveryTime} min
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                }
                renderSectionHeader={({ section }) => (
                    <Text style={[styles.sectionTitle, { color: c.text, backgroundColor: c.background }]}>
                        {section.title}
                    </Text>
                )}
                renderItem={({ item }: { item: Product }) => (
                    <View style={[styles.productCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                        <View style={styles.productInfo}>
                            <Text style={[styles.productName, { color: c.text }]}>{item.name}</Text>
                            {item.description ? (
                                <Text style={[styles.productDesc, { color: c.textMuted }]} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            ) : null}
                            <Text style={[styles.productPrice, { color: c.accent }]}>₪{item.price}</Text>
                        </View>
                        <ProductImage
                            uri={item.image ? `${MEDIA_BASE}${item.image}` : undefined}
                            style={styles.productImage}
                        />
                    </View>
                )}
                stickySectionHeadersEnabled
            />
        </>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, marginTop: 12, textAlign: 'center', paddingHorizontal: 24 },
    list: { paddingBottom: Spacing[6] },
    heroImage: { width: '100%', height: 220 },
    heroBadgeRow: { padding: Spacing[4] },
    heroName: { fontSize: Typography.h2, fontWeight: '900', marginBottom: Spacing[1] },
    heroMeta: { fontSize: Typography.sm, marginBottom: Spacing[2] },
    heroDesc: { fontSize: Typography.sm, marginBottom: Spacing[3] },
    pillRow: { flexDirection: 'row', gap: Spacing[2] },
    pill: { paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: 999 },
    pillText: { fontSize: Typography.xs, fontWeight: 'bold' },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: '800',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
    },
    productCard: {
        flexDirection: 'row',
        marginHorizontal: Spacing[4],
        marginBottom: Spacing[3],
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        padding: Spacing[3],
    },
    productInfo: { flex: 1, paddingRight: Spacing[3] },
    productName: { fontSize: Typography.base, fontWeight: '700', marginBottom: Spacing[1] },
    productDesc: { fontSize: Typography.xs, marginBottom: Spacing[2], lineHeight: 18 },
    productPrice: { fontSize: Typography.base, fontWeight: 'bold' },
    productImage: { width: 80, height: 80, borderRadius: 8 },
});
