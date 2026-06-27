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
        
        // This dynamically changes the background of the bottom bar
        tabBarStyle: {
          backgroundColor: currentColors.background,
          borderTopColor: currentColors.border,
        },
        
        // This dynamically changes the background of the top header
        headerStyle: {
          backgroundColor: currentColors.surface,
        },
        
        // This changes the text color in the top header
        headerTintColor: currentColors.text,

        // This adds our global toggle button to the top right of EVERY tab's header
        headerRight: () => (
          <Pressable onPress={toggleTheme} style={{ marginRight: 15 }}>
            <Ionicons 
              name={isDark ? "sunny" : "moon"} 
              size={24} 
              color={currentColors.text} 
            />
          </Pressable>
        )
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Wolt Clone',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "restaurant" : "restaurant-outline"} 
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
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}