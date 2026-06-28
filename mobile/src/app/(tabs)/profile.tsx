import { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { login as apiLogin } from '../../services/api';
import { jwtDecode } from '../../utils/jwtDecode';
import type { AuthUser } from '../../services/api';

export default function ProfileScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { token, user, login, logout } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter username and password.');
            return;
        }
        setLoading(true);
        try {
            const { token: newToken } = await apiLogin(username.trim(), password.trim());
            const decoded = jwtDecode<Record<string, unknown>>(newToken);
            if (!decoded.id || !decoded.username || !decoded.displayName || !decoded.role) {
                throw new Error('Malformed token — please contact support');
            }
            login(newToken, {
                id: decoded.id as string,
                username: decoded.username as string,
                displayName: decoded.displayName as string,
                role: decoded.role as AuthUser['role'],
                location: decoded.location as AuthUser['location'],
            });
            setUsername('');
            setPassword('');
        } catch (err: unknown) {
            Alert.alert('Login failed', err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (!token || !user) {
        return (
            <ScrollView
                contentContainerStyle={[styles.centered, { backgroundColor: c.background }]}
                style={{ backgroundColor: c.background }}
            >
                <Ionicons name="person-circle-outline" size={72} color={c.textMuted} />
                <Text style={[styles.title, { color: c.text }]}>Sign in</Text>
                <Text style={[styles.sub, { color: c.textMuted }]}>
                    Log in to manage your restaurants
                </Text>

                <TextInput
                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                    placeholder="Username"
                    placeholderTextColor={c.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                    placeholder="Password"
                    placeholderTextColor={c.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <Pressable
                    style={[styles.btn, { backgroundColor: c.accent }, loading && styles.btnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.btnText}>Log in</Text>
                    }
                </Pressable>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={{ backgroundColor: c.background }}
            contentContainerStyle={styles.loggedIn}
        >
            <Ionicons name="person-circle" size={80} color={c.accent} />
            <Text style={[styles.title, { color: c.text }]}>{user.displayName}</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>@{user.username}</Text>

            {user.role === 'admin' && (
                <View style={[styles.roleBadge, { backgroundColor: c.accent + '25' }]}>
                    <Text style={[styles.roleText, { color: c.accent }]}>Restaurant Owner</Text>
                </View>
            )}

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

            <Pressable
                style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => { logout(); }}
            >
                <Ionicons name="log-out-outline" size={22} color={c.danger} />
                <Text style={[styles.menuLabel, { color: c.danger }]}>Log out</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[5] },
    loggedIn: { alignItems: 'center', padding: Spacing[5] },
    title: { fontSize: Typography.h2, fontWeight: '900', marginTop: Spacing[4], marginBottom: Spacing[1] },
    sub: { fontSize: Typography.base, marginBottom: Spacing[5] },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        fontSize: Typography.base,
        marginBottom: Spacing[3],
    },
    btn: {
        width: '100%',
        paddingVertical: Spacing[4],
        borderRadius: 12,
        alignItems: 'center',
        marginTop: Spacing[2],
    },
    btnDisabled: { opacity: 0.6 },
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
