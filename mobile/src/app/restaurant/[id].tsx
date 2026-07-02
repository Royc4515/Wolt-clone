import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Pressable,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import {
    getMenu,
    getRestaurant,
    MEDIA_BASE,
    type MenuSection,
    type Product,
    type Restaurant,
} from '../../services/api';
import { CartContext } from '../../context/CartContext';
import { HERO_H, HEADER_CONTENT_H, TABS_BAR_H } from './_components/constants';
import HeroImage from './_components/HeroImage';
import MenuItemModal from './_components/MenuItemModal';
import RecommendedCard from './_components/RecommendedCard';
import SwipeableItemRow from './_components/SwipeableItemRow';

export default function RestaurantScreen() {
    const params = useLocalSearchParams<{ id: string, openItem?: string }>();
    const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
    const openItem = (Array.isArray(params.openItem) ? params.openItem[0] : params.openItem);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();
    const HEADER_H = insets.top + HEADER_CONTENT_H;

    const { carts } = useContext(CartContext);
    // Get the cart specific to this restaurant using its ID
    const cartItems = carts[id] || [];
    const cartQty   = cartItems.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cartItems.reduce((s, i) => s + i.item.price * i.qty, 0);

    // ── State ──────────────────────────────────────────────────────────────────
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [sections, setSections] = useState<MenuSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState(0);
    const [modalItem, setModalItem] = useState<Product | null>(null);
    const [tabsVisible, setTabsVisible] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const scrollY = useRef(new Animated.Value(0)).current;
    const sectionListRef = useRef<SectionList<Product>>(null);
    const tabsVisibleRef = useRef(false);
    // Stable ref so listHeader callbacks are never stale
    const setModalItemRef = useRef(setModalItem);
    setModalItemRef.current = setModalItem;
    // Dismisses the active card stepper from outside (scroll, row press, tab press)
    const stepperDismissRef = useRef<(() => void) | null>(null);
    const searchInputRef = useRef<TextInput>(null);

    // ── Load ───────────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        try {
            setError(null);
            const [rest, menu] = await Promise.all([getRestaurant(id), getMenu(id)]);
            setRestaurant(rest);
            setSections(menu);
            
            if (openItem) {
                const target = menu.flatMap(s => s.items).find(i => i.id === openItem);
                if (target) setModalItem(target);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load menu');
        } finally {
            setLoading(false);
        }
    }, [id, openItem]);

    useEffect(() => { load(); }, [load]);

    // ── Tabs visibility tracking ───────────────────────────────────────────────
    useEffect(() => {
        const threshold = HERO_H - HEADER_H - 30;
        const listener = scrollY.addListener(({ value }) => {
            const visible = value > threshold;
            if (visible !== tabsVisibleRef.current) {
                tabsVisibleRef.current = visible;
                setTabsVisible(visible);
            }
        });
        return () => scrollY.removeListener(listener);
    }, [scrollY, HEADER_H]);

    // ── Animated values ────────────────────────────────────────────────────────
    // Header background fades in as hero scrolls behind the header.
    const headerBgOpacity = scrollY.interpolate({
        inputRange: [HERO_H - HEADER_H - 70, HERO_H - HEADER_H],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const tabsFadeStart = HERO_H - HEADER_H - 20;
    const tabsFadeEnd   = HERO_H - HEADER_H + 20;
    const tabsOpacity = scrollY.interpolate({
        inputRange: [tabsFadeStart, tabsFadeEnd],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const tabsTranslateY = scrollY.interpolate({
        inputRange: [tabsFadeStart, tabsFadeEnd],
        outputRange: [-8, 0],
        extrapolate: 'clamp',
    });

    // ── Section tab press ──────────────────────────────────────────────────────
    const onTabPress = useCallback(
        (index: number) => {
            stepperDismissRef.current?.();
            setActiveSection(index);
            try {
                sectionListRef.current?.scrollToLocation({
                    sectionIndex: index,
                    itemIndex: 0,
                    viewOffset: HEADER_H + TABS_BAR_H,
                    animated: true,
                });
            } catch {
                // not yet measured — ignore
            }
        },
        [HEADER_H],
    );

    // ── Stable data ────────────────────────────────────────────────────────────
    const sectionListData = useMemo(
        () => sections
            .map(s => ({ ...s, data: s.items.filter(i => i.isAvailable !== false), key: s.id }))
            .filter(s => s.data.length > 0),
        [sections],
    );

    const searchSectionData = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        let res = sectionListData
            .map(s => ({
                ...s,
                data: s.data.filter((item: Product) =>
                    item.name.toLowerCase().includes(q) ||
                    (item.description?.toLowerCase().includes(q) ?? false)
                ),
            }))
            .filter(s => s.data.length > 0);

        if (selectedCategory) {
            res = res.filter(s => s.id === selectedCategory);
        } else {
            // Take up to 3 items per section if no category is selected
            res = res.map(s => ({ ...s, data: s.data.slice(0, 3), totalItems: s.data.length }));
        }
        return res;
    }, [sectionListData, searchQuery, selectedCategory]);

    const dismissSearch = useCallback(() => {
        setSearchActive(false);
        setSearchQuery('');
        setSelectedCategory(null);
        searchInputRef.current?.blur();
    }, []);

    const listHeader = useMemo(() => {
        if (!restaurant) return null;
        const recommended = sections
            .flatMap(s => s.items)
            .filter(i => i.isAvailable !== false)
            .slice(0, 6);
        const heroUri = restaurant.image
            ? (restaurant.image.startsWith('data:') || restaurant.image.startsWith('http')
                ? restaurant.image
                : `${MEDIA_BASE}${restaurant.image}`)
            : undefined;
        return (
            <View>
                <HeroImage uri={heroUri} />
                <View style={[styles.infoBlock, { backgroundColor: c.surface }]}>
                    <Text style={[styles.restName, { color: c.text, textAlign: 'center' }]}>
                        {restaurant.name}
                    </Text>
                    {restaurant.openHours ? (
                        <Text style={[styles.restMeta, { color: c.textMuted, textAlign: 'center' }]}>
                            {restaurant.openHours}
                        </Text>
                    ) : null}
                    {restaurant.description ? (
                        <Text
                            style={[styles.restDesc, { color: c.textMuted, textAlign: 'center' }]}
                            numberOfLines={2}
                        >
                            {restaurant.description}
                        </Text>
                    ) : null}
                    <View style={styles.pillRow}>
                        {restaurant.rating > 0 && (
                            <View style={[styles.pill, { backgroundColor: c.text + '0A' }]}>
                                <Ionicons name="happy-outline" size={13} color={c.textMuted} />
                                <Text style={[styles.pillText, { color: c.textMuted }]}>
                                    {restaurant.rating.toFixed(1)}
                                </Text>
                            </View>
                        )}
                        {restaurant.deliveryTime > 0 && (
                            <View style={[styles.pill, { backgroundColor: c.text + '0A' }]}>
                                <Ionicons name="time-outline" size={13} color={c.textMuted} />
                                <Text style={[styles.pillText, { color: c.textMuted }]}>
                                    {restaurant.deliveryTime} min
                                </Text>
                            </View>
                        )}
                        <View style={[
                            styles.pill,
                            { backgroundColor: restaurant.deliveryFee === 0 ? c.accent + '15' : c.text + '0A' },
                        ]}>
                            <Ionicons
                                name="bicycle-outline"
                                size={13}
                                color={restaurant.deliveryFee === 0 ? c.accent : c.textMuted}
                            />
                            <Text style={[styles.pillText, { color: restaurant.deliveryFee === 0 ? c.accent : c.textMuted }]}>
                                {restaurant.deliveryFee === 0 ? 'Free delivery' : `₪${restaurant.deliveryFee} delivery`}
                            </Text>
                        </View>
                    </View>
                </View>

                {recommended.length > 0 && (
                    <View style={[styles.recSection, { backgroundColor: c.background }]}>
                        <Text style={[styles.recSectionTitle, { color: c.text }]}>
                            Recommended for you
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.recScrollContent}
                        >
                            {recommended.map(item => (
                                <RecommendedCard
                                    key={`rec-${item.id}`}
                                    item={item}
                                    onPress={() => setModalItemRef.current(item)}
                                    stepperDismissRef={stepperDismissRef}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    }, [restaurant, sections, c, isDark]);

    // ── Loading / error ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.fill, styles.centered, { backgroundColor: c.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={c.accent} />
            </View>
        );
    }

    if (error || !restaurant) {
        return (
            <View style={[styles.fill, styles.centered, { backgroundColor: c.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="alert-circle-outline" size={52} color={c.textMuted} />
                <Text style={[styles.errorText, { color: c.textMuted }]}>
                    {error ?? 'Restaurant not found'}
                </Text>
                <Pressable
                    onPress={() => { setLoading(true); load(); }}
                    style={[styles.retryBtn, { backgroundColor: c.accent }]}
                >
                    <Text style={styles.retryBtnText}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.fill, { backgroundColor: c.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Main scrollable menu ─────────────────────────────── */}
            <SectionList
                ref={sectionListRef}
                sections={sectionListData}
                keyExtractor={(item: Product) => item.id}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
                onScrollBeginDrag={() => { stepperDismissRef.current?.(); searchInputRef.current?.blur(); }}
                ListHeaderComponent={listHeader}
                renderSectionHeader={({ section }) => (
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: c.text, backgroundColor: c.background },
                        ]}
                    >
                        {section.title}
                    </Text>
                )}
                renderItem={({ item }: { item: Product }) => (
                    <SwipeableItemRow
                        item={item}
                        borderColor={c.border}
                        bgColor={c.background}
                        onPress={() => { stepperDismissRef.current?.(); setModalItem(item); }}
                    />
                )}
            />

            {/* ── Floating section tabs (fades in after hero scrolls away) ── */}
            <Animated.View
                pointerEvents={tabsVisible && !searchActive ? 'auto' : 'none'}
                style={[
                    styles.tabsBar,
                    {
                        top: HEADER_H,
                        backgroundColor: c.surface,
                        borderBottomColor: c.border,
                        opacity: searchActive ? 0 : tabsOpacity,
                        transform: [{ translateY: tabsTranslateY }],
                    },
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {sections.map((s, i) => (
                        <Pressable
                            key={s.id}
                            onPress={() => onTabPress(i)}
                            style={[
                                styles.tab,
                                i === activeSection && {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#EAEAEA',
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: i === activeSection ? c.text : c.textMuted },
                                    i === activeSection && styles.tabTextActive,
                                ]}
                            >
                                {s.title}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* ── Floating header ──────────────────────────────────────
                All elements (back, pill, ···) always visible with frosted glass.
                Solid background fades in only after hero scrolls away.
            ─────────────────────────────────────────────────────────── */}
            <Animated.View
                style={[styles.header, { paddingTop: insets.top }]}
                pointerEvents="box-none"
            >
                {/* Solid background — fades in after hero scrolls past */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: c.surface, opacity: headerBgOpacity },
                    ]}
                    pointerEvents="none"
                />
                <View style={styles.headerRow} pointerEvents="box-none">
                    <Pressable
                        onPress={() => searchActive ? dismissSearch() : router.back()}
                        style={[
                            styles.headerBtn,
                            { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)' },
                        ]}
                    >
                        <Ionicons name="arrow-back" size={20} color={isDark ? '#fff' : '#1c1d2a'} />
                    </Pressable>

                    <Pressable
                        style={styles.headerCenter}
                        onPress={() => {
                            setSearchActive(true);
                            setTimeout(() => searchInputRef.current?.focus(), 50);
                        }}
                    >
                        <View
                            style={[
                                styles.headerSearch,
                                { backgroundColor: isDark ? 'rgba(10,12,23,0.72)' : 'rgba(255,255,255,0.85)' },
                            ]}
                        >
                            <Ionicons name="search-outline" size={14} color={c.textMuted} />
                            <Text style={[styles.headerSearchText, { color: c.textMuted }]} numberOfLines={1}>
                                {restaurant.name}
                            </Text>
                        </View>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.headerBtn,
                            { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)' },
                            pressed && { opacity: 0.7 }
                        ]}
                        onPress={() => router.push({ pathname: '/orders/cart', params: { restaurantId: id } })}
                    >
                        <Ionicons name="cart-outline" size={20} color={isDark ? '#fff' : '#1c1d2a'} />
                        {cartQty > 0 && (
                            <View style={[styles.cartBadge, { backgroundColor: c.accent }]}>
                                <Text style={styles.cartBadgeText}>{cartQty > 9 ? '9+' : cartQty}</Text>
                            </View>
                        )}
                    </Pressable>
                </View>
            </Animated.View>

            {/* ── Search Overlay ─────────────────────────────────────── */}
            {searchActive && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background, zIndex: 100 }]}>
                    <View style={{ paddingTop: insets.top, backgroundColor: c.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
                        <View style={[styles.headerRow, { paddingHorizontal: Spacing[4] }]}>
                            <Pressable
                                onPress={dismissSearch}
                                hitSlop={10}
                                style={{ marginRight: Spacing[3], padding: 4 }}
                            >
                                <Ionicons name="chevron-back" size={26} color={c.text} />
                            </Pressable>
                            <View style={[styles.headerSearch, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]}>
                                <TextInput
                                    ref={searchInputRef}
                                    style={[styles.headerSearchText, { color: c.text }]}
                                    value={searchQuery}
                                    onChangeText={(text) => {
                                        setSearchQuery(text);
                                        setSelectedCategory(null);
                                    }}
                                    placeholder="Search in restaurant"
                                    placeholderTextColor={c.textMuted}
                                    returnKeyType="search"
                                    autoCorrect={false}
                                />
                                {searchQuery.length > 0 && (
                                    <Pressable hitSlop={8} onPress={() => { setSearchQuery(''); setSelectedCategory(null); searchInputRef.current?.focus(); }}>
                                        <Ionicons name="close-circle" size={16} color={c.textMuted} />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </View>

                    {searchQuery.trim().length === 0 ? (
                        <View style={[styles.fill, styles.centered]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4] }}>
                                <Ionicons name="search" size={70} color="#2db4e8" style={{ transform: [{ rotate: '-15deg' }, { translateX: 10 }] }} />
                                <Ionicons name="search" size={60} color="#61c7ed" style={{ transform: [{ rotate: '15deg' }, { translateX: -10 }] }} />
                            </View>
                            <Text style={{ fontSize: Typography.base, color: c.textMuted }}>Search for similar dishes.</Text>
                        </View>
                    ) : (
                        <SectionList
                            sections={searchSectionData}
                            keyExtractor={(item: Product) => item.id}
                            contentContainerStyle={{ paddingBottom: 120 }}
                            onScrollBeginDrag={() => { stepperDismissRef.current?.(); searchInputRef.current?.blur(); }}
                            ListEmptyComponent={
                                <View style={[styles.centered, { paddingVertical: 48 }]}>
                                    <Text style={[styles.errorText, { color: c.textMuted }]}>No results for "{searchQuery}"</Text>
                                </View>
                            }
                            renderSectionHeader={({ section }) => (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[4], paddingTop: Spacing[5], paddingBottom: Spacing[3], backgroundColor: c.background }}>
                                    <View>
                                        <Text style={{ fontSize: Typography.h3, fontWeight: '900', color: c.text }}>{section.title}</Text>
                                        <Text style={{ fontSize: Typography.sm, color: c.textMuted, marginTop: 2 }}>{(section as any).totalItems ?? section.data.length} items</Text>
                                    </View>
                                    {!selectedCategory && ((section as any).totalItems ?? section.data.length) > 3 && (
                                        <Pressable 
                                            style={[styles.seeAllBtn, { backgroundColor: isDark ? 'rgba(0,157,224,0.15)' : '#e6f5fb' }]} 
                                            onPress={() => setSelectedCategory(section.id)}
                                        >
                                            <Text style={[styles.seeAllBtnText, { color: c.accent }]}>See all</Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}
                            renderItem={({ item }: { item: Product }) => (
                                <SwipeableItemRow
                                    item={item}
                                    borderColor={c.border}
                                    bgColor={c.background}
                                    onPress={() => { stepperDismissRef.current?.(); setModalItem(item); }}
                                />
                            )}
                        />
                    )}
                </View>
            )}

            {/* ── Item detail modal ────────────────────────────────── */}
            <MenuItemModal
                item={modalItem}
                visible={modalItem !== null}
                onClose={() => setModalItem(null)}
            />

            {/* ── Cart bar ─────────────────────────────────────────── */}
            {!searchActive && cartQty > 0 && (
                <View style={[styles.cartOuter, { bottom: 0 }]} pointerEvents="box-none">
                    {/* Pill — no blur behind it */}
                    <View style={styles.cartPillWrap}>
                        <Pressable
                            style={[styles.cartBar, { backgroundColor: c.accent }]}
                            onPress={() => router.push({ pathname: '/orders/cart', params: { restaurantId: id } })}
                        >
                            <View style={[styles.cartBarBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.92)' }]}>
                                <Text style={[styles.cartBarBadgeText, { color: isDark ? '#fff' : c.accent }]}>{cartQty}</Text>
                            </View>
                            <Text style={styles.cartBarLabel}>View cart</Text>
                            <Text style={styles.cartBarTotal}>₪{cartTotal.toFixed(2)}</Text>
                        </Pressable>
                    </View>

                    {/* Frosted area — starts exactly at the pill's bottom edge */}
                    <View style={styles.cartFrosted}>
                        <BlurView
                            intensity={92}
                            tint={isDark ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFill}
                        />
                        <View
                            pointerEvents="none"
                            style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(10,12,23,0.52)' : 'rgba(255,255,255,0.52)' }]}
                        />
                        {/* Side fades — stepped to simulate gradient */}
                        {(['left', 'right'] as const).map(side => (
                            [
                                { offset: 0,  width: 28, opacity: 0.62 },
                                { offset: 28, width: 18, opacity: 0.34 },
                                { offset: 46, width: 12, opacity: 0.14 },
                            ].map(({ offset, width, opacity }) => (
                                <View
                                    key={`${side}-${offset}`}
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute',
                                        top: 0, bottom: 0,
                                        [side]: offset,
                                        width,
                                        backgroundColor: isDark
                                            ? `rgba(10,12,23,${opacity})`
                                            : `rgba(255,255,255,${opacity})`,
                                    }}
                                />
                            ))
                        ))}
                        <Text style={[styles.cartFeeNote, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)' }]}>
                            Estimated service & delivery fees ₪{restaurant.deliveryFee.toFixed(2)}
                        </Text>
                        <View style={{ height: Math.max(insets.bottom, 10) }} />
                    </View>
                </View>
            )}
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    fill: { flex: 1 },
    centered: { alignItems: 'center', justifyContent: 'center' },

    // Restaurant info block (below hero)
    infoBlock: {
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[4],
        alignItems: 'center',
    },
    restName: { fontSize: 30, fontWeight: '900', letterSpacing: 0.8, marginBottom: Spacing[2] },
    restMeta: { fontSize: Typography.sm, marginBottom: 3, lineHeight: 20 },
    pillRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[2], justifyContent: 'center', flexWrap: 'wrap' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    pillText: { fontSize: Typography.xs, fontWeight: '700' },
    restDesc: { fontSize: Typography.sm, marginTop: Spacing[2], marginBottom: Spacing[2], lineHeight: 20 },
    // "Recommended for you" section
    recSection: { paddingTop: Spacing[4], paddingBottom: Spacing[3] },
    recSectionTitle: {
        fontSize: Typography.h3,
        fontWeight: '900',
        letterSpacing: -0.3,
        paddingHorizontal: Spacing[4],
        marginBottom: Spacing[3],
    },
    recScrollContent: { paddingHorizontal: Spacing[4], gap: Spacing[3] },

    // Section headers (in list body)
    sectionTitle: {
        fontSize: Typography.h3,
        fontWeight: '900',
        letterSpacing: -0.3,
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[5],
        paddingBottom: Spacing[3],
    },

    // Floating section tabs bar
    tabsBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 19,
        height: TABS_BAR_H,
        justifyContent: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tabsContent: { paddingHorizontal: Spacing[3], alignItems: 'center', gap: 4 },
    tab: { paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: 999 },
    tabText: { fontSize: Typography.sm, fontWeight: '500' },
    tabTextActive: { fontWeight: '700' },

    // Floating header
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[3],
        paddingBottom: 10,
        gap: Spacing[2],
        height: HEADER_CONTENT_H,
    },
    headerBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1 },
    headerSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        height: 38,
        paddingHorizontal: 12,
        gap: 6,
    },
    headerSearchText: { flex: 1, fontSize: Typography.sm },

    seeAllBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    seeAllBtnText: {
        fontWeight: '700',
        fontSize: Typography.sm,
    },

    // Cart badge on header icon
    cartBadge: {
        position: 'absolute', top: -4, right: -4,
        minWidth: 16, height: 16, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 3,
    },
    cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

    // Cart bar at bottom
    cartOuter: {
        position: 'absolute',
        left: 0, right: 0,
        zIndex: 30,
        overflow: 'hidden',
    },
    cartPillWrap: {
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: 0,
    },
    cartFrosted: {
        overflow: 'hidden',
        alignItems: 'center',
        paddingTop: Spacing[2],
    },
    cartBar: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14,
        paddingLeft: 6, paddingRight: Spacing[4], paddingVertical: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 6,
        gap: Spacing[3],
    },
    cartBarBadge: {
        width: 34, height: 34, borderRadius: 17,
        alignItems: 'center', justifyContent: 'center',
    },
    cartBarBadgeText: { fontWeight: '900', fontSize: Typography.sm },
    cartBarLabel: { flex: 1, color: '#fff', fontWeight: '700', fontSize: Typography.base },
    cartBarTotal: { color: '#fff', fontWeight: '900', fontSize: Typography.base },
    cartFeeNote: { textAlign: 'center', fontSize: Typography.xs },

    // Error / retry
    errorText: {
        fontSize: Typography.base,
        marginTop: Spacing[3],
        marginBottom: Spacing[4],
        textAlign: 'center',
        paddingHorizontal: Spacing[5],
    },
    retryBtn: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderRadius: 14 },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.base },
});
