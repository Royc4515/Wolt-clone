import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { HeaderBackButton } from '@/components/HeaderBackButton';

export default function GuestLocationInput() {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { isDark } = useContext(ThemeContext);
  const router = useRouter();

  const themeColors = isDark ? Colors.dark : Colors.light;

  const handleContinue = async () => {
    // Validation logic.
    const numericLat = parseFloat(lat);
    const numericLng = parseFloat(lng);

    if (isNaN(numericLat) || isNaN(numericLng)) {
      setErrorMsg('Please enter valid numeric coordinates.');
      return;
    }

    if (numericLat < -90 || numericLat > 90 || numericLng < -180 || numericLng > 180) {
      setErrorMsg('Coordinates out of range. Lat: -90 to 90, Lng: -180 to 180.');
      return;
    }

    // Save location to storage as a stringified object.
    const location = { lat: numericLat, lng: numericLng };
    await AsyncStorage.setItem('guest_location', JSON.stringify(location));
    
    // Navigate to home screen.
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack.Screen options={{ 
        title: 'Set Location',
        headerBackTitle: 'Log In',
        headerRight: () => <ThemeToggleButton/>
      }} />
      
      <Text style={[styles.title, { color: themeColors.text }]}>Where are you?</Text>
      {errorMsg ? <Text style={[styles.errorText, { color: themeColors.danger || 'red' }]}>{errorMsg}</Text> : null}
      <Text style={[styles.label, { color: themeColors.text }]}>Latitude</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }]}
        placeholder="32.08"
        placeholderTextColor={themeColors.textMuted}
        value={lat}
        onChangeText={(val) => { setLat(val); setErrorMsg(''); }}
        keyboardType="numeric"
      />
      <Text style={[styles.hint, { color: themeColors.textMuted }]}>Range: -90 to 90</Text>

      <Text style={[styles.label, { color: themeColors.text }]}>Longitude</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }]}
        placeholder="34.78"
        placeholderTextColor={themeColors.textMuted}
        value={lng}
        onChangeText={(val) => { setLng(val); setErrorMsg(''); }}
        keyboardType="numeric"
      />
      <Text style={[styles.hint, { color: themeColors.textMuted }]}>Range: -180 to 180</Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: themeColors.accent }]} 
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Enter App</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, marginBottom: 5 },
  input: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 20, fontSize: 16 },
  hint: { fontSize: 12, marginBottom: 20 },
  button: { padding: 16, borderRadius: 30, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  errorText: { marginBottom: 15, textAlign: 'center', fontWeight: '600' }
});