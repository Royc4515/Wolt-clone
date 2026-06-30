import React, { useContext, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import { Colors, Spacing, Typography } from '../constants/theme';
import { Image } from 'expo-image';
import { getRestaurant, MEDIA_BASE, type Restaurant } from '../services/api';

export default function CartOverviewScreen() {
    const { carts } = useContext(CartContext);
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const c = isDark ? Colors.dark : Colors.light;
    const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});

    const dynamicStyles = {
        containerBg: c.background,
        textColor: c.text,
        buttonBg: c.accent,
        errorColor: c.danger,
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
                headerBackTitle: 'Back'
                }}
            />
            <FlatList
                data={Object.entries(carts)}
                keyExtractor={([rid]) => rid}
                contentContainerStyle={styles.list}
                renderItem={({ item: [restaurantId, items] }) => {
                    const rest = restaurants[restaurantId];
                    const subtotal = items.reduce((s, i) => s + (i.item.price * i.qty), 0);

                    return (
                        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                            {/* Header: Restaurant Image + Name */}
                            <View style={styles.header}>
                                <View style={styles.restInfo}>
                                    {/* Checking image existence */}
                                    {rest?.image ? (
                                        <Image 
                                            source={{ uri: `${MEDIA_BASE}${rest.image}` }}
                                            style={styles.avatar} 
                                        />
                                    ) : (
                                        /* Present generic Avatar if there's no image*/
                                        <View style={[styles.avatar, { backgroundColor: c.border }]} />
                                    )}
                                    <View>
                                        <Text style={[styles.name, { color: c.text }]}>{rest?.name || "Loading..."}</Text>
                                    </View>
                                </View>
                                <Ionicons name="ellipsis-horizontal" size={20} color={c.text} />
                            </View>

                            {/* Items Preview - Now using actual product images */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
                                {items.map((cartItem, idx) => {
                                    const imgUri = cartItem.item.image 
                                        ? `${MEDIA_BASE}${cartItem.item.image}` 
                                        : undefined;
                                    return (
                                        <Image 
                                            key={idx} 
                                            source={imgUri ? { uri: imgUri } : undefined} 
                                            style={[styles.itemThumb, { backgroundColor: c.background }]} 
                                        />
                                    );
                                })}
                            </ScrollView>

                            <Text style={[styles.subtotal, { color: c.text }]}>Item subtotal: {subtotal.toFixed(2)} ₪</Text>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.btn, styles.secondaryBtn, { backgroundColor: c.background }]}>
                                    <Text style={{ color: c.text, fontWeight: '600' }}>Add items</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.btn, styles.primaryBtn, { backgroundColor: c.accent }]}
                                    onPress={() => router.push({ pathname: '/cart', params: { restaurantId } })}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>View cart</Text>
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
    card: { padding: Spacing[4], borderRadius: 16, borderWidth: 1, marginBottom: Spacing[4] },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[3] },
    restInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
    avatar: { width: 40, height: 40, borderRadius: 8 },
    name: { fontSize: Typography.base, fontWeight: '800' },
    itemsScroll: { flexDirection: 'row', marginBottom: Spacing[3] },
    itemThumb: { width: 60, height: 60, borderRadius: 8, marginRight: Spacing[2] },
    subtotal: { fontWeight: '700', marginBottom: Spacing[3] },
    actions: { flexDirection: 'row', gap: Spacing[3] },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    secondaryBtn: { borderWidth: 1, borderColor: '#eee' },
    primaryBtn: { }
});