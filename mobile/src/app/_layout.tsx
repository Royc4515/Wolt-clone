import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useContext, useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getGuestLocation } from '@/services/authStorage';
import { Colors } from '../constants/theme';
import { ThemeToggleButton } from '../components/ThemeToggleButton';

// Import our custom context wrappers.
import { ThemeProviderWrapper, ThemeContext } from '../context/ThemeContext';
import { AuthProvider, AuthContext } from '../context/AuthContext'; // Using the merged AuthProvider name
import { CartProvider } from '../context/CartContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon'; 

// Inner component to consume the context and apply the theme.
function RootLayoutNav() {
    const { isDark } = useContext(ThemeContext);
    const { token, isLoading } = useContext(AuthContext);
    const c = isDark ? Colors.dark : Colors.light;
    const ownerHeaderOpts = {
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerShadowVisible: false,
        headerRight: () => <ThemeToggleButton />,
    };
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
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="guest-location-input" options={{ title: 'Set Location' }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="promoted"
                    options={{ title: 'Promoted', ...ownerHeaderOpts }}
                />
                <Stack.Screen
                    name="restaurant/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="owner/index"
                    options={{ title: 'My Restaurants', ...ownerHeaderOpts }}
                />
                <Stack.Screen
                    name="owner/new-restaurant"
                    options={{ title: 'New Restaurant', ...ownerHeaderOpts }}
                />
                <Stack.Screen
                    name="owner/edit-restaurant/[id]"
                    options={{ title: 'Edit Restaurant', ...ownerHeaderOpts }}
                />
                <Stack.Screen
                    name="owner/[rid]/dishes/index"
                    options={{ title: 'Dishes', ...ownerHeaderOpts }}
                />
                <Stack.Screen
                    name="owner/[rid]/dishes/new"
                    options={{ title: 'New Dish', ...ownerHeaderOpts }}
                />
                <Stack.Screen
                    name="owner/[rid]/dishes/[pid]/edit"
                    options={{ title: 'Edit Dish', ...ownerHeaderOpts }}
                />
            </Stack>
        </ThemeProvider>
    );
}

// The main export wraps everything in our custom providers.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProviderWrapper>
        <AuthProvider>
          <CartProvider>
            <RootLayoutNav />
          </CartProvider>
        </AuthProvider>
      </ThemeProviderWrapper>
    </GestureHandlerRootView>
  );
}