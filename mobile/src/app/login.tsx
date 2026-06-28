import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/theme'; 

export default function LoginScreen() {
  // Local state for form inputs and UI feedback
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Consume contexts for authentication and theme
  const { login } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
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
    hintText: themeColors.textMuted,
  };

  const handleLogin = async () => {
    // 1. Client-side validation: Clear previous errors and check for empty fields
    setErrorMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Both username and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. API Call to the Node.js backend
      const response = await fetch('http://localhost:3000/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // 3. Handle server errors (e.g., wrong password, user not found)
      if (!response.ok) {
        setErrorMsg(data.error || 'Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // 4. Success! Save the token to local storage and update global state
      await login(data.token);
      
      // 5. Navigate the user to the main app layout
      router.replace('/(tabs)');
      
    } catch (error) {
      setErrorMsg('Network error. Check your connection to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: dynamicStyles.containerBg }]}>
        <Stack.Screen 
            options={{ 
            title: '', 
            headerStyle: { backgroundColor: dynamicStyles.containerBg },
            headerShadowVisible: false,
            headerTintColor: dynamicStyles.textColor
            }} 
        />

        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
            <Text style={{ fontSize: 24 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: dynamicStyles.textColor }]}>Welcome Back!</Text>

        {/* Username Input */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Username</Text>
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>3–20 characters · letters, numbers, underscores</Text>
        <TextInput
            style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
            placeholder="your_username"
            placeholderTextColor={dynamicStyles.placeholder}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
        />

        {/* Password Input */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Password</Text>
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>At least 8 characters · mix of letters and numbers</Text>
        <TextInput
            style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
            placeholder="••••••••"
            placeholderTextColor={dynamicStyles.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />

      {/* Error Message Display */}
      {errorMsg ? <Text style={[styles.errorText, { color: dynamicStyles.errorColor }]}>{errorMsg}</Text> : null}

      {/* Login Button / Loading Indicator */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: dynamicStyles.buttonBg }]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      {/* Navigation to Registration Screen */}
      <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkButton}>
        <Text style={[styles.linkText, { color: dynamicStyles.buttonBg }]}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center' 
  },
  themeToggle: { 
    position: 'absolute', 
    top: 50,
    right: 20, 
    zIndex: 10 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 40, 
    textAlign: 'center' 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4 
  },
  hint: { 
    fontSize: 12, 
    marginBottom: 8 
  },
  input: { 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 20, 
    borderWidth: 1, 
    fontSize: 16 
  },
  button: { 
    padding: 16, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  errorText: { 
    marginBottom: 15, 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  linkButton: { 
    marginTop: 24, 
    alignItems: 'center' 
  },
  linkText: { 
    fontSize: 15 
  },
});