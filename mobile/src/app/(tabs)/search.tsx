import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { searchAll, type Product, type Restaurant } from '../../services/api';

export default function SearchScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;

    const [query, setQuery] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setRestaurants([]);
            setProducts([]);
            setSearchError(null);
            return;
        }
        setLoading(true);
        setSearchError(null);
        try {
            const result = await searchAll(q.trim());
            setRestaurants(result.restaurants);
            setProducts(result.products);
        } catch (err: unknown) {
            setRestaurants([]);
            setProducts([]);
            setSearchError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSearch(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, runSearch]);

    const hasResults = restaurants.length > 0 || products.length > 0;
    const showEmpty = !loading && !searchError && query.trim().length > 0 && !hasResults;

    type ListItem =
        | { _type: 'restaurant-header' }
        | { _type: 'restaurant'; item: Restaurant }
        | { _type: 'product-header' }
        | { _type: 'product'; item: Product };

    const listData: ListItem[] = [
        ...(restaurants.length > 0 ? [{ _type: 'restaurant-header' as const }] : []),
        ...restaurants.map((r) => ({ _type: 'restaurant' as const, item: r })),
        ...(products.length > 0 ? [{ _type: 'product-header' as const }] : []),
        ...products.map((p) => ({ _type: 'product' as const, item: p })),
    ];

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            {/* Search bar */}
            <View style={[styles.searchBar, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="search" size={18} color={c.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={[styles.input, { color: c.text }]}
                    placeholder="Restaurants, dishes..."
                    placeholderTextColor={c.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <Pressable onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={18} color={c.textMuted} />
                    </Pressable>
                )}
            </View>

            {loading && <ActivityIndicator color={c.accent} style={styles.loader} />}

            {!query.trim() && !loading && (
                <View style={styles.centered}>
                    <Ionicons name="search-outline" size={48} color={c.textMuted} />
                    <Text style={[styles.hint, { color: c.textMuted }]}>Start typing to search</Text>
                </View>
            )}

            {searchError && (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={32} color={c.textMuted} />
                    <Text style={[styles.hint, { color: c.textMuted }]}>{searchError}</Text>
                </View>
            )}

            {!searchError && showEmpty && (
                <View style={styles.centered}>
                    <Text style={[styles.hint, { color: c.textMuted }]}>No results for "{query}"</Text>
                </View>
            )}

            <FlatList
                data={listData}
                keyExtractor={(item, i) => {
                    if (item._type === 'restaurant') return `r-${item.item.id}`;
                    if (item._type === 'product') return `p-${item.item.id}`;
                    return `header-${item._type}-${i}`;
                }}
                renderItem={({ item }) => {
                    if (item._type === 'restaurant-header') {
                        return <Text style={[styles.sectionHeader, { color: c.text }]}>Restaurants</Text>;
                    }
                    if (item._type === 'product-header') {
                        return <Text style={[styles.sectionHeader, { color: c.text }]}>Dishes</Text>;
                    }
                    if (item._type === 'restaurant') {
                        const r = item.item;
                        return (
                            <Pressable
                                style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
                                onPress={() => router.push(`/restaurant/${r.id}`)}
                            >
                                <Ionicons name="restaurant-outline" size={20} color={c.accent} style={styles.rowIcon} />
                                <View style={styles.rowInfo}>
                                    <Text style={[styles.rowTitle, { color: c.text }]}>{r.name}</Text>
                                    <Text style={[styles.rowSub, { color: c.textMuted }]}>{r.category}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                            </Pressable>
                        );
                    }
                    // product
                    const p = item.item;
                    return (
                        <Pressable
                            style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
                            onPress={() => router.push(`/restaurant/${p.restaurantId}`)}
                        >
                            <Ionicons name="fast-food-outline" size={20} color={c.textMuted} style={styles.rowIcon} />
                            <View style={styles.rowInfo}>
                                <Text style={[styles.rowTitle, { color: c.text }]}>{p.name}</Text>
                                <Text style={[styles.rowSub, { color: c.textMuted }]}>₪{p.price}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                        </Pressable>
                    );
                }}
                contentContainerStyle={styles.results}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: Spacing[4],
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[2],
    },
    searchIcon: { marginRight: Spacing[2] },
    input: { flex: 1, fontSize: Typography.base },
    loader: { marginTop: Spacing[3] },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    hint: { fontSize: Typography.base, marginTop: Spacing[3] },
    results: { paddingBottom: Spacing[6] },
    sectionHeader: {
        fontSize: Typography.sm,
        fontWeight: '800',
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[2],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing[4],
        marginBottom: Spacing[2],
        borderRadius: 12,
        borderWidth: 1,
        padding: Spacing[3],
    },
    rowIcon: { marginRight: Spacing[3] },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: Typography.base, fontWeight: '600' },
    rowSub: { fontSize: Typography.sm, marginTop: 2 },
});
