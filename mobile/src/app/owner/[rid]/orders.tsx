import { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../../constants/theme';

export default function RestaurantOrdersScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { rid } = useLocalSearchParams<{ rid: string }>();

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            <View style={styles.emptyState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: c.accent + '15' }]}>
                    <Ionicons name="receipt-outline" size={64} color={c.accent} />
                    <View style={[styles.emptyIconBadge, { backgroundColor: c.background }]}>
                        <Ionicons name="construct" size={24} color={c.accent} />
                    </View>
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>Orders Coming Soon</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                    This screen is currently under construction. Soon you will be able to manage orders for restaurant #{rid}.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
});
