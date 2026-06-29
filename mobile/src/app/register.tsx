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
  Platform,
  Pressable
} from 'react-native';
import { useRouter, Stack } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import { register as apiRegister } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [base64Data, setBase64Data] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [role, setRole] = useState('customer'); 
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    surfaceBg: themeColors.surface, 
  };

  // Function to open device gallery.
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);

      if (result.assets[0].base64) {
          setBase64Data(result.assets[0].base64);
      }
    }
  };

  const handleRegister = async () => {
    setErrorMsg('');

    if (!username || !password || !confirmPassword || !displayName || !profilePicture || !lat || !lng) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);

    if (!hasLetters || !hasNumbers) {
      setErrorMsg('Password must contain both letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
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
      if (profilePicture && !base64Data) {
        throw new Error('Failed to process image. Please try picking it again.');
      }

      const response = await apiRegister({
        username,
        password,
        displayName,
        profilePicture: base64Data ? `data:image/jpeg;base64,${base64Data}` : '',
        location: { lat: numericLat, lng: numericLng },
        role: role as 'customer' | 'admin'
      });

      router.replace('/login');
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{ 
          title: '', 
          headerStyle: { backgroundColor: dynamicStyles.containerBg },
          headerShadowVisible: false,
          headerTintColor: dynamicStyles.textColor,
          headerRight: () => (
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

      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: dynamicStyles.containerBg }]}>
        <Text style={[styles.title, { color: dynamicStyles.textColor }]}>Create Account</Text>

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
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>At least 3 characters · letters, numbers, underscores</Text>

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

        {/* Confirm Password Block */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Confirm Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
          placeholder="••••••••"
          placeholderTextColor={dynamicStyles.placeholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>Must match your password</Text>

        {/* Display Name Block */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Display Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
          placeholder="Display Name"
          placeholderTextColor={dynamicStyles.placeholder}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>Your public name shown to other users</Text>

        {/* Profile Picture Image Picker Block */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Profile Picture</Text>
        <TouchableOpacity 
            style={[styles.imagePickerBtn, { borderColor: dynamicStyles.inputBorder, backgroundColor: dynamicStyles.inputBg }]} 
            onPress={pickImage}
        >
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={dynamicStyles.placeholder} />
              <Text style={{ color: dynamicStyles.placeholder, marginTop: 8 }}>Upload Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>JPG, PNG or GIF · shown next to your orders</Text>

        {/* Location Block */}
        <View style={styles.row}>
          <View style={styles.halfInputContainer}>
            <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Latitude</Text>
            <TextInput
              style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
              placeholder="32.08"
              placeholderTextColor={dynamicStyles.placeholder}
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>-90 to 90</Text>
          </View>
          <View style={styles.halfInputContainer}>
            <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Longitude</Text>
            <TextInput
              style={[styles.input, { backgroundColor: dynamicStyles.inputBg, borderColor: dynamicStyles.inputBorder, color: dynamicStyles.textColor }]}
              placeholder="34.78"
              placeholderTextColor={dynamicStyles.placeholder}
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>-180 to 180</Text>
          </View>
        </View>

        {/* Role Selection Segmented Control */}
        <Text style={[styles.label, { color: dynamicStyles.textColor }]}>Account type</Text>
        <View style={[styles.roleContainer, { backgroundColor: dynamicStyles.surfaceBg }]}>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'customer' && { backgroundColor: dynamicStyles.containerBg, shadowColor: '#000', elevation: 2 }]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleText, { color: role === 'customer' ? dynamicStyles.textColor : dynamicStyles.hintText }]}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'admin' && { backgroundColor: dynamicStyles.containerBg, shadowColor: '#000', elevation: 2 }]}
            onPress={() => setRole('admin')}
          >
            <Text style={[styles.roleText, { color: role === 'admin' ? dynamicStyles.textColor : dynamicStyles.hintText }]}>Admin</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hint, { color: dynamicStyles.hintText }]}>Admins can manage restaurants and menus</Text>

        {errorMsg ? <Text style={[styles.errorText, { color: dynamicStyles.errorColor }]}>{errorMsg}</Text> : null}

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
    padding: 24,
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  input: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    fontSize: 16,
  },
  imagePickerBtn: {
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden'
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  hint: { 
    fontSize: 12, 
    marginBottom: 20 
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInputContainer: {
    width: '48%',
  },
  roleContainer: { 
    flexDirection: 'row', 
    borderRadius: 30, 
    padding: 4, 
    marginBottom: 4 
  },
  roleButton: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 26, 
    alignItems: 'center' 
  },
  roleText: { 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  button: {
    padding: 16,
    borderRadius: 30,
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
    fontWeight: '600'
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  linkText: {
    fontSize: 15,
  },
});