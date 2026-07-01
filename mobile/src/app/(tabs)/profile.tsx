import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    ScrollView,
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    View,
    Pressable,
    Alert,
    Platform
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { getGuestLocation } from '../../services/authStorage';
import { deleteUser } from '../../services/api';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { HeaderBackButton } from '@/components/HeaderBackButton';

export default function ProfileScreen() {
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const { token, user, logout } = useContext(AuthContext);
    const [guestLoc, setGuestLoc] = useState<{lat: number, lng: number} | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const c = isDark ? Colors.dark : Colors.light;

    const dynamicStyles = {
    containerBg: c.background,
    textColor: c.text,
    inputBg: c.surface,
    inputBorder: c.border,
    buttonBg: c.accent,
    errorColor: c.danger,
    placeholder: c.textMuted,
    hintText: c.textMuted,
    surfaceBg: c.surface, 
  };

    // Fetch guest location on mount/focus if not authenticated.
    useFocusEffect(
        useCallback(() => {
            if (!token) {
                getGuestLocation().then(loc => {
                    if (loc) setGuestLoc(loc);
                });
            }
        }, [token])
    );

    const handleLogout = async () => {
        if (logout) {
            await logout();
        }
        // Redirect to login modal after logging out
        router.replace('/login');
    };

    // Function to handle user deletion with a confirmation alert
    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        if (!user || !token) return;
                        
                        try {
                            setIsDeleting(true);
                            // Call the API to delete the user
                            await deleteUser(user.id, token);
                            
                            // Log the user out of the app locally
                            if (logout) await logout();
                            
                            // Redirect to login screen
                            router.replace('/login');
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Could not delete account.");
                            setIsDeleting(false);
                        }
                    } 
                }
            ]
        );
    };

    // If there is no token/user, they are browsing as a guest.
    if (!token || !user) {
        return (
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Stack.Screen 
                    options={{
                        headerShown: true, 
                        title: 'Profile',
                        headerStyle: { backgroundColor: c.background },
                        headerShadowVisible: false,
                        headerTintColor: c.text,
                        headerLeft: () => <HeaderBackButton />,
                        headerRight: () => <ThemeToggleButton/>
                    }}
                />
            
                <ScrollView
                    contentContainerStyle={[styles.centered, { backgroundColor: c.background }]}
                    style={{ backgroundColor: c.background }}
                >
                    <Ionicons name="person-circle-outline" size={72} color={c.textMuted} />
                    <Text style={[styles.title, { color: c.text }]}>Guest Profile</Text>

                    {guestLoc && (
                        <View style={[styles.guestLocBadge, { backgroundColor: c.surface, borderColor: c.border }]}>
                            <Ionicons name="location-outline" size={20} color={c.accent} />
                            <Text style={[styles.guestLocText, { color: c.text }]}>
                                Location: {guestLoc.lat.toFixed(2)}, {guestLoc.lng.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.sub, { color: c.textMuted, textAlign: 'center' }]}>
                        Create an account to track your orders and manage your details.
                    </Text>

                    <Pressable
                        style={[styles.btn, { backgroundColor: c.accent }]}
                        onPress={() => router.replace('/login')}
                    >
                        <Text style={styles.btnText}>Log In / Sign Up</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // Authenticated User View.
    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <Stack.Screen 
                options={{
                    headerShown: true, 
                    title: 'Profile',
                    headerStyle: { backgroundColor: c.background },
                    headerShadowVisible: false,
                    headerTintColor: c.text,
                    headerLeft: () => <HeaderBackButton />,
                    headerRight: () => <ThemeToggleButton />,
                }}
            />
            <ScrollView
                style={{ backgroundColor: c.background }}
                contentContainerStyle={styles.loggedIn}
            >
                {/* Added Avatar display */}
                <View style={[styles.avatarContainer, { borderColor: c.border }]}>
                    {user.profilePicture ? (
                        <Image 
                            source={{ uri: user.profilePicture }} 
                            style={styles.avatar} 
                            contentFit="cover"
                            cachePolicy="none" 
                        />
                    ) : (
                        <Ionicons name="person-circle" size={80} color={c.accent} />
                    )}
                </View>

                <Text style={[styles.title, { color: c.text }]}>{user.displayName}</Text>
                <Text style={[styles.sub, { color: c.textMuted }]}>@{user.username}</Text>

                {/* Admin/Owner Badge */}
                {user.role === 'admin' && (
                    <View style={[styles.roleBadge, { backgroundColor: c.accent + '25' }]}>
                        <Text style={[styles.roleText, { color: c.accent }]}>Restaurant Owner</Text>
                    </View>
                )}

                {/* Admin/Owner Specific Menu */}
                {user.role === 'admin' && (
                    <Pressable
                        style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.border }]}
                        onPress={() => router.push('/owner')}
                    >
                        <Ionicons name="storefront-outline" size={22} color={c.accent} />
                        <Text style={[styles.menuLabel, { color: c.text }]}>My Restaurants</Text>
                        <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                    </Pressable>
                )}

                {/* General Menus */}
                <Pressable 
                    style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.border }]}
                    onPress={() => router.push('/order-history')}
                >
                    <Ionicons name="receipt-outline" size={22} color={c.text} />
                    <Text style={[styles.menuLabel, { color: c.text }]}>Order History</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                </Pressable>

                {/* Edit Profile Button */}
                <Pressable 
                    style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.border }]}
                    onPress={() => router.push('/edit-profile')}
                >
                    <Ionicons name="person-outline" size={22} color={c.text} />
                    <Text style={[styles.menuLabel, { color: c.text }]}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                </Pressable>

                {/* Logout Button */}
                <Pressable
                    style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.border, marginTop: Spacing[4] }]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={22} color={c.danger} />
                    <Text style={[styles.menuLabel, { color: c.danger }]}>Log out</Text>
                </Pressable>

                {/* Delete Account Button */}
                <Pressable
                    style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.danger, marginTop: Spacing[2] }]}
                    onPress={handleDeleteAccount}
                    disabled={isDeleting}
                >
                    <Ionicons name="trash-outline" size={22} color={c.danger} />
                    <Text style={[styles.menuLabel, { color: c.danger }]}>
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    centered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[5], paddingBottom: 120 },
    loggedIn: { alignItems: 'center', padding: Spacing[5], paddingTop: 60, paddingBottom: 120 },
    
    // Avatar specific styles
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing[3],
        borderWidth: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    
    title: { fontSize: Typography.h2, fontWeight: '900', marginTop: Spacing[4], marginBottom: Spacing[1] },
    sub: { fontSize: Typography.base, marginBottom: Spacing[5] },

    guestLocBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[4],
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing[4],
        gap: Spacing[2]
    },
    guestLocText: {
        fontSize: Typography.sm,
        fontWeight: '600'
    },
    
    btn: {
        width: '100%',
        paddingVertical: Spacing[4],
        borderRadius: 12,
        alignItems: 'center',
        marginTop: Spacing[2],
    },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: Typography.base },
    roleBadge: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[1], borderRadius: 999, marginBottom: Spacing[5] },
    roleText: { fontWeight: '700', fontSize: Typography.sm },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: Spacing[4],
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing[3],
        gap: Spacing[3],
    },
    menuLabel: { flex: 1, fontSize: Typography.base, fontWeight: '600' },
});