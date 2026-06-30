import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { getRestaurants, MEDIA_BASE, type Restaurant } from '../../services/api';
import { getGuestLocation } from '../../services/authStorage';
import { AuthContext } from '../../context/AuthContext';

// ── Static category image map (public/images/categories/) ──────────────────

const _img = (name: string) => `${MEDIA_BASE}/images/categories/${name}.jpg`;

const CATEGORY_IMAGE_URIS: Record<string, string> = {
    'Burgers':   _img('burgers'),
    'Pizza':     _img('pizza'),
    'Sushi':     _img('sushi'),
    'Salads':    _img('salads'),
    'Salad':     _img('salads'),
    'Desserts':  _img('desserts'),
    'Asian':     _img('asian'),
    'Chinese':   _img('asian'),
    'Japanese':  _img('asian'),
    'Mexican':   _img('mexican'),
    'Pasta':     _img('pasta'),
    'Italian':   _img('pasta'),
};

// ── Category metadata ──────────────────────────────────────────────────────

type CategoryMeta = { emoji: string; tileBg: string; tileBgDark: string };

const CATEGORY_META: Record<string, CategoryMeta> = {
    'All':           { emoji: '🍽', tileBg: '#FFF9F0', tileBgDark: '#2A2015' },
    'Burgers':       { emoji: '🍔', tileBg: '#FFF0E8', tileBgDark: '#2A1500' },
    'Pizza':         { emoji: '🍕', tileBg: '#FFF5E8', tileBgDark: '#2A1800' },
    'Sushi':         { emoji: '🍣', tileBg: '#EDF6FF', tileBgDark: '#0A1528' },
    'Japanese':      { emoji: '🍜', tileBg: '#EDF6FF', tileBgDark: '#0A1528' },
    'Chinese':       { emoji: '🥡', tileBg: '#FFF0F0', tileBgDark: '#2A0A0A' },
    'Italian':       { emoji: '🍝', tileBg: '#FFFAE8', tileBgDark: '#2A2000' },
    'Salad':         { emoji: '🥗', tileBg: '#F0FFF4', tileBgDark: '#082800' },
    'Salads':        { emoji: '🥗', tileBg: '#F0FFF4', tileBgDark: '#082800' },
    'Cafe':          { emoji: '☕', tileBg: '#FDF5EB', tileBgDark: '#2A1500' },
    'Mexican':       { emoji: '🌮', tileBg: '#FFF5E8', tileBgDark: '#2A1500' },
    'Indian':        { emoji: '🍛', tileBg: '#FFFAE8', tileBgDark: '#2A1800' },
    'Seafood':       { emoji: '🦞', tileBg: '#EDF6FF', tileBgDark: '#0A1228' },
    'Steakhouse':    { emoji: '🥩', tileBg: '#FFF0F0', tileBgDark: '#2A0A0A' },
    'Kosher':        { emoji: '🕎', tileBg: '#F5F0FF', tileBgDark: '#10082A' },
    'Desserts':      { emoji: '🍰', tileBg: '#FFF0F8', tileBgDark: '#2A0A15' },
    'Asian':         { emoji: '🥢', tileBg: '#EDF6FF', tileBgDark: '#0A1528' },
    'Mediterranean': { emoji: '🫒', tileBg: '#F5FFE8', tileBgDark: '#082800' },
    'Vegan':         { emoji: '🥬', tileBg: '#F0FFF4', tileBgDark: '#082800' },
    'Steak':         { emoji: '🥩', tileBg: '#FFF0F0', tileBgDark: '#2A0A0A' },
    'Pasta':         { emoji: '🍝', tileBg: '#FFFAE8', tileBgDark: '#2A2000' },
    'Sandwiches':    { emoji: '🥪', tileBg: '#FFF5E0', tileBgDark: '#2A1A00' },
};
const DEFAULT_META: CategoryMeta = { emoji: '🍴', tileBg: '#F5F5F5', tileBgDark: '#1A1A2A' };

