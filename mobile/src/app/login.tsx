import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Pressable     // Added Pressable to match the home screen's button style
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/theme'; 

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const router = useRouter();

  const themeColors = isDark ? Colors.dark : Colors.light;

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
    setErrorMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Both username and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      await login(data.token, data.user);
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
              headerTintColor: dynamicStyles.textColor,
              headerRight: () => (
                  // Replaced text emojis with the exact Pressable and Ionicons styling from index.tsx
                  <Pressable
                      onPress={toggleTheme}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)'
                      }}
                  >
                      <Ionicons 
                        name={isDark ? 'sunny-outline' : 'moon-outline'} 
                        size={18} 
                        color={isDark ? '#fff' : '#1c1d2a'} 
                      />
                  </Pressable>
              ),
            }} 
        />

        <Text style={[styles.title, { color: dynamicStyles.textColor }]}>Welcome Back!</Text>

        {/* Username Block */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Username</Text>
        <TextInput
            style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
            placeholder="your_username"
            placeholderTextColor={dynamicStyles.placeholder}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
        />
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>3–20 characters · letters, numbers, underscores</Text>

        {/* Password Block */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Password</Text>
        <TextInput
            style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
            placeholder="••••••••"
            placeholderTextColor={dynamicStyles.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>At least 8 characters · mix of letters and numbers</Text>

      {errorMsg ? <Text style={[styles.errorText, { color: dynamicStyles.errorColor }]}>{errorMsg}</Text> : null}

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

      {/* Added "Continue as guest" button */}
      <TouchableOpacity 
        style={[styles.guestButton, { borderColor: dynamicStyles.buttonBg }]} 
        onPress={() => router.push('/guest-location-input')}>
            <Text style={[styles.guestButtonText, { color: dynamicStyles.buttonBg }]}>Continue as a guest</Text>
      </TouchableOpacity>

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
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 40, 
    textAlign: 'center' 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  input: { 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 4, 
    borderWidth: 1, 
    fontSize: 16 
  },
  hint: { 
    fontSize: 12, 
    marginBottom: 20 
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
  guestButton: { 
    padding: 16, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginTop: 15,
    borderWidth: 1 
  },
  guestButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
}
});