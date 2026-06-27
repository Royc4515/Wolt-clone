import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useContext } from 'react';

// Import our custom context wrapper
import { ThemeProviderWrapper, ThemeContext } from '../context/ThemeContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon'; 

// Inner component to consume the context and apply the theme
function RootLayoutNav() {
  const { isDark } = useContext(ThemeContext);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

// The main export wraps everything in our custom provider
export default function RootLayout() {
  return (
    <ThemeProviderWrapper>
      <RootLayoutNav />
    </ThemeProviderWrapper>
  );
}