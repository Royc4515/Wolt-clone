export const Colors = {
  light: {
    background: '#ffffff',
    surface: '#ffffff',
    text: '#1c1d2a',
    textMuted: '#6a6760',
    accent: '#00C2E8',
    border: 'rgba(30, 26, 20, 0.10)',
    danger: '#e5484d',
    success: '#1fab6d',
  },
  dark: {
    background: '#0A0C17',
    surface: '#13152a',
    text: '#ffffff',
    textMuted: '#b8b8d0',
    accent: '#00C2E8',
    border: 'rgba(255, 255, 255, 0.09)',
    danger: '#e5484d',
    success: '#1fab6d',
  },
};

export type ThemeColor = keyof typeof Colors.light;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
};

export const Typography = {
  xs: 13,
  sm: 14,
  base: 16,
  lg: 18,
  h3: 22,
  h2: 28,
  h1: 36,
};

export const Fonts = {
  // Fallback to system sans-serif until custom fonts (like Manrope) are loaded
  sans: 'System', 
  // Fallback to system monospace font
  mono: 'monospace', 
};