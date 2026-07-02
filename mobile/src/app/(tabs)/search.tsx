import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { MEDIA_BASE, searchAll, getRestaurant, getMenu, type Product, type Restaurant, type MenuSection } from '../../services/api';

type SortOption = 'recommended' | 'time' | 'fee' | 'rating';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveImg(img?: string | null): string | undefined {
    if (!img) return undefined;
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `${MEDIA_BASE}${img}`;
}

type SearchRow =
    | { _type: 'rest-row';      restaurant: Restaurant; key: string }
    | { _type: 'dish-slider';   items: Product[];       key: string }
    | { _type: 'dish-single';   item: Product;          key: string }
    | { _type: 'dish-pair';     left: Product; right: Product | null; key: string }
    | { _type: 'dish-search-row'; item: Product; restaurant?: Restaurant; key: string }
    | { _type: 'separator';     key: string }
    | { _type: 'section-label'; label: string;          key: string };

function buildDishRows(items: Product[]): SearchRow[] {
    const rows: SearchRow[] = [];
    let i = 0;
    while (i < items.length) {
        rows.push({ _type: 'dish-single', item: items[i], key: `single-${items[i].id}` });
        i++;
        if (i < items.length) {
            rows.push({
                _type: 'dish-pair',
                left: items[i],
                right: items[i + 1] ?? null,
                key: `pair-${items[i].id}`,
            });
            i += 2;
        }
    }
    return rows;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DishCard({ item, large }: { item: Product; large: boolean }) {
    const { isDark } = useContext(ThemeContext);
    const uri = resolveImg(item.image);
    return (
        <Pressable
            style={[styles.dishCard, { height: large ? 130 : 61 }]}
            onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.restaurantId, openItem: item.id } })}
        >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0' }]}>
                {uri ? <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            </View>
            <View style={styles.dishCardOverlay}>
                <View style={styles.dishCardPill}>
                    <Text style={styles.dishCardText} numberOfLines={1}>
                        ₪{item.price}{'  ·  '}{item.name}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

function SearchDishRow({ item, restaurant }: { item: Product; restaurant?: Restaurant }) {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const uri = resolveImg(item.image);
    return (
        <Pressable
            style={[{ flexDirection: 'row', gap: Spacing[3], paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] }]}
            onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.restaurantId, openItem: item.id } })}
        >
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                {item.description ? (
                    <Text style={{ fontSize: 13, color: c.textMuted, marginBottom: 8 }} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <Text style={{ fontSize: 15, color: c.text, fontWeight: '600' }}>₪{item.price}</Text>
                {restaurant && (
                    <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}>
                        From {restaurant.name} · {restaurant.deliveryTime > 0 ? `${restaurant.deliveryTime} min` : 'Free delivery'} 
                    </Text>
                )}
            </View>
            {uri && (
                <View style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', backgroundColor: isDark ? '#1a1a1a' : '#eee' }}>
                    <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                </View>
            )}
        </Pressable>
    );
}

