import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/theme';

export default function RegisterScreen() {
  // State for all required fields according to the User model
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isDark } = useContext(ThemeContext);
  const router = useRouter();

  // Select the appropriate color palette based on the current theme
  const themeColors = isDark ? Colors.dark : Colors.light;

  // Map the palette to specific UI elements
  const dynamicStyles = {
    containerBg: themeColors.background,
    textColor: themeColors.text,
    inputBg: themeColors.surface,
    inputBorder: themeColors.border,
    buttonBg: themeColors.accent,
    errorColor: themeColors.danger,
    placeholder: themeColors.textMuted,
  };

  const handleRegister = async () => {
    setErrorMsg('');

    // 1. Client-side validations
    if (!username || !password || !displayName || !profilePicture || !lat || !lng) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    const numericLat = parseFloat(lat);
    const numericLng = parseFloat(lng);

    if (isNaN(numericLat) || isNaN(numericLng)) {
      setErrorMsg('Latitude and Longitude must be valid numbers.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. API Call to create user
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          displayName,
          profilePicture,
          location: { lat: numericLat, lng: numericLng },
          role: 'customer' // Default role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Registration failed.');
        setIsLoading(false);
        return;
      }

      // 3. Success! Route the user back to the login screen
      router.replace('/login');
      
    } catch (error) {
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: dynamicStyles.containerBg }]}>
        <Text style={[styles.title, { color: dynamicStyles.textColor }]}>Create Account</Text>

        <TextInput
          style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
          placeholder="Username"
          placeholderTextColor={dynamicStyles.placeholder}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
          placeholder="Password (min 8 chars)"
          placeholderTextColor={dynamicStyles.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
          placeholder="Display Name"
          placeholderTextColor={dynamicStyles.placeholder}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <TextInput
          style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
          placeholder="Profile Picture URL"
          placeholderTextColor={dynamicStyles.placeholder}
          value={profilePicture}
          onChangeText={setProfilePicture}
          autoCapitalize="none"
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
            placeholder="Latitude (e.g. 32.08)"
            placeholderTextColor={dynamicStyles.placeholder}
            value={lat}
            onChangeText={setLat}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
            placeholder="Longitude (e.g. 34.78)"
            placeholderTextColor={dynamicStyles.placeholder}
            value={lng}
            onChangeText={setLng}
            keyboardType="numeric"
          />
        </View>

        {/* Error Message Display */}
        {errorMsg ? <Text style={[styles.errorText, { color: dynamicStyles.errorColor }]}>{errorMsg}</Text> : null}

        {/* Register Button / Loading Indicator */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: dynamicStyles.buttonBg }]} 
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Navigation to Login Screen */}
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkButton}>
          <Text style={[styles.linkText, { color: dynamicStyles.buttonBg }]}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  linkText: {
    fontSize: 16,
  },
});