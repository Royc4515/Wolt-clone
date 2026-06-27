import { View, Text, StyleSheet } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function ProfileScreen() {
    const { isDark } = useContext(ThemeContext);

    // Pick the right color palette based on the current theme
    const currentColors = isDark ? Colors.dark : Colors.light;

  return (
    // Dynamically change background color based on the current theme.
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>

      {/* Dynamically change text color based on the current theme */}
      <Text style={[styles.text, { color: currentColors.text }]}>
        My Profile
      </Text>
      <Text style={{ color: currentColors.textMuted, fontSize: Typography.sm, marginTop: Spacing[2] }}>
        Welcome back!
      </Text>
    </View>
  );
}

// Stylesheet to handle the visual appearance of the components
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  text: { 
    fontSize: Typography.h2, 
    fontWeight: 'bold' 
  }
});