function getMeta(cat: string, isDark: boolean) {
    const m = CATEGORY_META[cat] ?? DEFAULT_META;
    return { emoji: m.emoji, bg: isDark ? m.tileBgDark : m.tileBg };
}

// ── RestaurantImage ────────────────────────────────────────────────────────

function RestaurantImage({ uri, style }: { uri?: string; style: object }) {
    const [err, setErr] = useState(false);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const placeholder = isDark ? '#1e2035' : '#d8d8d8';
    useEffect(() => { setErr(false); }, [uri]);
    if (!uri || err) {
        return (
            <View style={[style, styles.imageFallback, { backgroundColor: placeholder }]}>
                <Ionicons name="fast-food-outline" size={32} color={c.textMuted} />
            </View>
        );
    }
    return (
        <View style={[style, { backgroundColor: placeholder, overflow: 'hidden' }]}>
            <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" onError={() => setErr(true)} />
        </View>
    );
}

// ── RestaurantCard ─────────────────────────────────────────────────────────

export function RestaurantCard({ item, onPress, carousel }: {
    item: Restaurant;
    onPress: () => void;
    carousel?: boolean;
}) {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    // Separate elevation (shadow) from overflow:hidden — putting both on the same
    // View causes images to disappear on Android.
    return (
        <View
            style={[
                styles.cardShadow,
                { backgroundColor: c.surface },
                carousel && styles.cardCarousel,
                isDark
                    ? { borderWidth: 1, borderColor: c.border }
                    : { elevation: 3 },
            ]}
        >
            <Pressable
                style={[styles.card, { backgroundColor: c.surface }]}
                onPress={onPress}
            >
                <View style={styles.imgWrapper}>
                    <RestaurantImage
                        uri={item.image
                            ? (item.image.startsWith('data:') || item.image.startsWith('http')
                                ? item.image
                                : `${MEDIA_BASE}${item.image}`)
                            : undefined}
                        style={carousel ? styles.cardImgCarousel : styles.cardImgFull}
                    />
                    {item.isPromoted && (
                        <View style={styles.sponsoredBadge}>
                            <Text style={styles.sponsoredText}>Sponsored</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardBody}>
                    <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.cardCategory, { color: c.textMuted }]} numberOfLines={1}>
                        {item.category}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: c.textMuted }]}>
                            🚴{' '}{item.deliveryFee === 0 ? 'Free' : `₪${item.deliveryFee}`}
                        </Text>
                        {item.deliveryTime > 0 && (
                            <Text style={[styles.metaText, { color: c.textMuted }]}>
                                {' · '}{item.deliveryTime} min
                            </Text>
                        )}
                        {item.rating > 0 && (
                            <Text style={[styles.metaText, { color: c.textMuted }]}>
                                {' · '}😊 {item.rating.toFixed(1)}
                            </Text>
                        )}
                    </View>
                </View>
            </Pressable>
        </View>
    );
}

// ── CategoryTile (large, shown at top of scroll) ───────────────────────────

function CategoryTile({ label, selected, onPress, isDark, imageUri }: {
    label: string; selected: boolean; onPress: () => void; isDark: boolean; imageUri?: string;
}) {
    const { emoji, bg } = getMeta(label, isDark);
    const c = isDark ? Colors.dark : Colors.light;
    const hasImg = Boolean(imageUri);
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.catTile,
                { backgroundColor: hasImg ? '#111' : bg },
                // No borderWidth here — adding border to overflow:hidden View kills images on Android
            ]}
        >
            {hasImg && (
                <>
                    <Image source={imageUri!} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <View style={[styles.catTileOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.15)' }]} />
                </>
            )}
            {/* Selection ring as inner View — avoids the overflow:hidden + borderWidth Android bug */}
            {selected && (
                <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.catTileRing, { borderColor: c.accent }]}
                />
            )}
            {!hasImg && <Text style={styles.catEmoji}>{emoji}</Text>}
            <Text style={[styles.catTileLabel, { color: hasImg ? '#fff' : c.text }]} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
}

// ── CategoryPill (compact, appears after scrolling) ────────────────────────

