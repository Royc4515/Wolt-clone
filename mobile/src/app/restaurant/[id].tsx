import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
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
import { CartContext } from '../../context/CartContext';

const HERO_H = 260;
const HEADER_CONTENT_H = 56;
const TABS_BAR_H = 48;
const SWIPE_THRESHOLD = 80;

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

// ── RecommendedCard ────────────────────────────────────────────────────────────

// Solid pale-blue used for badge + stepper background in light mode
const PALE_BLUE = '#DDF7FF';

function RecommendedCard({
    item,
    onPress,
    stepperDismissRef,
}: {
    item: Product;
    onPress: () => void;
    stepperDismissRef: { current: (() => void) | null };
}) {
    const [imgErr, setImgErr] = useState(false);
    const { getQty, add, remove } = useContext(CartContext);
    const qty = getQty(item.id);
    const [stepperExpanded, setStepperExpanded] = useState(false);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const imgUri = item.image && !imgErr ? `${MEDIA_BASE}${item.image}` : undefined;
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // After 3 s of no interaction, collapse stepper → count badge (qty kept)
    const scheduleClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setStepperExpanded(false), 3000);
    }, []);

    // Register dismiss so the parent can collapse stepper on outside press/scroll
    useEffect(() => {
        if (stepperExpanded) {
            stepperDismissRef.current = () => setStepperExpanded(false);
            return () => { stepperDismissRef.current = null; };
        }
    }, [stepperExpanded, stepperDismissRef]);

    useEffect(() => {
        return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
    }, []);

    const handleAdd = () => { add(item); scheduleClose(); };
    const handleRemove = () => {
        remove(item.id);
        const nextQty = qty - 1;
        if (nextQty <= 0) {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setStepperExpanded(false);
        } else {
            scheduleClose();
        }
    };
    // Card body press → collapse stepper (keep qty), then open modal
    const handleCardPress = () => {
        setStepperExpanded(false);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        onPress();
    };
    // Count badge press → re-expand stepper (close any other open stepper first)
    const handleBadgePress = () => { stepperDismissRef.current?.(); setStepperExpanded(true); scheduleClose(); };

    // ── Color tokens ────────────────────────────────────────────────────────────
    // At-rest badge + stepper bg: #DDF7FF (light) / dark surface (dark)
    const restBg   = isDark ? Colors.dark.surface : PALE_BLUE;
    const restText = isDark ? '#00C2E8'           : '#004D6B';
    const stepBtnBg = isDark ? 'rgba(0,194,232,0.18)' : 'rgba(0,77,107,0.14)';
    // Count badge (after pressed): accent bg, white (light) or dark (dark) text
    const countBg   = c.accent;
    const countText = isDark ? '#041525' : '#fff';

    return (
        <View style={[styles.recCardWrap, { backgroundColor: c.surface }, isDark && { borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Pressable
                style={({ pressed }) => [styles.recCard, pressed && { opacity: 0.8 }]}
                onPress={handleCardPress}
            >
                <View style={[styles.recCardImg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
                    {imgUri ? (
                        <Image source={imgUri} style={StyleSheet.absoluteFill} contentFit="cover" onError={() => setImgErr(true)} />
                    ) : (
                        <Ionicons name="fast-food-outline" size={32} color={c.textMuted} />
                    )}
                </View>
                <View style={styles.recCardBody}>
                    <Text style={[styles.recCardPrice, { color: c.accent }]}>₪{item.price}</Text>
                    <Text style={[styles.recCardName, { color: c.text }]} numberOfLines={2}>{item.name}</Text>
                </View>
            </Pressable>

            {/* ── Corner badge / stepper ─────────────────────────────────────
                A  qty=0          → "+" badge (restBg + restText)
                               press flashes: accent bg + inverted text
                B  qty>0, closed  → count badge (accent bg, shows qty number)
                C  qty>0, open    → inline stepper (restBg + restText + buttons)
            ──────────────────────────────────────────────────────────────── */}
            {qty === 0 ? (
                /* State A */
                <Pressable
                    style={[styles.recCardPlus, { backgroundColor: restBg }]}
                    onPress={() => { stepperDismissRef.current?.(); add(item); setStepperExpanded(true); scheduleClose(); }}
                >
                    <Ionicons name="add" size={20} color={restText} />
                </Pressable>
            ) : !stepperExpanded ? (
                /* State B — count badge */
                <Pressable style={[styles.recCardPlus, { backgroundColor: countBg }]} onPress={handleBadgePress}>
                    <Text style={[styles.recCardBadgeQty, { color: countText }]}>{qty}</Text>
                </Pressable>
            ) : (
                /* State C — expanded stepper */
                <View style={[styles.recCardStepper, { backgroundColor: restBg }]}>
                    <Pressable style={[styles.recCardStepBtn, { backgroundColor: stepBtnBg }]} onPress={handleRemove} hitSlop={4}>
                        <Ionicons name="remove" size={15} color={restText} />
                    </Pressable>
                    <Text style={[styles.recCardStepQty, { color: restText }]}>{qty}</Text>
                    <Pressable style={[styles.recCardStepBtn, { backgroundColor: stepBtnBg }]} onPress={handleAdd} hitSlop={4}>
                        <Ionicons name="add" size={15} color={restText} />
                    </Pressable>
                </View>
            )}
        </View>
    );
}

// ── SwipeableItemRow ───────────────────────────────────────────────────────────

function SwipeableItemRow({
    item,
    borderColor,
    bgColor,
    onPress,
}: {
    item: Product;
    borderColor: string;
    bgColor: string;
    onPress: () => void;
}) {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const pan = useRef(new Animated.Value(0)).current;
    const isSwiping = useRef(false);
    const { getQty, add, remove } = useContext(CartContext);
    const qty = getQty(item.id);
    const qtyRef = useRef(qty);
    const addRef = useRef(add);
    const removeRef = useRef(remove);
    const { width: windowWidth } = useWindowDimensions();
    const MAX_SWIPE = windowWidth / 5;
    const localSwipeThreshold = MAX_SWIPE * 0.7;
    const maxSwipeRef = useRef(MAX_SWIPE);
    const localSwipeThresholdRef = useRef(localSwipeThreshold);

    useEffect(() => { qtyRef.current = qty; }, [qty]);
    useEffect(() => { addRef.current = add; }, [add]);
    useEffect(() => { removeRef.current = remove; }, [remove]);
    useEffect(() => {
        maxSwipeRef.current = MAX_SWIPE;
        localSwipeThresholdRef.current = localSwipeThreshold;
    }, [MAX_SWIPE, localSwipeThreshold]);

    const snapBack = useCallback(() => {
        Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            tension: 80,
            friction: 10,
            overshootClamping: true,
        }).start(() => { isSwiping.current = false; });
    }, [pan]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) =>
                Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
            onPanResponderGrant: () => { isSwiping.current = true; },
            onPanResponderMove: (_, gs) => {
                let newDx = gs.dx;
                if (qtyRef.current === 0 && newDx < 0) {
                    newDx = 0;
                } else if (newDx > maxSwipeRef.current) {
                    newDx = maxSwipeRef.current + (newDx - maxSwipeRef.current) * 0.2;
                } else if (newDx < -maxSwipeRef.current) {
                    newDx = -maxSwipeRef.current + (newDx + maxSwipeRef.current) * 0.2;
                }
                pan.setValue(newDx);
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dx > localSwipeThresholdRef.current) {
                    Animated.sequence([
                        Animated.timing(pan, { toValue: maxSwipeRef.current, duration: 60, useNativeDriver: false }),
                        Animated.spring(pan, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10, overshootClamping: true }),
                    ]).start(() => {
                        addRef.current(item);
                        isSwiping.current = false;
                    });
                } else if (gs.dx < -localSwipeThresholdRef.current && qtyRef.current > 0) {
                    Animated.sequence([
                        Animated.timing(pan, { toValue: -maxSwipeRef.current, duration: 60, useNativeDriver: false }),
                        Animated.spring(pan, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10, overshootClamping: true }),
                    ]).start(() => {
                        removeRef.current(item.id);
                        isSwiping.current = false;
                    });
                } else {
                    snapBack();
                }
            },
            onPanResponderTerminate: () => snapBack(),
        }),
    ).current;

    const swipeRightColor = isDark ? c.accent : '#004D6B';
    const swipeLeftColor = isDark ? c.danger : '#B20000';
    const priceColor = isDark ? c.accent : '#005A7A';

    // Single bg always present behind the card — color switches instantly at pan=0.
    // As the card slides it uncovers the color from beneath (no opacity trick needed).
    const slideBgColor = pan.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [swipeLeftColor, swipeRightColor, swipeRightColor],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.swipeContainer}>
            {/* Color bg always lives here — the card sliding uncovers it */}
            <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: slideBgColor, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }]}
            >
                <Animated.View style={{ 
                    opacity: pan.interpolate({ inputRange: [0, localSwipeThreshold], outputRange: [0, 1], extrapolate: 'clamp' }),
                    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
                }}>
                    {qty === 0 ? (
                        <Ionicons name="checkmark" size={20} color={swipeRightColor} />
                    ) : (
                        <Text style={{ color: swipeRightColor, fontSize: 14, fontWeight: 'bold' }}>+1</Text>
                    )}
                </Animated.View>
                <Animated.View style={{ 
                    opacity: pan.interpolate({ inputRange: [-localSwipeThreshold, 0], outputRange: [1, 0], extrapolate: 'clamp' }),
                    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
                }}>
                    {qty === 1 ? (
                        <Ionicons name="close" size={20} color={swipeLeftColor} />
                    ) : (
                        <Text style={{ color: swipeLeftColor, fontSize: 14, fontWeight: 'bold' }}>-1</Text>
                    )}
                </Animated.View>
            </Animated.View>

            {/* Item row — slides horizontally */}
            <Animated.View
                style={[{ backgroundColor: bgColor }, { transform: [{ translateX: pan }] }]}
                {...panResponder.panHandlers}
            >
                {qty > 0 && (
                    <View style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 6,
                        backgroundColor: swipeRightColor,
                        borderTopRightRadius: 6,
                        borderBottomRightRadius: 6,
                        zIndex: 10,
                    }} />
                )}
                <Pressable
                    style={({ pressed }) => [
                        styles.itemRow,
                        { borderBottomColor: borderColor },
                        pressed && !isSwiping.current && { opacity: 0.7 },
                    ]}
                    onPress={onPress}
                >
                    <View style={styles.itemInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            {qty > 0 && (
                                <Text style={{ color: priceColor, fontSize: 14, fontWeight: 'bold', marginRight: 8 }}>x{qty}</Text>
                            )}
                            <Text style={[styles.itemName, { color: c.text, marginBottom: 0, flexShrink: 1 }]}>{item.name}</Text>
                        </View>
                        {item.description ? (
                            <Text style={[styles.itemDesc, { color: c.textMuted }]} numberOfLines={2}>
                                {item.description}
                            </Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.itemPrice, { color: priceColor }]}>₪{item.price}</Text>
                        </View>
                    </View>
                    <ProductImage uri={item.image ? `${MEDIA_BASE}${item.image}` : undefined} />
                </Pressable>
            </Animated.View>
        </View>
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
    const { addMany } = useContext(CartContext);
    const [localQty, setLocalQty] = useState(1);
    const [imgErr, setImgErr] = useState(false);

    useEffect(() => {
        if (item) { setLocalQty(1); setImgErr(false); }
    }, [item?.id]);

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
                    <View
                        style={[
                            styles.dragHandle,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' },
                        ]}
                    />

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

                    {imgUri ? (
                        <Image
                            source={imgUri}
                            style={styles.sheetImage}
                            contentFit="cover"
                            onError={() => setImgErr(true)}
                        />
                    ) : null}

                    {item.description ? (
                        <Text style={[styles.sheetDesc, { color: c.textMuted }]}>
                            {item.description}
                        </Text>
                    ) : null}

                    <Text style={[styles.sheetPrice, { color: c.accent }]}>₪{item.price}</Text>

                    <View style={styles.sheetFooter}>
                        <View style={[styles.stepper, { backgroundColor: stepperBg }]}>
                            <Pressable
                                onPress={() => setLocalQty(q => Math.max(1, q - 1))}
                                style={styles.stepBtn}
                            >
                                <Ionicons name="remove" size={20} color={c.text} />
                            </Pressable>
                            <Text style={[styles.stepQty, { color: c.text }]}>{localQty}</Text>
                            <Pressable
                                onPress={() => setLocalQty(q => q + 1)}
                                style={styles.stepBtn}
                            >
                                <Ionicons name="add" size={20} color={c.text} />
                            </Pressable>
                        </View>
                        {/* Cart integration owned by Dana — onPress wired up in SCRUM-4.x */}
                        <Pressable style={[styles.addBtn, { backgroundColor: c.accent }]} onPress={() => {
                            addMany(item, localQty);
                            onClose();
                        }}>
                            <Text style={styles.addBtnText}>
                                Add to cart · ₪{(item.price * localQty).toFixed(2)}
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
    // Stable ref so listHeader callbacks are never stale
    const setModalItemRef = useRef(setModalItem);
    setModalItemRef.current = setModalItem;
    // Dismisses the active card stepper from outside (scroll, row press, tab press)
    const stepperDismissRef = useRef<(() => void) | null>(null);

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
    // With no paddingTop, hero bottom aligns with header bottom at scrollY = HERO_H - HEADER_H.
    const headerBgOpacity = scrollY.interpolate({
        inputRange: [HERO_H - HEADER_H - 70, HERO_H - HEADER_H],
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
        () => sections.map(s => ({ ...s, data: s.items, key: s.id })),
        [sections],
    );

    const listHeader = useMemo(() => {
        if (!restaurant) return null;
        const recommended = sections.flatMap(s => s.items).slice(0, 6);
        return (
            <View>
                <HeroImage uri={restaurant.image ? `${MEDIA_BASE}${restaurant.image}` : undefined} />
                <View style={[styles.infoBlock, { backgroundColor: c.surface }]}>
                    {/* Name — centered */}
                    <Text style={[styles.restName, { color: c.text, textAlign: 'center' }]}>
                        {restaurant.name}
                    </Text>

                    {/* Rating + hours — centered */}
                    <Text style={[styles.restMeta, { color: c.textMuted, textAlign: 'center' }]}>
                        {restaurant.rating > 0 ? `☺ ${restaurant.rating.toFixed(1)}` : ''}
                        {restaurant.openHours ? `  ·  ${restaurant.openHours}` : ''}
                    </Text>

                    {/* Description — centered, max 2 rows */}
                    {restaurant.description ? (
                        <Text
                            style={[styles.restDesc, { color: c.textMuted, textAlign: 'center' }]}
                            numberOfLines={2}
                        >
                            {restaurant.description}
                        </Text>
                    ) : null}

                    {/* Delivery fee in accent + time */}
                    <View style={styles.feeRow}>
                        <Text style={[styles.feeText, { color: c.accent }]}>
                            {restaurant.deliveryFee === 0
                                ? 'Free delivery'
                                : `₪${restaurant.deliveryFee} delivery`}
                        </Text>
                        {restaurant.deliveryTime > 0 ? (
                            <Text style={[styles.feeText, { color: c.textMuted }]}>
                                {'  ·  '}{restaurant.deliveryTime} min
                            </Text>
                        ) : null}
                    </View>

                    {/* Delivery pill — centered */}
                    <View style={{ alignItems: 'center', marginTop: Spacing[3] }}>
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

                {/* "Recommended for you" horizontal card carousel */}
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
                onScrollBeginDrag={() => stepperDismissRef.current?.()}
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
                    {/* Back button — always visible with glass circle */}
                    <Pressable
                        onPress={() => router.back()}
                        style={[
                            styles.headerBtn,
                            { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)' },
                        ]}
                    >
                        <Ionicons name="arrow-back" size={20} color={isDark ? '#fff' : '#1c1d2a'} />
                    </Pressable>

                    {/* Search pill — always visible over hero (frosted glass look) */}
                    <View style={styles.headerCenter} pointerEvents="none">
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
                    </View>

                    {/* ··· button — always visible */}
                    <View
                        style={[
                            styles.headerBtn,
                            { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)' },
                        ]}
                        pointerEvents="none"
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
        alignItems: 'center',
    },
    restName: {
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: 0.8,
        marginBottom: Spacing[2],
    },
    restMeta: { fontSize: Typography.sm, marginBottom: 3, lineHeight: 20 },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 3,
    },
    feeText: { fontSize: Typography.sm, fontWeight: '700', lineHeight: 20 },
    restDesc: { fontSize: Typography.sm, marginTop: Spacing[2], marginBottom: Spacing[2], lineHeight: 20 },
    deliveryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[3],
        paddingVertical: 8,
        borderRadius: 999,
        gap: 6,
    },
    deliveryPillText: { fontSize: Typography.sm, fontWeight: '600' },

    // "Recommended for you" section
    recSection: {
        paddingTop: Spacing[4],
        paddingBottom: Spacing[3],
    },
    recSectionTitle: {
        fontSize: Typography.h3,
        fontWeight: '900',
        letterSpacing: -0.3,
        paddingHorizontal: Spacing[4],
        marginBottom: Spacing[3],
    },
    recScrollContent: {
        paddingHorizontal: Spacing[4],
        gap: Spacing[3],
    },
    recCardWrap: {
        width: 158,
        borderRadius: 14,
        overflow: 'hidden',
    },
    recCard: {
        width: 158,
        borderRadius: 14,
        overflow: 'hidden',
    },
    recCardImg: {
        width: 158,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    recCardBody: {
        padding: Spacing[2],
        paddingTop: 6,
    },
    recCardPrice: { fontSize: Typography.sm, fontWeight: '800', marginBottom: 2 },
    recCardName: { fontSize: Typography.xs, lineHeight: 16 },
    // "+" / count badge — top-right corner; expands to stepper when open
    recCardPlus: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 8,
        paddingVertical: 11,
        borderBottomLeftRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    recCardBadgeQty: {
        fontSize: Typography.xs,
        fontWeight: '900',
        minWidth: 16,
        textAlign: 'center',
    },
    recCardStepper: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        zIndex: 2,
    },
    recCardStepBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recCardStepQty: {
        fontSize: Typography.xs,
        fontWeight: '400',
        minWidth: 16,
        textAlign: 'center',
    },

    // Section headers (in list body)
    sectionTitle: {
        fontSize: Typography.h3,
        fontWeight: '900',
        letterSpacing: -0.3,
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[5],
        paddingBottom: Spacing[3],
    },

    // Swipeable item row
    swipeContainer: { overflow: 'hidden' },
    swipeBgLeft: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 20,
    },
    swipeBgRight: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
    },

    // Menu item rows
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
