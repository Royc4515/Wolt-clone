import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    // The Tabs component creates a bottom navigation bar for the app.
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      
      {/* Configuration for the Home tab. */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // Renders a home icon for this specific tab.
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      
      {/* Configuration for the Profile tab. */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Renders a user profile icon for this specific tab.
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}