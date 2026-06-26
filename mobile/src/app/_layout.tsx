import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';

// Make sure the path matches where your AnimatedSplashOverlay is located
import { AnimatedSplashOverlay } from '@/components/animated-icon'; 

export default function RootLayout() {
  // Hook that detects if the device is currently in dark or light mode
  const colorScheme = useColorScheme();

  return (
    // Wraps the entire application, passing down the correct theme globally
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      
      {/* Renders the custom splash screen overlay */}
      <AnimatedSplashOverlay />
      
      {/* The root navigator that points to our tabs folder */}
      {/* We hide the default header because the tabs will manage their own headers */}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

    </ThemeProvider>
  );
}