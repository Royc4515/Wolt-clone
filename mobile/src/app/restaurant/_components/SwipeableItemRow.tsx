import { useCallback, useContext, useEffect, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../../constants/theme';
import { CartContext } from '../../../context/CartContext';
import { MEDIA_BASE, type Product } from '../../../services/api';
import ProductImage from './ProductImage';

export default function SwipeableItemRow({
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
    const qty = getQty(item.restaurantId, item.id);
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
                        removeRef.current(item.restaurantId, item.id);
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
    const swipeLeftColor  = isDark ? c.danger : '#B20000';
    const priceColor      = isDark ? c.accent : '#005A7A';

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
                    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
                }}>
                    {qty === 0 ? (
                        <Ionicons name="checkmark" size={20} color={swipeRightColor} />
                    ) : (
                        <Text style={{ color: swipeRightColor, fontSize: 14, fontWeight: 'bold' }}>+1</Text>
                    )}
                </Animated.View>
                <Animated.View style={{
                    opacity: pan.interpolate({ inputRange: [-localSwipeThreshold, 0], outputRange: [1, 0], extrapolate: 'clamp' }),
                    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
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
                        left: 0, top: 0, bottom: 0,
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
                    <ProductImage uri={item.image
                        ? (item.image.startsWith('data:') || item.image.startsWith('http')
                            ? item.image
                            : `${MEDIA_BASE}${item.image}`)
                        : undefined} />
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    swipeContainer: { overflow: 'hidden' },
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
});
