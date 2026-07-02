import React, { useContext, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import { Colors, Spacing, Typography } from '../constants/theme';
import { Image } from 'expo-image';
import { getRestaurant, MEDIA_BASE, type Restaurant } from '../services/api';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

export default function CartOverviewScreen() {
    const { carts, clearCart } = useContext(CartContext);
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const c = isDark ? Colors.dark : Colors.light;
    const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});

    const dynamicStyles = {
        containerBg: c.background,
        textColor: c.text,
        buttonBg: c.accent,
        errorColor: c.danger || '#FF3B30',
        placeholder: c.textMuted,
    };

    useEffect(() => {
        Object.keys(carts).forEach(async (rid) => {
            if (!restaurants[rid]) {
                const data = await getRestaurant(rid);
                setRestaurants(prev => ({ ...prev, [rid]: data }));
            }
        });
    }, [carts]);

    return (
        <View style={[styles.fill, { backgroundColor: c.background }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Your Carts',
                headerStyle: { backgroundColor: dynamicStyles.containerBg },
                headerShadowVisible: false,
                headerTintColor: dynamicStyles.textColor,
                headerBackTitle: 'Back',
                headerRight: () => <ThemeToggleButton/>
                }}
            />
            <FlatList
                data={Object.entries(carts)}
                keyExtractor={([rid]) => rid}
                contentContainerStyle={Object.keys(carts).length === 0 ? styles.emptyListContent : styles.list}
                // Empty cart state
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: c.accent + '15' }]}>
                            <Ionicons name="cart-outline" size={64} color={c.accent} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: c.text }]}>No active carts</Text>
                        <Text style={[styles.emptySub, { color: c.textMuted }]}>
                            Your active carts will appear here. Start browsing restaurants to add items!
                        </Text>
                    </View>
                }
                renderItem={({ item: [restaurantId, items] }) => {
                    const rest = restaurants[restaurantId];
                    const subtotal = items.reduce((s, i) => s + (i.item.price * i.qty), 0);

                    // Restaurant image logic.
                    const restImgUri = rest?.image 
                        ? (rest.image.startsWith('http') || rest.image.startsWith('data:') ? rest.image : `${MEDIA_BASE}${rest.image}`) 
                        : undefined;

                    return (
                        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                            {/* Header: Restaurant Image + Name + Trash Icon */}
                            <View style={styles.header}>
                                <View style={styles.restInfo}>
                                    {restImgUri ? (
                                        <Image source={{ uri: restImgUri }} style={styles.avatar} />
                                    ) : (
                                        /* Fallback for missing restaurant image */
                                        <View style={[styles.avatar, { backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }]}>
                                            <Ionicons name="storefront-outline" size={24} color={c.textMuted} />
                                        </View>
                                    )}
                                    <View>
                                        <Text style={[styles.name, { color: c.text }]}>{rest?.name || "Loading..."}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={() => clearCart(restaurantId)} hitSlop={8}>
                                    <Ionicons name="trash-outline" size={20} color={dynamicStyles.errorColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Subtle dashed divider between header and items */}
                            <View style={[styles.divider, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#EAEAEA' }]} />

                            {/* Items Preview using product images */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
                                {items.map((cartItem, idx) => {
                                    const itemImg = cartItem.item.image;
                                    const itemImgUri = itemImg 
                                        ? (itemImg.startsWith('http') || itemImg.startsWith('data:') ? itemImg : `${MEDIA_BASE}${itemImg}`) 
                                        : undefined;

                                    return itemImgUri ? (
                                        <Image 
                                            key={idx} 
                                            source={{ uri: itemImgUri }} 
                                            style={[styles.itemThumb, { backgroundColor: c.background }]} 
                                        />
                                    ) : (
                                        /* Fallback for missing product image */
                                        <View key={idx} style={[styles.itemThumb, { backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }]}>
                                            <Ionicons name="fast-food-outline" size={24} color={c.textMuted} />
                                        </View>
                                    );
                                })}
                            </ScrollView>

                            <Text style={[styles.subtotal, { color: c.text }]}>Item subtotal: {subtotal.toFixed(2)} ₪</Text>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity 
                                    style={[styles.btn, styles.secondaryBtn, { backgroundColor: c.background }]}
                                    onPress={() => router.push(`/restaurant/${restaurantId}`)}
                                >
                                    <Text style={{ color: c.text, fontWeight: '600' }}>Add items</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.btn, styles.primaryBtn, { backgroundColor: c.accent }]}
                                    onPress={() => router.push({ pathname: '/cart', params: { restaurantId } })}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>View order</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    list: { padding: Spacing[4] },
    card: { 
        padding: Spacing[4], 
        borderRadius: 16, 
        borderWidth: 1, 
        marginBottom: Spacing[4] 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: Spacing[3] 
    },
    emptyListContent: { 
        flexGrow: 1, 
        justifyContent: 'center' 
    },
    emptyContainer: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: Spacing[6], 
        marginTop: -50 
    },
    emptyIconCircle: { 
        width: 120, 
        height: 120, 
        borderRadius: 60, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: Spacing[4] 
    },
    emptyTitle: { 
        fontSize: Typography.h3, 
        fontWeight: '800', 
        textAlign: 'center', 
        marginBottom: Spacing[2] 
    },
    emptySub: { 
        fontSize: Typography.base, 
        textAlign: 'center', 
        lineHeight: 22 
    },
    restInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: Spacing[3] 
    },
    avatar: { 
        width: 40, 
        height: 40, 
        borderRadius: 8 
    },
    name: { 
        fontSize: Typography.base, 
        fontWeight: '800' 
    },
    divider: {
        borderBottomWidth: 2,
        borderStyle: 'dashed',
        marginBottom: Spacing[3],
    },
    itemsScroll: { 
        flexDirection: 'row', 
        marginBottom: Spacing[3] 
    },
    itemThumb: { 
        width: 60, 
        height: 60, 
        borderRadius: 8, 
        marginRight: Spacing[2] 
    },
    subtotal: { 
        fontWeight: '700', 
        marginBottom: Spacing[3] 
    },
    actions: { 
        flexDirection: 'row',
        gap: Spacing[3] 
    },
    btn: { 
        flex: 1, 
        paddingVertical: 12, 
        borderRadius: 8, 
        alignItems: 'center' 
    },
    secondaryBtn: { 
        borderWidth: 1, 
        borderColor: '#eee' 
    },
    primaryBtn: { }
});