function CategoryPill({ label, selected, onPress, isDark }: {
    label: string; selected: boolean; onPress: () => void; isDark: boolean;
}) {
    const { emoji } = getMeta(label, isDark);
    const c = isDark ? Colors.dark : Colors.light;
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.pill,
                selected
                    ? { backgroundColor: c.accent, borderColor: c.accent }
                    : { backgroundColor: 'transparent', borderColor: c.border },
            ]}
        >
            <Text style={styles.pillEmoji}>{emoji}</Text>
            <Text style={[styles.pillLabel, { color: selected ? '#fff' : c.text }]}>
                {label}
            </Text>
        </Pressable>
    );
}

// ── HomeScreen ─────────────────────────────────────────────────────────────

const PILLS_H = 52;  // height of the sticky pills bar

export default function HomeScreen() {
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();

    // States for user context and guest location.
    const { token, user } = useContext(AuthContext);
    const [guestLoc, setGuestLoc] = useState<{lat: number, lng: number} | null>(null);

    // Fetch guest location on mount.
    useEffect(() => {
        if (!token) {
            getGuestLocation().then(loc => {
                if (loc) setGuestLoc(loc);
            });
        }
    }, [token]);

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [pillsActive, setPillsActive] = useState(false);

    // Header height (status bar + header bar content)
    const HEADER_H = insets.top + 56;
    // Scroll threshold at which pills become interactive (tiles have scrolled past header)
    const TILES_THRESHOLD = 140;

    const scrollY = useRef(new Animated.Value(0)).current;
    const pillsActiveRef = useRef(false);

    // Enable/disable pills touch events based on scroll position (JS thread listener)
    useEffect(() => {
        const id = scrollY.addListener(({ value }) => {
            const active = value > TILES_THRESHOLD - 20;
            if (active !== pillsActiveRef.current) {
                pillsActiveRef.current = active;
                setPillsActive(active);
            }
        });
        return () => scrollY.removeListener(id);
    }, [scrollY, TILES_THRESHOLD]);

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

    useFocusEffect(
        useCallback(() => { load(); }, [load])
    );

    const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);
    const onRetry = useCallback(() => { setLoading(true); load(); }, [load]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(restaurants.map(r => r.category).filter(Boolean))).sort();
        return ['All', ...cats];
    }, [restaurants]);

    const promoted = useMemo(() => restaurants.filter(r => r.isPromoted), [restaurants]);

    const filtered = useMemo(
        () => selectedCategory === 'All'
            ? restaurants
            : restaurants.filter(r => r.category === selectedCategory),
        [restaurants, selectedCategory],
    );

    // Header background: transparent → solid
    const headerBgOpacity = scrollY.interpolate({
        inputRange: [0, 90],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Pills bar: hidden → visible
    const pillsOpacity = scrollY.interpolate({
        inputRange: [TILES_THRESHOLD - 20, TILES_THRESHOLD + 30],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const pillsTranslateY = scrollY.interpolate({
        inputRange: [TILES_THRESHOLD - 20, TILES_THRESHOLD + 30],
        outputRange: [-6, 0],
        extrapolate: 'clamp',
    });

    // Must be before early returns (Rules of Hooks)
    const listHeader = useMemo(() => {
        const seeAllBg = isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0';
        return (
            <>
                {/* Large category tiles — same background as top bar for seamless look */}
                <View style={{ backgroundColor: c.surface }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tilesContent}
                    >
                        {categories.map(cat => (
                            <CategoryTile
                                key={cat}
                                label={cat}
                                selected={selectedCategory === cat}
                                onPress={() => setSelectedCategory(cat)}
                                isDark={isDark}
                                imageUri={CATEGORY_IMAGE_URIS[cat]}
                            />
                        ))}
                    </ScrollView>
                </View>

                {promoted.length > 0 && selectedCategory === 'All' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeadRow}>
                            <Text style={[styles.sectionTitle, { color: c.text }]}>Promoted</Text>
                            <Pressable 
                                onPress={() => router.push('/promoted')}
                                style={[styles.seeAllPill, { backgroundColor: seeAllBg }]}
                            >
                                <Text style={[styles.seeAllText, { color: c.text }]}>See all</Text>
                            </Pressable>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                        >
                            {promoted.map(item => (
                                <RestaurantCard
                                    key={`promo-${item.id}`}
                                    item={item}
                                    carousel
                                    onPress={() => router.push(`/restaurant/${item.id}`)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.sectionHeadRow}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>
                        {selectedCategory === 'All' ? 'All Restaurants' : selectedCategory}
                    </Text>
                    <Text style={[styles.countBadge, { color: c.textMuted }]}>
                        {filtered.length}
                    </Text>
                </View>
            </>
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [promoted, selectedCategory, filtered.length, c, isDark, categories]);

    if (loading) {
        return (
            <View style={[styles.fill, styles.centered, { backgroundColor: c.background, paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={c.accent} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.fill, styles.centered, { backgroundColor: c.background, paddingTop: insets.top }]}>
                <Ionicons name="wifi-outline" size={52} color={c.textMuted} />
                <Text style={[styles.errorText, { color: c.textMuted }]}>{error}</Text>
                <Pressable onPress={onRetry} style={[styles.retryBtn, { backgroundColor: c.accent }]}>
                    <Text style={styles.retryBtnText}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.fill, { backgroundColor: c.background }]}>

            {/* Surface color behind transparent header — matches categories below */}
            <View
                pointerEvents="none"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H, backgroundColor: c.surface, zIndex: 5 }}
            />

            {/* ── Main scrollable list ─────────────────────────────────── */}
            <FlatList
                data={filtered}
                keyExtractor={r => r.id}
                contentContainerStyle={[styles.listContent, { paddingTop: HEADER_H, paddingBottom: 90 + insets.bottom }]}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={c.accent}
                        progressViewOffset={HEADER_H}
                    />
                }
                ListHeaderComponent={listHeader}
                renderItem={({ item }) => (
                    <View style={styles.cardWrap}>
                        <RestaurantCard
                            item={item}
                            onPress={() => router.push(`/restaurant/${item.id}`)}
                        />
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: Spacing[3] }} />}
                ListEmptyComponent={
                    <View style={[styles.centered, { paddingTop: 60 }]}>
                        <Ionicons name="search-outline" size={40} color={c.textMuted} />
                        <Text style={[styles.emptyText, { color: c.textMuted }]}>
                            No restaurants in this category
                        </Text>
                    </View>
                }
            />

            {/* ── Sticky pills bar — fades in after tiles scroll away ── */}
            <Animated.View
                pointerEvents={pillsActive ? 'auto' : 'none'}
                style={[
                    styles.pillsBar,
                    {
                        top: HEADER_H,
                        backgroundColor: c.surface,
                        opacity: pillsOpacity,
                        transform: [{ translateY: pillsTranslateY }],
                    },
                ]}
            >
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pillsContent}
                    data={categories}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <CategoryPill
                            label={item}
                            selected={selectedCategory === item}
                            onPress={() => setSelectedCategory(item)}
                            isDark={isDark}
                        />
                    )}
                />
            </Animated.View>

            {/* ── Floating header — transparent → solid on scroll ──────── */}
            <Animated.View
                style={[styles.header, { paddingTop: insets.top + 8 }]}
                pointerEvents="box-none"
            >
                {/* Animated background layer */}
                <Animated.View
                    style={[StyleSheet.absoluteFill, { backgroundColor: c.surface, opacity: headerBgOpacity }]}
                    pointerEvents="none"
                />
                {/* Header row */}
                <View style={styles.headerRow} pointerEvents="box-none">
                    {/* Left Icon (The generic person) */}
                    <Pressable 
                        style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }]}
                        onPress={() => router.push('/(tabs)/profile')}
                    >
                        {user?.profilePicture ? (
                            <Image source={{ uri: user.profilePicture }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Ionicons name="person-outline" size={18} color={isDark ? '#fff' : '#1c1d2a'} />
                        )}
                    </Pressable>

                    {/* Center area - modified to show row of [Location - Title] */}
                    <View style={styles.headerCenter} pointerEvents="none">
                        {(!token && guestLoc) && (
                            <Text style={{ fontSize: 11, fontWeight: '700', color: c.accent, marginRight: 8 }}>
                                📍 {guestLoc.lat.toFixed(2)}, {guestLoc.lng.toFixed(2)}
                            </Text>
                        )}
                        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#1c1d2a' }]}>
                            Wolt Clone
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'} />
                    </View>

                    {/* Right Toggle */}
                    <Pressable
                        onPress={toggleTheme}
                        style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)' }]}
                    >
                        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={isDark ? '#fff' : '#1c1d2a'} />
                    </Pressable>
                </View>
            </Animated.View>

        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    fill: { flex: 1 },
    centered: { alignItems: 'center', justifyContent: 'center' },

    // Floating header
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingBottom: 10,
        gap: Spacing[2],
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    headerTitle: {
        fontSize: Typography.base,
        fontWeight: '700',
        letterSpacing: -0.2,
    },

    // Sticky pills bar — no background, pills float transparently over content
    pillsBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 19,
    },
    pillsContent: {
        paddingHorizontal: Spacing[4],
        paddingVertical: 8,
        gap: Spacing[2],
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1.5,
        gap: 5,
    },
    pillEmoji: { fontSize: 13 },
    pillLabel: { fontSize: Typography.sm, fontWeight: '600' },

    // Category tiles
    tilesContent: {
        paddingHorizontal: Spacing[4],
        paddingTop: 4,
        paddingBottom: Spacing[2],
        gap: Spacing[3],
    },
    catTile: {
        width: 96,
        height: 96,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        gap: 4,
    },
    catTileOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    catTileRing: {
        borderWidth: 2.5,
        borderRadius: 20,
    },
    catEmoji: { fontSize: 34 },
    catTileLabel: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.1,
    },

    // Section headers
    section: { marginBottom: Spacing[1] },
    sectionHeadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[3],
    },
    sectionTitle: {
        fontSize: Typography.h3,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    seeAllPill: {
        paddingHorizontal: Spacing[3],
        paddingVertical: 6,
        borderRadius: 999,
    },
    seeAllText: { fontSize: Typography.sm, fontWeight: '600' },
    countBadge: { fontSize: Typography.sm, fontWeight: '500' },

    // Carousel
    carouselContent: {
        paddingHorizontal: Spacing[4],
        gap: Spacing[3],
        paddingBottom: Spacing[2],
    },

    // List (paddingBottom set dynamically to clear the floating tab bar)
    listContent: {},
    cardWrap: { paddingHorizontal: Spacing[4] },

    // Cards — elevation on outer, overflow:hidden on inner (Android bug workaround)
    cardShadow: {
        borderRadius: 16,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardCarousel: { width: 260 },
    imgWrapper: { position: 'relative' },
    cardImgFull: { width: '100%', height: 168 },
    cardImgCarousel: { width: 260, height: 150 },
    cardBody: { padding: Spacing[3], paddingTop: 10 },
    cardName: {
        fontSize: Typography.base,
        fontWeight: '700',
        marginBottom: 3,
        letterSpacing: -0.1,
    },
    cardCategory: { fontSize: Typography.xs, marginBottom: 5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    metaText: { fontSize: Typography.xs },

    // Sponsored overlay on image
    sponsoredBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sponsoredText: { color: '#fff', fontSize: 11, fontWeight: '600' },

    imageFallback: { alignItems: 'center', justifyContent: 'center' },

    // Error / empty
    errorText: {
        fontSize: Typography.base,
        marginTop: Spacing[3],
        marginBottom: Spacing[4],
        textAlign: 'center',
        paddingHorizontal: Spacing[5],
    },
    retryBtn: {
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[3],
        borderRadius: 14,
    },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.base },
    emptyText: {
        marginTop: Spacing[3],
        fontSize: Typography.base,
        textAlign: 'center',
    },
});
