import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useContext } from 'react';
import { ThemeProviderWrapper, ThemeContext } from '../context/ThemeContext';
import { AuthProviderWrapper } from '../context/AuthContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

function RootLayoutNav() {
    const { isDark } = useContext(ThemeContext);

    return (
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="restaurant/[id]"
                    options={{ title: '', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                    name="owner/index"
                    options={{ title: 'My Restaurants' }}
                />
                <Stack.Screen
                    name="owner/new-restaurant"
                    options={{ title: 'New Restaurant' }}
                />
            </Stack>
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProviderWrapper>
            <ThemeProviderWrapper>
                <RootLayoutNav />
            </ThemeProviderWrapper>
        </AuthProviderWrapper>
    );
}
