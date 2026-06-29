import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useContext, useState, useEffect } from 'react';
import { getGuestLocation } from '@/services/authStorage';

// Import our custom context wrappers.
import { ThemeProviderWrapper, ThemeContext } from '../context/ThemeContext';
import { AuthProvider, AuthContext } from '../context/AuthContext'; // Using the merged AuthProvider name
import { CartProvider } from '../context/CartContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon'; 

// Inner component to consume the context and apply the theme.
function RootLayoutNav() {
    const { isDark } = useContext(ThemeContext);
    const { token, isLoading } = useContext(AuthContext);
    const [isGuest, setIsGuest] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function checkGuest() {
            const loc = await getGuestLocation(); // Using the utility function
            if (loc) setIsGuest(true);
            setChecking(false);
        }
        checkGuest();
    }, []);

    if (isLoading || checking) return <AnimatedSplashOverlay />;

    return (
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <Stack initialRouteName={(!token && !isGuest) ? "login" : "(tabs)"}>
                <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="register" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="guest-location-input" options={{ presentation: 'modal', title: 'Set Location' }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                
                <Stack.Screen
                    name="restaurant/[id]"
                    options={{ headerShown: false }}
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

// The main export wraps everything in our custom providers.
export default function RootLayout() {
  return (
    <ThemeProviderWrapper>
      <AuthProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </AuthProvider>
    </ThemeProviderWrapper>
  );
}