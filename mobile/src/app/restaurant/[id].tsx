import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    Pressable,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
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

const HERO_H = 260;
const HEADER_CONTENT_H = 56;
const TABS_BAR_H = 48;

// ── HeroImage ──────────────────────────────────────────────────────────────────

function HeroImage({ uri }: { uri?: string }) {
    const [err, setErr] = useState(false);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    if (!uri || err) {
        return (
            <View style={[styles.hero, { backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="fast-food-outline" size={64} color={c.textMuted} />
            </View>
        );
    }
    return (
        <Image source={uri} style={styles.hero} contentFit="cover" onError={() => setErr(true)} />
    );
}

// ── ProductImage ───────────────────────────────────────────────────────────────

function ProductImage({ uri }: { uri?: string }) {
    const [err, setErr] = useState(false);
    if (!uri || err) return null;
    return (
        <Image source={uri} style={styles.itemImg} contentFit="cover" onError={() => setErr(true)} />
    );
}

// ── MenuItemModal (bottom sheet) ───────────────────────────────────────────────

function MenuItemModal({
    item,
    visible,
    onClose,
}: {
    item: Product | null;
    visible: boolean;
    onClose: () => void;
}) {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();
    const [qty, setQty] = useState(1);
    const [imgErr, setImgErr] = useState(false);

    // Reset state when a new item is opened
    useEffect(() => {
        if (item) { setQty(1); setImgErr(false); }
    }, [item?.id]);

    // All hooks above — safe to early-return now
    if (!item) return null;

    const imgUri = item.image && !imgErr ? `${MEDIA_BASE}${item.image}` : undefined;
    const stepperBg = isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0';
    const closeBtnBg = isDark ? 'rgba(255,255,255,0.1)' : '#EFEFEF';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Outer: pushes sheet to bottom, backdrop fills space above */}
            <View style={styles.modalOuter}>
                <Pressable
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    onPress={onClose}
                />
                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: c.surface,
                            paddingBottom: Math.max(insets.bottom, 12) + 16,
                        },
                    ]}
                >
                    {/* Drag handle */}
                    <View
                        style={[
                            styles.dragHandle,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' },
                        ]}
                    />

                    {/* Name + close */}
                    <View style={styles.sheetHeader}>
                        <Text style={[styles.sheetTitle, { color: c.text }]} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Pressable
                            onPress={onClose}
                            style={[styles.sheetCloseBtn, { backgroundColor: closeBtnBg }]}
                        >
                            <Ionicons name="chevron-down" size={20} color={c.text} />
                        </Pressable>
                    </View>

                    {/* Item image */}
                    {imgUri ? (
                        <Image
                            source={imgUri}
                            style={styles.sheetImage}
                            contentFit="cover"
                            onError={() => setImgErr(true)}
                        />
                    ) : null}

                    {/* Description */}
                    {item.description ? (
                        <Text style={[styles.sheetDesc, { color: c.textMuted }]}>
                            {item.description}
                        </Text>
                    ) : null}

                    {/* Price */}
                    <Text style={[styles.sheetPrice, { color: c.accent }]}>₪{item.price}</Text>

                    {/* Quantity stepper + Add to cart */}
                    <View style={styles.sheetFooter}>
                        <View style={[styles.stepper, { backgroundColor: stepperBg }]}>
                            <Pressable
                                onPress={() => setQty(q => Math.max(1, q - 1))}
                                style={styles.stepBtn}
                            >
                                <Ionicons name="remove" size={20} color={c.text} />
                            </Pressable>
                            <Text style={[styles.stepQty, { color: c.text }]}>{qty}</Text>
                            <Pressable
                                onPress={() => setQty(q => q + 1)}
                                style={styles.stepBtn}
                            >
                                <Ionicons name="add" size={20} color={c.text} />
                            </Pressable>
                        </View>
                        {/* Cart integration owned by Dana — onPress wired up in SCRUM-4.x */}
                        <Pressable style={[styles.addBtn, { backgroundColor: c.accent }]} onPress={() => {}}>
                            <Text style={styles.addBtnText}>
                                Add to cart · ₪{(item.price * qty).toFixed(2)}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ── RestaurantScreen ───────────────────────────────────────────────────────────

