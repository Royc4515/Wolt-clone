import React, { createContext, useState } from 'react';
import { useColorScheme } from 'react-native';

// Define the shape of our context.
export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  // Initialize state based on system preference.
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  // Function to switch between light and dark modes.
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}