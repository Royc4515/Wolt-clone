import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext';
import { Colors, Spacing } from '../constants/theme';
import { getRestaurants, type Restaurant } from '../services/api';
import { RestaurantCard } from './(tabs)/index'; // Re-using from index.tsx

export default function PromotedScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();
    
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRestaurants().then(data => {
            setRestaurants(data.filter(r => r.isPromoted));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
            <Stack.Screen 
                options={{
                    headerShown: true,
                    title: 'Promoted',
                    headerStyle: { backgroundColor: c.surface },
                    headerTintColor: c.text,
                    headerShadowVisible: false,
                }} 
            />
            {loading ? (
                <View style={[styles.centered, { backgroundColor: c.background }]}>
                    <ActivityIndicator size="large" color={c.accent} />
                </View>
            ) : (
                <FlatList
                    data={restaurants}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: Spacing[4], gap: Spacing[4], paddingBottom: insets.bottom + Spacing[4] }}
                    renderItem={({ item }) => (
                        <RestaurantCard 
                            item={item} 
                            onPress={() => router.push(`/restaurant/${item.id}`)} 
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