export default function RestaurantScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();
    const HEADER_H = insets.top + HEADER_CONTENT_H;

    // ── State ──────────────────────────────────────────────────────────────────
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [sections, setSections] = useState<MenuSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState(0);
    const [modalItem, setModalItem] = useState<Product | null>(null);
    const [tabsVisible, setTabsVisible] = useState(false);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const scrollY = useRef(new Animated.Value(0)).current;
    const sectionListRef = useRef<SectionList<Product>>(null);
    const tabsVisibleRef = useRef(false);

    // ── Load ───────────────────────────────────────────────────────────────────
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

    // ── Scroll tracking (tabs visibility only) ────────────────────────────────
    // Active section is updated only on tab press — onLayout.y is parent-relative
    // inside SectionList wrappers so scroll-based tracking is unreliable.
    useEffect(() => {
        const tabsThreshold = HERO_H - HEADER_H - 30;
        const listener = scrollY.addListener(({ value }) => {
            const visible = value > tabsThreshold;
            if (visible !== tabsVisibleRef.current) {
                tabsVisibleRef.current = visible;
                setTabsVisible(visible);
            }
        });
        return () => scrollY.removeListener(listener);
    }, [scrollY, HEADER_H]);

    // ── Animated values ────────────────────────────────────────────────────────
    const headerBgOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const tabsFadeStart = HERO_H - HEADER_H - 20;
    const tabsFadeEnd = HERO_H - HEADER_H + 20;
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

    // ── Stable data + header (must be before early returns) ───────────────────
    const sectionListData = useMemo(
        () => sections.map(s => ({ ...s, data: s.items, key: s.id })),
        [sections],
    );

    const listHeader = useMemo(() => {
        if (!restaurant) return null;
        return (
            <View>
                <HeroImage uri={restaurant.image ? `${MEDIA_BASE}${restaurant.image}` : undefined} />
                <View style={[styles.infoBlock, { backgroundColor: c.surface }]}>
                    <Text style={[styles.restName, { color: c.text }]}>{restaurant.name}</Text>

                    <Text style={[styles.restMeta, { color: c.textMuted }]}>
                        {restaurant.rating > 0 ? `☺ ${restaurant.rating.toFixed(1)}` : ''}
                        {restaurant.openHours ? `  ·  ${restaurant.openHours}` : ''}
                    </Text>

                    <Text style={[styles.restMeta, { color: c.textMuted }]}>
                        {restaurant.deliveryFee === 0
                            ? '🚴 Free delivery'
                            : `🚴 ₪${restaurant.deliveryFee} delivery`}
                        {restaurant.deliveryTime > 0 ? `  ·  ${restaurant.deliveryTime} min` : ''}
                    </Text>

                    {restaurant.description ? (
                        <Text style={[styles.restDesc, { color: c.textMuted }]}>
                            {restaurant.description}
                        </Text>
                    ) : null}

                    <View
                        style={[
                            styles.deliveryPill,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' },
                        ]}
                    >
                        <Ionicons name="bicycle-outline" size={16} color={c.textMuted} />
                        <Text style={[styles.deliveryPillText, { color: c.text }]}>
                            Delivery{' '}
                            {restaurant.deliveryTime > 0 ? `${restaurant.deliveryTime} min` : 'available'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={c.textMuted} />
                    </View>
                </View>
            </View>
        );
    }, [restaurant, c, isDark]);

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
                contentContainerStyle={{ paddingTop: HEADER_H, paddingBottom: 120 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
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
                    <Pressable
                        style={({ pressed }) => [
                            styles.itemRow,
                            { borderBottomColor: c.border },
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setModalItem(item)}
                    >
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, { color: c.text }]}>{item.name}</Text>
                            {item.description ? (
                                <Text
                                    style={[styles.itemDesc, { color: c.textMuted }]}
                                    numberOfLines={2}
                                >
                                    {item.description}
                                </Text>
                            ) : null}
                            <Text style={[styles.itemPrice, { color: c.accent }]}>
                                ₪{item.price}
                            </Text>
                        </View>
                        <ProductImage uri={item.image ? `${MEDIA_BASE}${item.image}` : undefined} />
                    </Pressable>
                )}
            />

            {/* ── Floating section tabs (fades in after hero scrolls away) ── */}
            <Animated.View
                pointerEvents={tabsVisible ? 'auto' : 'none'}
                style={[
                    styles.tabsBar,
                    {
                        top: HEADER_H,
                        backgroundColor: c.surface,
                        borderBottomColor: c.border,
                        opacity: tabsOpacity,
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
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.1)'
                                        : '#EAEAEA',
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

            {/* ── Floating header (transparent → solid on scroll) ─── */}
            <Animated.View
                style={[styles.header, { paddingTop: insets.top }]}
                pointerEvents="box-none"
            >
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: c.surface, opacity: headerBgOpacity },
                    ]}
                    pointerEvents="none"
                />
                <View style={styles.headerRow} pointerEvents="box-none">
                    <Pressable
                        onPress={() => router.back()}
                        style={[
                            styles.headerBtn,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' },
                        ]}
                    >
                        <Ionicons name="arrow-back" size={20} color={isDark ? '#fff' : '#1c1d2a'} />
                    </Pressable>
                    <View
                        style={[
                            styles.headerSearch,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' },
                        ]}
                    >
                        <Ionicons name="search-outline" size={14} color={c.textMuted} />
                        <Text style={[styles.headerSearchText, { color: c.textMuted }]} numberOfLines={1}>
                            {restaurant.name}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.headerBtn,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' },
                        ]}
                    >
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={20}
                            color={isDark ? '#fff' : '#1c1d2a'}
                        />
                    </View>
                </View>
            </Animated.View>

            {/* ── Item detail modal ────────────────────────────────── */}
            <MenuItemModal
                item={modalItem}
                visible={modalItem !== null}
                onClose={() => setModalItem(null)}
            />
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    fill: { flex: 1 },
    centered: { alignItems: 'center', justifyContent: 'center' },

    // Hero image
    hero: { width: '100%', height: HERO_H },

    // Restaurant info block (below hero)
    infoBlock: {
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[4],
    },
    restName: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: Spacing[2],
    },
    restMeta: { fontSize: Typography.sm, marginBottom: 3, lineHeight: 20 },
    restDesc: { fontSize: Typography.sm, marginTop: Spacing[2], lineHeight: 20 },
    deliveryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing[3],
        paddingVertical: 8,
        borderRadius: 999,
        gap: 6,
        marginTop: Spacing[3],
    },
    deliveryPillText: { fontSize: Typography.sm, fontWeight: '600' },

    // Section headers (in list body, not sticky — tabs handle navigation)
    sectionTitle: {
        fontSize: Typography.h3,
        fontWeight: '900',
        letterSpacing: -0.3,
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[5],
        paddingBottom: Spacing[3],
    },

    // Menu item rows — divider style, no card borders
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    itemInfo: { flex: 1, paddingRight: Spacing[3] },
    itemName: { fontSize: Typography.base, fontWeight: '700', marginBottom: 4 },
    itemDesc: { fontSize: Typography.xs, lineHeight: 18, marginBottom: 6 },
    itemPrice: { fontSize: Typography.base, fontWeight: '800' },
    itemImg: { width: 90, height: 90, borderRadius: 10 },

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
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSearch: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        height: 38,
        paddingHorizontal: 12,
        gap: 6,
    },
    headerSearchText: { flex: 1, fontSize: Typography.sm },

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

    // Bottom sheet modal
    modalOuter: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: Spacing[4],
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: Spacing[4],
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: Spacing[4],
        gap: Spacing[3],
    },
    sheetTitle: { flex: 1, fontSize: Typography.h3, fontWeight: '900', letterSpacing: -0.3 },
    sheetCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: Spacing[4] },
    sheetDesc: { fontSize: Typography.sm, lineHeight: 20, marginBottom: Spacing[3] },
    sheetPrice: { fontSize: 22, fontWeight: '900', marginBottom: Spacing[4] },
    sheetFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
    stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 4 },
    stepBtn: { padding: 10 },
    stepQty: { fontSize: Typography.base, fontWeight: '700', minWidth: 28, textAlign: 'center' },
    addBtn: { flex: 1, height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.base },
});
