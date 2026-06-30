import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ThemeToggleButton } from '../../components/ThemeToggleButton';

const WOLT_BLUE = '#009DE0';
const WOLT_BLUE_DARK_FG = '#004F80'; // darker blue for search text/icon in dark mode
const WOLT_BLUE_LIGHT = '#5BC4E8';   // solid light blue for icon pills

// ── Floating tab bar — rendered as absolute sibling to <Tabs>, no RN wrapper ─

function FloatingTabBar() {
    const { isDark } = useContext(ThemeContext);
    const insets = useSafeAreaInsets();
    const pathname = usePathname();

    const tabs = [
        { name: 'index',   href: '/',        iconOff: 'home-outline' as const,   iconOn: 'home' as const },
        { name: 'search',  href: '/search',   iconOff: 'search' as const,         iconOn: 'search' as const,  isSearch: true },
        { name: 'profile', href: '/profile',  iconOff: 'person-outline' as const, iconOn: 'person' as const },
    ];

    return (
        <View
            pointerEvents="box-none"
            style={[
                tabStyles.bar,
                { paddingBottom: Math.max(insets.bottom, 10) + 4 },
            ]}
        >
            {tabs.map(tab => {
                const focused = pathname === tab.href || (tab.href === '/' && pathname === '/index');
                const isSearch = Boolean(tab.isSearch);

                // Light: search = Wolt blue bg + white;        icon pills = light blue + white
                // Dark:  search = white bg + dark navy text;   icon pills = light blue + dark navy
                const bg  = isSearch ? (isDark ? '#ffffff' : WOLT_BLUE) : WOLT_BLUE_LIGHT;
                const fg  = isSearch
                    ? (isDark ? WOLT_BLUE_DARK_FG : '#ffffff')
                    : (isDark ? WOLT_BLUE_DARK_FG : '#ffffff');
                const icon = focused ? tab.iconOn : tab.iconOff;

                return (
                    <Pressable
                        key={tab.name}
                        onPress={() => router.navigate(tab.href as any)}
                        style={[
                            tabStyles.pill,
                            isSearch && tabStyles.pillWide,
                            { backgroundColor: bg },
                        ]}
                    >
                        <Ionicons name={icon} size={isSearch ? 18 : 20} color={fg} />
                        {isSearch && (
                            <Text style={[tabStyles.pillText, { color: fg }]}>Search</Text>
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
}

const tabStyles = StyleSheet.create({
    // Absolutely positioned at the bottom of the outer View wrapper — no RN background
    bar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 10,
    },
    pill: {
        width: 52,
        height: 52,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillWide: {
        flex: 1,
        width: undefined,
        flexDirection: 'row',
        height: 52,
        gap: 8,
    },
    pillText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
});

// ── Tab layout ─────────────────────────────────────────────────────────────

export default function TabLayout() {
    const { isDark } = useContext(ThemeContext);
    const currentColors = isDark ? Colors.dark : Colors.light;

    return (
        // Outer View is the positioning root for FloatingTabBar
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerStyle: { backgroundColor: currentColors.surface },
                    headerTintColor: currentColors.text,
                    headerShadowVisible: false,
                    // Kill the native tab bar entirely — our FloatingTabBar handles it
                    tabBarStyle: { display: 'none' },
                    headerRight: () => <ThemeToggleButton />,
                }}
            >
                <Tabs.Screen name="index"   options={{ title: 'Home',       headerShown: false }} />
                <Tabs.Screen name="search"  options={{ title: 'Search',     headerShown: false }} />
                <Tabs.Screen name="profile" options={{ title: 'My Profile'               }} />
            </Tabs>

            {/* Floats above Tabs content, no wrapper background */}
            <FloatingTabBar />
        </View>
    );
}
