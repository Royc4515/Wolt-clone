import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    LayoutAnimation,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    UIManager,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeContext } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../../../constants/theme';
import {
    deleteProduct,
    getMenu,
    MEDIA_BASE,
    updateProduct,
    type MenuSection,
    type Product,
} from '../../../../services/api';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const CARD_HEIGHT = 100; // used for drag position math — cards size naturally

// ── Draggable dish row ───────────────────────────────────────────────────────

function DraggableRow({
    dish,
    idx,
    nItems,
    draggingIdx,
    dragTranslation,
    hoverIdx,
    onDragStart,
    onDrop,
    onEdit,
    onDelete,
    colors: c,
    isFirst,
    isLast,
}: {
    dish: Product;
    idx: number;
    nItems: number;
    draggingIdx: ReturnType<typeof useSharedValue<number>>;
    dragTranslation: ReturnType<typeof useSharedValue<number>>;
    hoverIdx: ReturnType<typeof useSharedValue<number>>;
    onDragStart: () => void;
    onDrop: (from: number, to: number) => void;
    onEdit: () => void;
    onDelete: () => void;
    colors: typeof Colors.light;
    isFirst: boolean;
    isLast: boolean;
}) {
    const gesture = Gesture.Pan()
        .activateAfterLongPress(280)
        .onStart(() => {
            draggingIdx.value = idx;
            dragTranslation.value = 0;
            hoverIdx.value = idx;
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            runOnJS(onDragStart)();
        })
        .onUpdate((e) => {
            dragTranslation.value = e.translationY;
            hoverIdx.value = Math.max(
                0,
                Math.min(nItems - 1, Math.round(idx + e.translationY / CARD_HEIGHT))
            );
        })
        .onEnd(() => {
            const from = draggingIdx.value;
            const to = hoverIdx.value;
            draggingIdx.value = -1;
            dragTranslation.value = 0;
            hoverIdx.value = -1;
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            runOnJS(onDrop)(from, to);
        });

    const animStyle = useAnimatedStyle(() => {
        const dIdx = draggingIdx.value;
        const hIdx = hoverIdx.value;
        const trans = dragTranslation.value;

        // Instant reset — items are already at their correct list positions after
        // React re-renders with the new order, so no translateY needed.
        if (dIdx === -1) {
            return { transform: [{ translateY: 0 }] };
        }

        if (idx === dIdx) {
            return {
                transform: [{ translateY: trans }, { scale: 1.04 }],
                zIndex: 100,
                elevation: 12,
                shadowOpacity: 0.3,
            };
        }

        let shift = 0;
        if (hIdx > dIdx && idx > dIdx && idx <= hIdx) shift = -CARD_HEIGHT;
        else if (hIdx < dIdx && idx >= hIdx && idx < dIdx) shift = CARD_HEIGHT;

        return {
            transform: [{ translateY: withTiming(shift, { duration: 150 }) }],
            zIndex: 1,
            elevation: 0,
            shadowOpacity: 0,
        };
    });

    const imageUri = dish.image
        ? dish.image.startsWith('data:') || dish.image.startsWith('http')
            ? dish.image
            : `${MEDIA_BASE}${dish.image}`
        : '';

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                style={[
                    styles.card,
                    { backgroundColor: c.surface, borderBottomColor: c.border },
                    isFirst && styles.cardFirst,
                    isLast && styles.cardLast,
                    !isLast && { borderBottomWidth: 1 },
                    animStyle,
                ]}
            >
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
                ) : (
                    <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: c.accent + '15' }]}>
                        <Ionicons name="fast-food-outline" size={20} color={c.accent} />
                    </View>
                )}

                <View style={styles.cardInfo}>
                    <View style={styles.cardNameRow}>
                        <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                            {dish.name}
                        </Text>
                        {!dish.isAvailable && (
                            <View style={[styles.unavailableBadge, { backgroundColor: c.danger + '20' }]}>
                                <Text style={[styles.unavailableText, { color: c.danger }]}>Unavailable</Text>
                            </View>
                        )}
                    </View>
                    {dish.description ? (
                        <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={1}>
                            {dish.description}
                        </Text>
                    ) : null}
                    <Text style={[styles.cardPrice, { color: c.accent }]}>
                        ₪{dish.price.toFixed(2)}
                    </Text>
                </View>

                <View style={styles.cardRight}>
                    <Ionicons name="reorder-three-outline" size={22} color={c.textMuted} />
                    <View style={styles.cardActions}>
                        <Pressable
                            onPress={onEdit}
                            style={[styles.actionBtn, { backgroundColor: c.accent + '20' }]}
                        >
                            <Ionicons name="pencil-outline" size={16} color={c.accent} />
                        </Pressable>
                        <Pressable
                            onPress={onDelete}
                            style={[styles.actionBtn, { backgroundColor: c.danger + '20' }]}
                        >
                            <Ionicons name="trash-outline" size={16} color={c.danger} />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

