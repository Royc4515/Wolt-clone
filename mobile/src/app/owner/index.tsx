import { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    Animated,
    LayoutAnimation,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    UIManager,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { deleteRestaurant, getRestaurants, MEDIA_BASE, type Restaurant } from '../../services/api';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function RestaurantCard({
    item,
    expanded,
    onToggle,
    onDelete,
    colors: c,
    isDark,
}: {
    item: Restaurant;
    expanded: boolean;
    onToggle: () => void;
    onDelete: () => void;
    colors: typeof Colors.light;
    isDark: boolean;
}) {
    const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: expanded ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [expanded]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View style={[
            styles.cardWrapper, 
            { 
                shadowColor: '#000', 
                shadowOpacity: isDark ? 0.4 : 0.08, 
                shadowRadius: 12, 
                shadowOffset: { width: 0, height: 4 }, 
                elevation: 3 
            }
        ]}>
            <View style={[
                styles.card, 
                { backgroundColor: c.surface, borderColor: expanded ? c.accent : c.border }
            ]}>
                {/* ── Collapsed row ─────────────────────────────────────── */}
                <Pressable style={styles.cardTop} onPress={onToggle}>
                    {/* Image */}
                    <View style={styles.imgWrap}>
                        {item.image ? (
                            <Image
                                source={{ uri: item.image.startsWith('data:') || item.image.startsWith('http') ? item.image : `${MEDIA_BASE}${item.image}` }}
                                style={styles.img}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={[styles.img, styles.imgFallback, { backgroundColor: c.accent + '18' }]}>
                                <Ionicons name="storefront-outline" size={32} color={c.accent} />
                            </View>
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.cardCategory, { color: c.textMuted }]} numberOfLines={1}>
                            {item.category}
                        </Text>

                        <View style={styles.pillRow}>
                            {item.rating > 0 && (
                                <View style={[styles.pill, { backgroundColor: c.text + '0A' }]}>
                                    <Ionicons name="happy-outline" size={13} color={c.textMuted} />
                                    <Text style={[styles.pillText, { color: c.textMuted }]}>
                                        {item.rating.toFixed(1)}
                                    </Text>
                                </View>
                            )}
                            {item.deliveryTime > 0 && (
                                <View style={[styles.pill, { backgroundColor: c.text + '0A' }]}>
                                    <Ionicons name="time-outline" size={13} color={c.textMuted} />
                                    <Text style={[styles.pillText, { color: c.textMuted }]}>
                                        {item.deliveryTime} min
                                    </Text>
                                </View>
                            )}
                            <View style={[
                                styles.pill,
                                { backgroundColor: item.deliveryFee === 0 ? c.accent + '15' : c.text + '0A' },
                            ]}>
                                <Ionicons
                                    name="bicycle-outline"
                                    size={13}
                                    color={item.deliveryFee === 0 ? c.accent : c.textMuted}
                                />
                                <Text style={[styles.pillText, { color: item.deliveryFee === 0 ? c.accent : c.textMuted }]}>
                                    {item.deliveryFee === 0 ? 'Free' : `₪${item.deliveryFee}`}
                                </Text>
                            </View>
                        </View>

                        {/* Primary actions — always visible */}
                        <View style={styles.primaryActions}>
                            <Pressable
                                style={({ pressed }) => [styles.pillBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }]}
                                onPress={() => router.push(`/restaurant/${(item as any)._id || item.id}`)}
                            >
                                <Ionicons name="eye-outline" size={16} color="#fff" />
                                <Text style={styles.pillBtnText}>View page</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.pillBtn, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, pressed && { opacity: 0.8 }]}
                                onPress={() => router.push(`/owner/${(item as any)._id || item.id}/orders`)}
                            >
                                <Ionicons name="receipt-outline" size={16} color={c.text} />
                                <Text style={[styles.pillBtnText, { color: c.text }]}>Orders</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Chevron */}
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color={c.textMuted}
                            style={styles.chevron}
                        />
                    </Animated.View>
                </Pressable>

                {/* ── Expanded management strip ──────────────────────────── */}
                {expanded && (
                    <View style={[styles.expandedStrip, { borderTopColor: c.border }]}>
                        <Pressable
                            style={[styles.mgmtBtn, { backgroundColor: c.accent + '18' }]}
                            onPress={() => router.push(`/owner/edit-restaurant/${(item as any)._id || item.id}`)}
                        >
                            <Ionicons name="pencil-outline" size={18} color={c.accent} />
                            <Text style={[styles.mgmtBtnText, { color: c.accent }]}>Edit</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.mgmtBtn, { backgroundColor: c.accent + '18' }]}
                            onPress={() => router.push(`/owner/${(item as any)._id || item.id}/dishes`)}
                        >
                            <Ionicons name="restaurant-outline" size={18} color={c.accent} />
                            <Text style={[styles.mgmtBtnText, { color: c.accent }]}>Menu</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.mgmtBtn, { backgroundColor: c.danger + '15' }]}
                            onPress={onDelete}
                        >
                            <Ionicons name="trash-outline" size={18} color={c.danger} />
                            <Text style={[styles.mgmtBtnText, { color: c.danger }]}>Delete</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function OwnerDashboardScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { token, user } = useAuth();
    const insets = useSafeAreaInsets();
    const headerHeight = insets.top + (Platform.OS === 'ios' ? 44 : 56);

    const scrollY = useRef(new Animated.Value(0)).current;

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const all = await getRestaurants();
            const myId = user?._id ?? user?.id;
            setRestaurants(all.filter((r) => r.ownerId === myId));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load restaurants');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?._id, user?.id]);


    useFocusEffect(
        useCallback(() => {
            if (!token || user?.role !== 'admin') return;
            load();
        }, [token, user?.role, load])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load(true);
    }, [load]);

    const toggle = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const handleDelete = (r: Restaurant) => {
        Alert.alert(
            'Delete restaurant',
            `Delete "${r.name}"? This will also remove all its dishes.`,
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
                                            const idToUse = (r as any)._id || r.id;
                                            await deleteRestaurant(idToUse, token!);
                                            setRestaurants((prev) => prev.filter((x) => x.id !== r.id));
                                            setExpandedId(null);
                                        } catch (err: unknown) {
                                            Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed');
                                        }
                                    },
                                },
                            ]
                        );
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
                <Pressable onPress={() => load()} style={[styles.actionPill, { backgroundColor: c.accent }]}>
                    <Text style={styles.actionPillText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    // Extended FAB animations
    const fabWidth = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [180, 56],
        extrapolate: 'clamp',
    });
    
    const textOpacity = scrollY.interpolate({
        inputRange: [0, 30],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            <Stack.Screen 
                options={{
                    headerTransparent: true,
                    headerBackground: () => (
                        <BlurView 
                            intensity={isDark ? 30 : 60} 
                            tint={isDark ? 'dark' : 'light'} 
                            style={StyleSheet.absoluteFill} 
                        />
                    ),
                    headerTitleStyle: { color: c.text },
                    headerLeft: restaurants.length === 0 ? () => (
                        <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: 8 }}>
                            <Ionicons name="arrow-back" size={24} color={c.text} />
                        </Pressable>
                    ) : undefined,
                }}
            />
            
            <Animated.FlatList
                data={restaurants}
                keyExtractor={(r) => r.id}
                contentContainerStyle={[styles.list, { paddingTop: headerHeight + Spacing[4] }, restaurants.length === 0 && styles.listEmpty]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} progressViewOffset={headerHeight} />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: c.accent + '15' }]}>
                            <Ionicons name="storefront" size={64} color={c.accent} />
                            <View style={[styles.emptyIconBadge, { backgroundColor: c.background }]}>
                                <Ionicons name="sparkles" size={24} color={c.accent} />
                            </View>
                        </View>
                        <Text style={[styles.emptyTitle, { color: c.text }]}>Grow Your Business</Text>
                        <Text style={[styles.emptyText, { color: c.textMuted }]}>
                            Join Wolt and start reaching new customers today. Creating your first restaurant only takes a few minutes.
                        </Text>
                        <Pressable
                            onPress={() => router.push('/owner/new-restaurant')}
                            style={[styles.emptyActionPill, { backgroundColor: c.accent }]}
                        >
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.emptyActionPillText}>Create Restaurant</Text>
                        </Pressable>
                    </View>
                }
                renderItem={({ item }) => (
                    <RestaurantCard
                        item={item}
                        expanded={expandedId === item.id}
                        onToggle={() => toggle(item.id)}
                        onDelete={() => handleDelete(item)}
                        colors={c}
                        isDark={isDark}
                    />
                )}
            />

            {restaurants.length > 0 && (
                <Animated.View style={[styles.fab, { backgroundColor: c.accent, width: fabWidth, bottom: Spacing[6] + insets.bottom }]}>
                    <Pressable
                        onPress={() => router.push('/owner/new-restaurant')}
                        style={StyleSheet.absoluteFillObject}
                    >
                        <View style={styles.fabInner}>
                            <Ionicons name="add" size={28} color="#fff" />
                            <Animated.Text
                                style={[styles.fabText, { opacity: textOpacity }]}
                                numberOfLines={1}
                            >
                                Add Restaurant
                            </Animated.Text>
                        </View>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[5] },
    list: { paddingHorizontal: Spacing[4], paddingBottom: 120 },
    listEmpty: { flex: 1, justifyContent: 'center', paddingBottom: 0 },

    // ── Empty state ────────────────────────────────────────────────────────
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing[6],
        gap: Spacing[4],
        marginTop: -60,
    },
    emptyIconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing[2],
    },
    emptyIconBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        borderRadius: 20,
        padding: 4,
    },
    emptyTitle: { fontSize: Typography.h2, fontWeight: '800', textAlign: 'center' },
    emptyText: { fontSize: Typography.base, textAlign: 'center', lineHeight: 24, paddingHorizontal: Spacing[4] },
    
    emptyActionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: Spacing[4],
        paddingHorizontal: Spacing[6],
        paddingVertical: 16,
        borderRadius: 16,
    },
    emptyActionPillText: { color: '#fff', fontWeight: '800', fontSize: Typography.base },

    // ── Shared pill button ─────────────────────────────────────────────────
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing[4],
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[3],
        borderRadius: 12,
    },
    actionPillText: { color: '#fff', fontWeight: '700', fontSize: Typography.base },

    // ── Card ───────────────────────────────────────────────────────────────
    cardWrapper: {
        marginBottom: Spacing[4],
        borderRadius: 16,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing[4],
        gap: Spacing[4],
    },

    // Image
    imgWrap: { flexShrink: 0 },
    img: { width: 84, height: 84, borderRadius: 12 },
    imgFallback: { alignItems: 'center', justifyContent: 'center' },

    // Text info
    cardInfo: { flex: 1, gap: 4 },
    cardName: { fontSize: Typography.lg, fontWeight: '800' },
    cardCategory: { fontSize: Typography.sm, fontWeight: '700' },
    cardSummary: { fontSize: Typography.xs, fontWeight: '500' },

    // Primary pill buttons inside card
    primaryActions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[2], flexWrap: 'wrap' },
    pillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    pillBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    // Pill row (used for ratings, delivery)
    pillRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap', marginTop: 2 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pillText: { fontSize: Typography.xs, fontWeight: '600' },

    // Chevron
    chevron: { paddingHorizontal: Spacing[1] },

    // Expanded management strip
    expandedStrip: {
        flexDirection: 'row',
        borderTopWidth: 1.5,
        padding: Spacing[3],
        gap: Spacing[3],
    },
    mgmtBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: Spacing[3],
        borderRadius: 12,
    },
    mgmtBtnText: { fontSize: Typography.sm, fontWeight: '700' },

    // FAB
    fab: {
        position: 'absolute',
        right: Spacing[5],
        height: 56,
        borderRadius: 28,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    fabInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        width: 180, // match max width
    },
    fabText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: Typography.base,
        marginLeft: 8,
    },
});
