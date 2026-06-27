import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const currentColors = isDark ? Colors.dark : Colors.light;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: currentColors.accent,
                tabBarInactiveTintColor: currentColors.textMuted,
                tabBarStyle: {
                    backgroundColor: currentColors.background,
                    borderTopColor: currentColors.border,
                },
                headerStyle: { backgroundColor: currentColors.surface },
                headerTintColor: currentColors.text,
                headerRight: () => (
                    <Pressable onPress={toggleTheme} style={{ marginRight: 15 }}>
                        <Ionicons
                            name={isDark ? 'sunny' : 'moon'}
                            size={24}
                            color={currentColors.text}
                        />
                    </Pressable>
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Wolt Clone',
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'restaurant' : 'restaurant-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarLabel: 'Search',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'search' : 'search-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'My Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'person' : 'person-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
