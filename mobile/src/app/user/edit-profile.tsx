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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { updateUser } from '../../services/api';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

export default function EditProfileScreen() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, token, login } = useContext(AuthContext);
  const router = useRouter();

  const c = isDark ? Colors.dark : Colors.light;

  // Initialize states with current user data
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [base64Data, setBase64Data] = useState(''); 
  
  // Optional password update
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Role and Location
  const [role, setRole] = useState(user?.role || 'customer'); 
  const [lat, setLat] = useState(user?.location?.lat?.toString() || '');
  const [lng, setLng] = useState(user?.location?.lng?.toString() || '');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to open device gallery and get Base64
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

  const handleSave = async () => {
    setErrorMsg('');

    // Validation
    if (!displayName.trim() || !lat || !lng) {
      setErrorMsg('Display name and location are required.');
      return;
    }

    // Validate password only if the user is trying to change it
    if (password) {
        if (password.length < 8) {
            setErrorMsg('New password must be at least 8 characters long.');
            return;
        }
        
        const hasLetters = /[a-zA-Z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        if (!hasLetters || !hasNumbers) {
            setErrorMsg('New password must contain both letters and numbers.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }
    }

    // Validate location coordinates
    const numericLat = parseFloat(lat);
    const numericLng = parseFloat(lng);

    if (isNaN(numericLat) || isNaN(numericLng)) {
      setErrorMsg('Latitude and Longitude must be valid numbers.');
      return;
    }

    if (!user || !token) {
      setErrorMsg('Authentication error. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the payload to send to the server
      const updatePayload: any = {
          displayName,
          role: role as 'customer' | 'admin',
          location: { lat: numericLat, lng: numericLng }
      };

      // Only include password if a new one was provided
      if (password) {
          updatePayload.password = password;
      }

      // Handle profile picture format
      if (base64Data) {
         updatePayload.profilePicture = `data:image/jpeg;base64,${base64Data}`;
      } else if (profilePicture) {
         updatePayload.profilePicture = profilePicture;
      }

      // Safe ID extraction
      const userId = user.id || user._id;
      if (!userId) {
          setErrorMsg('User ID is missing.');
          setIsLoading(false);
          return;
      }

      // Capture both the new token and user object
      const response = await updateUser(userId, updatePayload, token);

      // Update the local AuthContext with the NEW token and NEW user data
      if (login) {
          await login(response.token, response.user);
      }

      // Go back to the profile screen upon success
      router.back();
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <Stack.Screen 
        options={{ 
            headerShown: true,
            title: 'Edit Profile',
            headerStyle: { backgroundColor: c.background },
            headerShadowVisible: false,
            headerTintColor: c.text,
            headerBackTitle: 'Profile',
            headerRight: () => <ThemeToggleButton/>
        }} 
      />

      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.background }]}>
        
        {/* --- Avatar Editor --- */}
        <View style={styles.avatarSection}>
            <TouchableOpacity 
                style={[styles.avatarContainer, { borderColor: c.border }]} 
                onPress={pickImage}
            >
                {profilePicture ? (
                    <Image source={{ uri: profilePicture }} style={styles.avatar} contentFit="cover" />
                ) : (
                    <Ionicons name="camera-outline" size={40} color={c.textMuted} />
                )}
                
                <View style={[styles.editIconBadge, { backgroundColor: c.accent }]}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                </View>
            </TouchableOpacity>
            <Text style={[styles.hint, { color: c.textMuted, marginTop: 8 }]}>Tap to change photo</Text>
        </View>

        {/* --- Display Name Input --- */}
        <View style={styles.inputSection}>
            <Text style={[styles.label, { color: c.text }]}>Display Name</Text>
            <TextInput
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                placeholder="Enter your name"
                placeholderTextColor={c.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
            />
        </View>

        {/* --- Password Inputs (Optional) --- */}
        <View style={styles.inputSection}>
            <Text style={[styles.label, { color: c.text }]}>New Password (Optional)</Text>
            <View style={[styles.passwordWrapper, { backgroundColor: c.surface, borderColor: c.border }]}>
                <TextInput
                    style={[styles.passwordInput, { color: c.text }]}
                    placeholder="Leave blank to keep current"
                    placeholderTextColor={c.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={c.textMuted} />
                </TouchableOpacity>
            </View>
            
            {password.length > 0 && (
                <View style={{ marginTop: Spacing[3] }}>
                    <Text style={[styles.label, { color: c.text }]}>Confirm New Password</Text>
                    <View style={[styles.passwordWrapper, { backgroundColor: c.surface, borderColor: c.border }]}>
                        <TextInput
                            style={[styles.passwordInput, { color: c.text }]}
                            placeholder="Re-type new password"
                            placeholderTextColor={c.textMuted}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color={c.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>

        {/* --- Role Selection --- */}
        <View style={styles.inputSection}>
            <Text style={[styles.label, { color: c.text }]}>Account Type</Text>
            <View style={[styles.roleContainer, { backgroundColor: isDark ? c.surface : '#E5E5EA', borderColor: c.border, borderWidth: 1 }]}>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'customer' && { backgroundColor: isDark ? c.background : '#FFFFFF', shadowColor: '#000', elevation: 2 }]}
                    onPress={() => setRole('customer')}
                >
                    <Text style={[styles.roleText, { color: role === 'customer' ? c.text : c.textMuted }]}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'admin' && { backgroundColor: isDark ? c.background : '#FFFFFF', shadowColor: '#000', elevation: 2 }]}
                    onPress={() => setRole('admin')}
                >
                    <Text style={[styles.roleText, { color: role === 'admin' ? c.text : c.textMuted }]}>Admin</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* --- Location Block --- */}
        <View style={[styles.row, styles.inputSection]}>
          <View style={styles.halfInputContainer}>
            <Text style={[styles.label, { color: c.text }]}>Latitude</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              placeholder="32.08"
              placeholderTextColor={c.textMuted}
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInputContainer}>
            <Text style={[styles.label, { color: c.text }]}>Longitude</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              placeholder="34.78"
              placeholderTextColor={c.textMuted}
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
            />
          </View>
        </View>

        {errorMsg ? <Text style={[styles.errorText, { color: c.danger }]}>{errorMsg}</Text> : null}

        <View style={{ flex: 1 }} />

        {/* --- Action Buttons --- */}
        <View style={styles.actions}>
            <TouchableOpacity 
                style={[styles.cancelBtn, { borderColor: c.border }]} 
                onPress={() => router.back()}
                disabled={isLoading}
            >
                <Text style={[styles.cancelBtnText, { color: c.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: c.accent }]} 
                onPress={handleSave}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                )}
            </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing[5],
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing[5],
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff', 
  },
  inputSection: {
      marginBottom: Spacing[4],
  },
  label: { 
    fontSize: Typography.sm, 
    fontWeight: '600', 
    marginBottom: Spacing[2] 
  },
  input: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: Typography.base,
  },
  hint: { 
    fontSize: Typography.xs, 
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInputContainer: {
    width: '48%',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: Typography.base,
  },
  roleContainer: { 
    flexDirection: 'row', 
    borderRadius: 30, 
    padding: 4, 
  },
  roleButton: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 26, 
    alignItems: 'center' 
  },
  roleText: { 
    fontWeight: 'bold', 
    fontSize: Typography.sm 
  },
  errorText: {
    marginTop: Spacing[2],
    textAlign: 'center',
    fontWeight: '600'
  },
  actions: {
      flexDirection: 'row',
      gap: Spacing[3],
      marginTop: Spacing[6],
      paddingBottom: Spacing[6],
  },
  cancelBtn: {
      flex: 1,
      paddingVertical: Spacing[4],
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
  },
  cancelBtnText: {
      fontSize: Typography.base,
      fontWeight: '600',
  },
  saveBtn: {
      flex: 2,
      paddingVertical: Spacing[4],
      borderRadius: 12,
      alignItems: 'center',
  },
  saveBtnText: {
      color: '#FFF',
      fontSize: Typography.base,
      fontWeight: 'bold',
  },
});