function DishSlider({ items }: { items: Product[] }) {
    const chunks = useMemo(() => {
        const res = [];
        let i = 0;
        while (i < items.length) {
            res.push(items.slice(i, i + 3));
            i += 3;
        }
        return res;
    }, [items]);

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderContent} snapToInterval={280 + 140 + 20} decelerationRate="fast">
            {chunks.map((chunk, idx) => (
                <View key={idx} style={styles.sliderChunk}>
                    <View style={styles.sliderLarge}>
                        <DishCard item={chunk[0]} large={true} />
                    </View>
                    {(chunk[1] || chunk[2]) && (
                        <View style={styles.sliderSmallCol}>
                            {chunk[1] && <View style={styles.sliderSmall}><DishCard item={chunk[1]} large={false} /></View>}
                            {chunk[2] && <View style={styles.sliderSmall}><DishCard item={chunk[2]} large={false} /></View>}
                        </View>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

function RestRow({ restaurant: r }: { restaurant: Restaurant }) {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const uri = resolveImg(r.image);
    return (
        <Pressable
            style={[styles.restRow, { backgroundColor: c.surface }]}
            onPress={() => router.push(`/restaurant/${r.id}`)}
        >
            <View style={[styles.restRowImg, { backgroundColor: isDark ? '#222' : '#eee' }]}>
                {uri ? (
                    <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                    <Ionicons name="restaurant-outline" size={22} color={c.textMuted} />
                )}
            </View>
            <View style={styles.restRowInfo}>
                <Text style={[styles.restRowName, { color: c.text }]} numberOfLines={1}>{r.name}</Text>
                <Text style={[styles.restRowMeta, { color: c.textMuted }]} numberOfLines={1}>
                    {[
                        r.deliveryFee === 0 ? 'Free delivery' : `₪${r.deliveryFee}`,
                        r.deliveryTime > 0 ? `${r.deliveryTime} min` : null,
                        r.rating > 0 ? `☺ ${r.rating.toFixed(1)}` : null,
                    ].filter(Boolean).join('  ·  ')}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
        </Pressable>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SearchScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();

    const [query, setQuery]               = useState('');
    const [restaurants, setRestaurants]   = useState<Restaurant[]>([]);
    const [products, setProducts]         = useState<Product[]>([]);
    const [loading, setLoading]           = useState(false);
    const [searchError, setSearchError]   = useState<string | null>(null);
    const [fetchedRestaurants, setFetchedRestaurants] = useState<Record<string, Restaurant>>({});
    const [restaurantMenus, setRestaurantMenus] = useState<Record<string, Product[]>>({});
    const [filterMode, setFilterMode]     = useState<'all' | 'restaurants' | 'items'>('all');
    const [filtersOpen, setFiltersOpen]   = useState(false);
    const [sortBy, setSortBy]             = useState<SortOption>('recommended');
    const [freeDelivery, setFreeDelivery] = useState(false);
    const [minRating, setMinRating]       = useState<number | null>(null);
    const [maxDelivery, setMaxDelivery]   = useState<number | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef    = useRef<TextInput>(null);

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 300);
        return () => clearTimeout(t);
    }, []);

    useFocusEffect(useCallback(() => {
        return () => {
            setQuery('');
            setFiltersOpen(false);
        };
    }, []));

    const runSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setRestaurants([]); setProducts([]); setSearchError(null);
            return;
        }
        setLoading(true);
        setSearchError(null);
        try {
            const res = await searchAll(q.trim());
            
            setRestaurants(res.restaurants);
            setProducts(res.products);
            
            const restIdSet = new Set(res.restaurants.map(r => r.id));
            const missingIds = Array.from(new Set(res.products.map(p => p.restaurantId).filter(id => !restIdSet.has(id))));
            
            Promise.all([
                missingIds.length > 0 ? Promise.all(missingIds.map(id => getRestaurant(id).catch(() => null))) : Promise.resolve([]),
                res.restaurants.length > 0 ? Promise.all(res.restaurants.map(r => getMenu(r.id).catch(() => []))) : Promise.resolve([])
            ]).then(([missing, menus]) => {
                if (missingIds.length > 0) {
                    setFetchedRestaurants(prev => {
                        const next = { ...prev };
                        missing.forEach(r => { if (r) next[r.id] = r as Restaurant; });
                        return next;
                    });
                }
                if (res.restaurants.length > 0) {
                    setRestaurantMenus(prev => {
                        const next = { ...prev };
                        res.restaurants.forEach((r, i) => {
                            const menu = menus[i] as MenuSection[];
                            next[r.id] = menu.flatMap(s => s.items).filter(item => item.isAvailable !== false).slice(0, 6);
                        });
                        return next;
                    });
                }
            });

        } catch (err: unknown) {
            setRestaurants([]); setProducts([]);
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

    const filteredRestaurants = useMemo(() => {
        let list = restaurants.filter(r => {
            if (freeDelivery && r.deliveryFee !== 0) return false;
            if (minRating !== null && r.rating < minRating) return false;
            if (maxDelivery !== null && r.deliveryTime > maxDelivery) return false;
            return true;
        });
        if (sortBy === 'time') list.sort((a, b) => a.deliveryTime - b.deliveryTime);
        else if (sortBy === 'fee') list.sort((a, b) => a.deliveryFee - b.deliveryFee);
        else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
        return list;
    }, [restaurants, freeDelivery, minRating, maxDelivery, sortBy]);

    const productsByRestaurant = useMemo(() => {
        const map = new Map<string, Product[]>();
        for (const p of products) {
            const list = map.get(p.restaurantId) ?? [];
            list.push(p);
            map.set(p.restaurantId, list);
        }
        return map;
    }, [products]);

    // All matched restaurants (direct name/description/category matches + ones pulled in via product matches).
    const allRestsMap = useMemo(() => {
        const map = new Map<string, Restaurant>();
        for (const r of restaurants) map.set(r.id, r);
        for (const [id, r] of Object.entries(fetchedRestaurants)) map.set(id, r);
        return map;
    }, [restaurants, fetchedRestaurants]);

    // Per-restaurant items: prefer products that actually matched the search text, falling back to the
    // restaurant's recommended menu when it matched by name/description/category alone (no product matches).
    const effectiveItemsByRestaurant = useMemo(() => {
        const map = new Map<string, Product[]>();
        for (const [id] of allRestsMap) {
            map.set(id, productsByRestaurant.get(id) ?? restaurantMenus[id] ?? []);
        }
        return map;
    }, [allRestsMap, productsByRestaurant, restaurantMenus]);

    const listRows = useMemo((): SearchRow[] => {
        const rows: SearchRow[] = [];

        if (filterMode === 'items') {
            for (const [restId, items] of effectiveItemsByRestaurant.entries()) {
                const r = allRestsMap.get(restId);
                for (const item of items) {
                    rows.push({ _type: 'dish-search-row', item, restaurant: r, key: `search-row-${item.id}` });
                }
            }
            return rows;
        }

        if (filterMode === 'restaurants') {
            for (let i = 0; i < filteredRestaurants.length; i++) {
                const r = filteredRestaurants[i];
                if (i > 0) rows.push({ _type: 'separator', key: `sep-${i}` });
                rows.push({ _type: 'rest-row', restaurant: r, key: `rest-${r.id}` });

                const recommended = restaurantMenus[r.id] ?? [];
                if (recommended.length > 0) {
                    rows.push({ _type: 'dish-slider', items: recommended, key: `slider-${r.id}` });
                }
            }
            return rows;
        }

        if (filterMode === 'all') {
            const relevantRests = [];
            for (const [restId, items] of effectiveItemsByRestaurant.entries()) {
                const r = allRestsMap.get(restId);
                if (r) {
                    if (freeDelivery && r.deliveryFee !== 0) continue;
                    if (minRating !== null && r.rating < minRating) continue;
                    if (maxDelivery !== null && r.deliveryTime > maxDelivery) continue;
                    relevantRests.push({ r, items });
                }
            }

            if (sortBy === 'time') relevantRests.sort((a, b) => a.r.deliveryTime - b.r.deliveryTime);
            else if (sortBy === 'fee') relevantRests.sort((a, b) => a.r.deliveryFee - b.r.deliveryFee);
            else if (sortBy === 'rating') relevantRests.sort((a, b) => b.r.rating - a.r.rating);

            for (let i = 0; i < relevantRests.length; i++) {
                const { r, items } = relevantRests[i];
                if (i > 0) rows.push({ _type: 'separator', key: `sep-${i}` });
                rows.push({ _type: 'rest-row', restaurant: r, key: `rest-${r.id}` });
                if (items.length > 0) rows.push({ _type: 'dish-slider', items: items, key: `slider-${r.id}` });
            }
            return rows;
        }

        return rows;
    }, [filterMode, filteredRestaurants, allRestsMap, effectiveItemsByRestaurant, restaurantMenus, freeDelivery, minRating, maxDelivery, sortBy]);

    const hasResults = listRows.length > 0;
    const showEmpty  = !loading && !searchError && query.trim().length > 0 && !hasResults;
    const activeFiltersCount = [freeDelivery, minRating !== null, maxDelivery !== null].filter(Boolean).length;

    const searchBg      = isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0';
    const chipActiveBg  = c.accent;
    const chipIdleBg    = isDark ? 'rgba(255,255,255,0.1)' : '#EFEFEF';

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            <View style={{ height: insets.top + 6, backgroundColor: c.surface }} />

            <View style={[styles.searchWrap, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
                <View style={[styles.searchPill, { backgroundColor: searchBg }]}>
                    <Pressable hitSlop={8} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={20} color={c.textMuted} />
                    </Pressable>
                    <TextInput
                        ref={inputRef}
                        style={[styles.searchInput, { color: c.text }]}
                        placeholder="Restaurants, dishes..."
                        placeholderTextColor={c.textMuted}
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <Pressable hitSlop={8} onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={16} color={c.textMuted} />
                        </Pressable>
                    )}
                </View>
            </View>

            <View style={[styles.filterRowWrap, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Pressable
                        style={[
                            styles.filterIconBtn,
                            { backgroundColor: chipIdleBg, borderColor: activeFiltersCount > 0 ? c.accent : 'transparent', borderWidth: 1.5 },
                        ]}
                        onPress={() => setFiltersOpen(o => !o)}
                    >
                        <Ionicons name="options-outline" size={15} color={activeFiltersCount > 0 ? c.accent : c.text} />
                        {activeFiltersCount > 0 && (
                            <View style={[styles.filterBadge, { backgroundColor: c.accent }]}>
                                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                            </View>
                        )}
                    </Pressable>
                    <Pressable
                        style={[styles.chip, { backgroundColor: filterMode === 'restaurants' ? chipActiveBg : chipIdleBg }]}
                        onPress={() => setFilterMode(m => m === 'restaurants' ? 'all' : 'restaurants')}
                    >
                        <Ionicons name="restaurant-outline" size={12} color={filterMode === 'restaurants' ? '#fff' : c.text} />
                        <Text style={[styles.chipText, { color: filterMode === 'restaurants' ? '#fff' : c.text }]}>Restaurants</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.chip, { backgroundColor: filterMode === 'items' ? chipActiveBg : chipIdleBg }]}
                        onPress={() => setFilterMode(m => m === 'items' ? 'all' : 'items')}
                    >
                        <Ionicons name="fast-food-outline" size={12} color={filterMode === 'items' ? '#fff' : c.text} />
                        <Text style={[styles.chipText, { color: filterMode === 'items' ? '#fff' : c.text }]}>Items</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.chip, { backgroundColor: chipIdleBg }]}
                        onPress={() => setFiltersOpen(true)}
                    >
                        <Text style={[styles.chipText, { color: c.text }]}>Sort by {sortBy !== 'recommended' ? '•' : ''}</Text>
                        <Ionicons name="chevron-down" size={12} color={c.text} />
                    </Pressable>
                </ScrollView>
            </View>

            <Modal visible={filtersOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setFiltersOpen(false)} />
                    <View style={[styles.modalContent, { backgroundColor: c.background, paddingBottom: insets.bottom + Spacing[4] }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: c.text }]}>Sort & Filters</Text>
                            <Pressable hitSlop={8} onPress={() => setFiltersOpen(false)}>
                                <Ionicons name="close" size={24} color={c.text} />
                            </Pressable>
                        </View>
                        
                        <ScrollView style={{ paddingHorizontal: Spacing[4] }}>
                            <Text style={[styles.modalSectionTitle, { color: c.text }]}>Sort by</Text>
                            {(['recommended', 'time', 'fee', 'rating'] as const).map(option => (
                                <Pressable
                                    key={option}
                                    style={styles.modalOption}
                                    onPress={() => setSortBy(option)}
                                >
                                    <Text style={[styles.modalOptionText, { color: c.text }]}>
                                        {option === 'recommended' ? 'Recommended' : option === 'time' ? 'Delivery time' : option === 'fee' ? 'Delivery fee' : 'Rating'}
                                    </Text>
                                    {sortBy === option && <Ionicons name="checkmark" size={20} color={c.accent} />}
                                </Pressable>
                            ))}

                            <Text style={[styles.modalSectionTitle, { color: c.text, marginTop: Spacing[6] }]}>Filters</Text>
                            
                            <Pressable style={styles.modalOption} onPress={() => setFreeDelivery(!freeDelivery)}>
                                <Text style={[styles.modalOptionText, { color: c.text }]}>Free delivery</Text>
                                {freeDelivery && <Ionicons name="checkmark" size={20} color={c.accent} />}
                            </Pressable>

                            <Text style={[styles.modalSubTitle, { color: c.textMuted, marginTop: Spacing[4] }]}>Rating</Text>
                            <View style={styles.filterOptionsRow}>
                                {([4, 4.5] as const).map(r => (
                                    <Pressable
                                        key={r}
                                        style={[styles.chipModal, { backgroundColor: minRating === r ? c.accent : chipIdleBg }]}
                                        onPress={() => setMinRating(v => v === r ? null : r)}
                                    >
                                        <Text style={[styles.chipText, { color: minRating === r ? '#fff' : c.text }]}>{r}+ ☺</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={[styles.modalSubTitle, { color: c.textMuted, marginTop: Spacing[4] }]}>Max Delivery Time</Text>
                            <View style={styles.filterOptionsRow}>
                                {([20, 30, 45] as const).map(t => (
                                    <Pressable
                                        key={t}
                                        style={[styles.chipModal, { backgroundColor: maxDelivery === t ? c.accent : chipIdleBg }]}
                                        onPress={() => setMaxDelivery(v => v === t ? null : t)}
                                    >
                                        <Text style={[styles.chipText, { color: maxDelivery === t ? '#fff' : c.text }]}>{'<'}{t} min</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                        
                        <View style={{ padding: Spacing[4] }}>
                            <Pressable
                                style={[styles.modalDoneBtn, { backgroundColor: c.accent }]}
                                onPress={() => setFiltersOpen(false)}
                            >
                                <Text style={styles.modalDoneText}>Done</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {loading && <ActivityIndicator color={c.accent} style={styles.loader} />}

            {!query.trim() && !loading && (
                <View style={styles.centered}>
                    <View style={styles.emptyIconRow}>
                        <Ionicons name="search" size={70} color="#2db4e8" style={{ transform: [{ rotate: '-15deg' }, { translateX: 10 }] }} />
                        <Ionicons name="search" size={60} color="#61c7ed" style={{ transform: [{ rotate: '15deg' }, { translateX: -10 }] }} />
                    </View>
                    <Text style={[styles.hint, { color: c.textMuted }]}>Search for restaurants or dishes.</Text>
                </View>
            )}

            {searchError && (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={36} color={c.textMuted} />
                    <Text style={[styles.hint, { color: c.textMuted }]}>{searchError}</Text>
                </View>
            )}

            {showEmpty && (
                <View style={styles.centered}>
                    <Ionicons name="search-outline" size={36} color={c.textMuted} />
                    <Text style={[styles.hint, { color: c.textMuted }]}>No results for "{query}"</Text>
                </View>
            )}

            <FlatList
                data={listRows}
                keyExtractor={item => item.key}
                renderItem={({ item }) => {
                    if (item._type === 'separator') {
                        return <View style={{ height: Spacing[3], backgroundColor: c.background }} />;
                    }
                    if (item._type === 'section-label') {
                        return (
                            <View style={[styles.sectionLabelWrap, { backgroundColor: c.background }]}>
                                <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{item.label}</Text>
                            </View>
                        );
                    }
                    if (item._type === 'rest-row') {
                        return <RestRow restaurant={item.restaurant} />;
                    }
                    if (item._type === 'dish-slider') {
                        return <DishSlider items={item.items} />;
                    }
                    if (item._type === 'dish-search-row') {
                        return <SearchDishRow item={item.item} restaurant={item.restaurant} />;
                    }
                    if (item._type === 'dish-single') {
                        return (
                            <View style={{ paddingHorizontal: Spacing[4] }}>
                                <DishCard item={item.item} large />
                            </View>
                        );
                    }
                    if (item._type === 'dish-pair') {
                        return (
                            <View style={[styles.dishPairRow, { paddingHorizontal: Spacing[4] }]}>
                                <View style={{ flex: 1 }}>
                                    <DishCard item={item.left} large={false} />
                                </View>
                                {item.right ? (
                                    <View style={{ flex: 1 }}>
                                        <DishCard item={item.right} large={false} />
                                    </View>
                                ) : (
                                    <View style={{ flex: 1 }} />
                                )}
                            </View>
                        );
                    }
                    return null;
                }}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: Spacing[2] }} />}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },

    searchWrap: {
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[2],
        paddingBottom: Spacing[3],
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    searchPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        height: 44,
        paddingHorizontal: 14,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: Typography.base },

    filterRowWrap: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        gap: Spacing[2],
    },
    filterIconBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    filterBadge: {
        position: 'absolute', top: -4, right: -4,
        width: 16, height: 16, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 999,
    },
    chipText: { fontSize: Typography.sm, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalSectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: Spacing[4], marginBottom: Spacing[2] },
    modalSubTitle: { fontSize: 14, fontWeight: '600', marginBottom: Spacing[2] },
    modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalOptionText: { fontSize: 16 },
    modalDoneBtn: { padding: Spacing[4], borderRadius: 8, alignItems: 'center' },
    modalDoneText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    filterOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[2] },
    chipModal: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderRadius: 20 },

    loader: { marginTop: Spacing[3] },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
    emptyIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2] },
    hint: { fontSize: Typography.base },

    listContent: { paddingBottom: 100 },

    sectionLabelWrap: { paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Spacing[1] },
    sectionLabel: { fontSize: Typography.xs, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },

    restRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        gap: Spacing[3],
    },
    restRowImg: {
        width: 56, height: 56, borderRadius: 10,
        overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
    },
    restRowInfo: { flex: 1 },
    restRowName: { fontSize: Typography.base, fontWeight: '700', marginBottom: 3 },
    restRowMeta: { fontSize: Typography.xs },

    dishCard: { overflow: 'hidden', borderRadius: 12 },
    dishCardOverlay: {
        flex: 1,
        padding: Spacing[2],
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
    },
    dishCardPill: {
        backgroundColor: '#fff',
        paddingHorizontal: Spacing[2],
        paddingVertical: 4,
        borderRadius: 999,
        maxWidth: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dishCardText: { color: '#000', fontSize: Typography.xs, fontWeight: '700' },

    dishPairRow: { flexDirection: 'row', gap: Spacing[2] },

    sliderContent: {
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        gap: Spacing[2],
    },
    sliderChunk: {
        flexDirection: 'row',
        gap: Spacing[2],
    },
    sliderLarge: {
        width: 260,
    },
    sliderSmallCol: {
        width: 140,
        gap: Spacing[2],
        justifyContent: 'space-between',
    },
    sliderSmall: {
        height: 96,
    },
});
