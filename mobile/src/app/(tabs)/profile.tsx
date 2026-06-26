import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    // The main wrapper view for the Profile screen layout
    <View style={styles.container}>
      {/* Placeholder text for the user's personal details and settings */}
      <Text style={styles.text}>My Profile</Text>
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
    fontSize: 20, 
    fontWeight: 'bold' 
  }
});