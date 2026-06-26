import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    // The main wrapper view for the Home screen layout
    <View style={styles.container}>
      {/* Placeholder text where the restaurants feed will be displayed */}
      <Text style={styles.text}>Restaurants Home Screen</Text>
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