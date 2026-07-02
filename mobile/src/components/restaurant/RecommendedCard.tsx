import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { CartContext } from '../../context/CartContext';
import { MEDIA_BASE, type Product } from '../../services/api';

const PALE_BLUE = '#DDF7FF';

export default function RecommendedCard({
    item,
    onPress,
    stepperDismissRef,
}: {
    item: Product;
    onPress: () => void;
    stepperDismissRef: React.MutableRefObject<(() => void) | null>;
}) {
    const [imgErr, setImgErr] = useState(false);
    const { getQty, add, remove } = useContext(CartContext);
    const qty = getQty(item.restaurantId, item.id);
    const [stepperExpanded, setStepperExpanded] = useState(false);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const imgUri = item.image && !imgErr
        ? (item.image.startsWith('data:') || item.image.startsWith('http')
            ? item.image
            : `${MEDIA_BASE}${item.image}`)
        : undefined;
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
        remove(item.restaurantId, item.id);
        const nextQty = qty - 1;
        if (nextQty <= 0) {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setStepperExpanded(false);
        } else {
            scheduleClose();
        }
    };
    const handleCardPress = () => {
        setStepperExpanded(false);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        onPress();
    };
    // Count badge press → re-expand stepper (close any other open stepper first)
    const handleBadgePress = () => { stepperDismissRef.current?.(); setStepperExpanded(true); scheduleClose(); };

    // At-rest badge + stepper bg: #DDF7FF (light) / dark surface (dark)
    const restBg    = isDark ? Colors.dark.surface : PALE_BLUE;
    const restText  = isDark ? '#00C2E8' : '#004D6B';
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

const styles = StyleSheet.create({
    recCardWrap: { width: 158, borderRadius: 14, overflow: 'hidden' },
    recCard: { width: 158, borderRadius: 14, overflow: 'hidden' },
    recCardImg: { width: 158, height: 110, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    recCardBody: { padding: Spacing[2], paddingTop: 6 },
    recCardPrice: { fontSize: Typography.sm, fontWeight: '800', marginBottom: 2 },
    recCardName: { fontSize: Typography.xs, lineHeight: 16 },
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
    recCardBadgeQty: { fontSize: Typography.xs, fontWeight: '900', minWidth: 16, textAlign: 'center' },
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
    recCardStepBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    recCardStepQty: { fontSize: Typography.xs, fontWeight: '400', minWidth: 16, textAlign: 'center' },
});
