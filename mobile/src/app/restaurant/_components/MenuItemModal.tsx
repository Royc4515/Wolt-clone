import { useContext, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../../constants/theme';
import { CartContext } from '../../../context/CartContext';
import { MEDIA_BASE, type Product } from '../../../services/api';

export function MenuItemModal({
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

const styles = StyleSheet.create({
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