// ── Sortable section ─────────────────────────────────────────────────────────

function SortableSection({
    section,
    collapsed,
    onToggle,
    onSectionReorder,
    onSectionMove,
    onDelete,
    colors: c,
    rid,
    token,
    onDragStateChange,
}: {
    section: MenuSection;
    collapsed: boolean;
    onToggle: () => void;
    onSectionReorder: (sectionId: string, newItems: Product[]) => void;
    onSectionMove: (sectionId: string, steps: number) => void;
    onDelete: (dish: Product) => void;
    colors: typeof Colors.light;
    rid: string;
    token: string;
    onDragStateChange: (dragging: boolean) => void;
}) {
    const [items, setItems] = useState<Product[]>([...section.items]);
    const itemsRef = useRef<Product[]>(items);

    // Sync from parent when section changes (e.g. after load/refresh)
    useEffect(() => {
        itemsRef.current = [...section.items];
        setItems([...section.items]);
    }, [section.id, section.items.length]);

    const draggingIdx = useSharedValue(-1);
    const dragTranslation = useSharedValue(0);
    const hoverIdx = useSharedValue(-1);

    // Section-level drag
    const sectIsActive = useSharedValue(false);
    const sectTransY = useSharedValue(0);

    const sectionGesture = Gesture.Pan()
        .activateAfterLongPress(280)
        .onStart(() => {
            sectIsActive.value = true;
            runOnJS(onDragStateChange)(true);
        })
        .onUpdate((e) => {
            sectTransY.value = e.translationY;
        })
        .onEnd((e) => {
            const steps = Math.round(e.translationY / 100);
            sectIsActive.value = false;
            sectTransY.value = 0;
            runOnJS(onDragStateChange)(false);
            if (steps !== 0) runOnJS(onSectionMove)(section.id, steps);
        });

    const sectionHeaderAnimStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: sectTransY.value }],
        zIndex: sectIsActive.value ? 100 : 1,
        opacity: withTiming(sectIsActive.value ? 0.82 : 1, { duration: 100 }),
        elevation: sectIsActive.value ? 6 : 0,
    }));

    const handleDragStart = useCallback(() => {
        onDragStateChange(true);
    }, [onDragStateChange]);

    const handleDrop = useCallback((from: number, to: number) => {
        onDragStateChange(false);
        if (from === to) return;

        const current = itemsRef.current;
        const reordered = [...current];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        const withOrders = reordered.map((d, i) => ({ ...d, sectionOrder: i }));

        itemsRef.current = withOrders;
        setItems(withOrders);
        onSectionReorder(section.id, withOrders);
    }, [section.id, onSectionReorder]);

    const handleDelete = useCallback((dish: Product) => {
        onDelete(dish);
        setItems((prev) => {
            const next = prev.filter((d) => d.id !== dish.id);
            itemsRef.current = next;
            return next;
        });
    }, [onDelete]);

    return (
        <View>
            <GestureDetector gesture={sectionGesture}>
                <Animated.View style={sectionHeaderAnimStyle}>
                    <Pressable
                        style={[styles.sectionRow, { borderBottomColor: c.border }]}
                        onPress={onToggle}
                    >
                        <View style={styles.sectionLeft}>
                            <Ionicons name="reorder-three-outline" size={16} color={c.textMuted} />
                            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>
                                {section.title.toUpperCase()}
                            </Text>
                            <Text style={[styles.sectionCount, { color: c.textMuted }]}>
                                {items.length}
                            </Text>
                        </View>
                        <Ionicons
                            name={collapsed ? 'chevron-forward' : 'chevron-down'}
                            size={14}
                            color={c.textMuted}
                        />
                    </Pressable>
                </Animated.View>
            </GestureDetector>

            {!collapsed && (
                <View>
                    {items.map((dish, idx) => (
                        <DraggableRow
                            key={dish.id}
                            dish={dish}
                            idx={idx}
                            nItems={items.length}
                            draggingIdx={draggingIdx}
                            dragTranslation={dragTranslation}
                            hoverIdx={hoverIdx}
                            onDragStart={handleDragStart}
                            onDrop={handleDrop}
                            onEdit={() => router.push(`/owner/${rid}/dishes/${(dish as any)._id || dish.id}/edit`)}
                            onDelete={() => handleDelete(dish)}
                            colors={c}
                            isFirst={idx === 0}
                            isLast={idx === items.length - 1}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}


// ── Main screen ──────────────────────────────────────────────────────────────

export default function DishListScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { token, user } = useAuth();
    const { rid } = useLocalSearchParams<{ rid: string }>();

    const [sections, setSections] = useState<MenuSection[]>([]);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scrollEnabled, setScrollEnabled] = useState(true);

    const scrollY = useSharedValue(0);

    const fabAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: withTiming(scrollY.value > 50 ? 0.7 : 1, { duration: 200 }) },
            { translateY: withTiming(scrollY.value > 50 ? 20 : 0, { duration: 200 }) }
        ],
        opacity: withTiming(scrollY.value > 50 ? 0.8 : 1, { duration: 200 })
    }));

    const handleDragStateChange = useCallback((isDragging: boolean) => {
        setScrollEnabled(!isDragging);
    }, []);

    useEffect(() => {
        if (!token || user?.role !== 'admin') { router.replace('/(tabs)/profile'); return; }
    }, [token, user?.role]);

    const load = useCallback(async (isRefresh = false) => {
        if (!rid) return;
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const data = await getMenu(rid);
            setSections(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load dishes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [rid]);

    useFocusEffect(
        useCallback(() => { load(); }, [load])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load(true);
    }, [load]);

    const pendingSectionMoveRef = useRef(false);

    const handleSectionMove = useCallback((sectId: string, steps: number) => {
        pendingSectionMoveRef.current = true;
        setSections((prev) => {
            const idx = prev.findIndex((s) => s.id === sectId);
            const targetIdx = Math.max(0, Math.min(prev.length - 1, idx + steps));
            if (targetIdx === idx) {
                pendingSectionMoveRef.current = false;
                return prev;
            }
            const next = [...prev];
            const [moved] = next.splice(idx, 1);
            next.splice(targetIdx, 0, moved);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            return next;
        });
    }, []);

    useEffect(() => {
        if (!pendingSectionMoveRef.current || !token) return;
        pendingSectionMoveRef.current = false;
        Promise.all(
            sections.flatMap((section, sIdx) =>
                section.items.map((dish, dIdx) =>
                    updateProduct(rid, (dish as any)._id || dish.id, { sectionOrder: sIdx * 10000 + dIdx }, token)
                )
            )
        ).catch(() => load());
    }, [sections]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSectionReorder = useCallback(async (sectionId: string, newItems: Product[]) => {
        setSections((prev) =>
            prev.map((s) => s.id === sectionId ? { ...s, items: newItems } : s)
        );
        try {
            await Promise.all(
                newItems.map((item, idx) =>
                    updateProduct(rid, (item as any)._id || item.id, { sectionOrder: idx }, token!)
                )
            );
        } catch {
            load();
        }
    }, [rid, token, load]);

    const handleDelete = useCallback((dish: Product) => {
        Alert.alert(
            'Delete dish',
            `Delete "${dish.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Are you sure?',
                            'This action cannot be undone.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Yes, delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            await deleteProduct(rid, (dish as any)._id || dish.id, token!);
                                            setSections((prev) =>
                                                prev
                                                    .map((s) => ({ ...s, items: s.items.filter((x) => x.id !== dish.id) }))
                                                    .filter((s) => s.items.length > 0)
                                            );
                                        } catch (err: unknown) {
                                            const msg = err instanceof Error ? err.message : 'Delete failed';
                                            Alert.alert('Error', msg.includes('403') ? "You don't have permission" : msg);
                                        }
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    }, [rid, token]);

    if (!token || user?.role !== 'admin') return null;

    const toggleSection = (sectionId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    const totalDishes = sections.reduce((sum, s) => sum + s.items.length, 0);

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
                <Pressable onPress={() => load()} style={[styles.actionPill, { backgroundColor: c.accent }]}>
                    <Text style={styles.actionPillText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    if (totalDishes === 0) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <Ionicons name="fast-food-outline" size={56} color={c.textMuted} />
                <Text style={[styles.emptyTitle, { color: c.text }]}>No dishes yet</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                    Tap the button below to add your first dish.
                </Text>
                <Pressable
                    onPress={() => router.push(`/owner/${rid}/dishes/new`)}
                    style={[styles.actionPill, { backgroundColor: c.accent }]}
                >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.actionPillText}>Add Dish</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            <Animated.ScrollView
                scrollEnabled={scrollEnabled}
                contentContainerStyle={styles.list}
                onScroll={(e) => {
                    scrollY.value = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
                }
            >
                <Text style={[styles.counter, { color: c.textMuted }]}>
                    {totalDishes} {totalDishes === 1 ? 'dish' : 'dishes'} · {sections.length} {sections.length === 1 ? 'section' : 'sections'} · hold & drag to reorder
                </Text>

                {sections.map((section) => (
                    <SortableSection
                        key={section.id}
                        section={section}
                        collapsed={collapsed.has(section.id)}
                        onToggle={() => toggleSection(section.id)}
                        onSectionReorder={handleSectionReorder}
                        onSectionMove={handleSectionMove}
                        onDelete={handleDelete}
                        colors={c}
                        rid={rid}
                        token={token!}
                        onDragStateChange={handleDragStateChange}
                    />
                ))}
            </Animated.ScrollView>

            <AnimatedPressable
                style={[
                    styles.fab, 
                    { backgroundColor: c.accent },
                    fabAnimatedStyle
                ]}
                onPress={() => router.push(`/owner/${rid}/dishes/new`)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </AnimatedPressable>
        </View>
    );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[5] },
    list: { padding: Spacing[4], paddingBottom: 100 },

    counter: {
        fontSize: Typography.xs,
        fontWeight: '600',
        marginBottom: Spacing[3],
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },

    emptyTitle: { fontSize: Typography.h3, fontWeight: '700', marginTop: Spacing[2] },
    emptyText: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20, marginTop: Spacing[2] },

    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing[3],
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[3],
        borderRadius: 12,
    },
    actionPillText: { color: '#fff', fontWeight: '700', fontSize: Typography.base },

    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing[2],
        marginTop: Spacing[3],
        marginBottom: Spacing[1],
        borderBottomWidth: 1,
    },
    sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
    sectionCount: { fontSize: Typography.xs, fontWeight: '600' },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[3],
        gap: Spacing[3],
    },
    cardFirst: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    cardLast: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginBottom: Spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    thumb: { width: 52, height: 52, borderRadius: 10, flexShrink: 0 },
    thumbFallback: { alignItems: 'center', justifyContent: 'center' },

    cardInfo: { flex: 1, gap: 2 },
    cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap' },
    cardName: { fontSize: Typography.sm, fontWeight: '700', flexShrink: 1 },
    cardDesc: { fontSize: Typography.xs, lineHeight: 16 },
    cardPrice: { fontSize: Typography.sm, fontWeight: '700', marginTop: 1 },

    unavailableBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    unavailableText: { fontSize: 10, fontWeight: '700' },

    cardRight: { alignItems: 'center', gap: Spacing[2] },
    cardActions: { flexDirection: 'column', gap: 6 },
    actionBtn: { padding: 7, borderRadius: 8 },

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
