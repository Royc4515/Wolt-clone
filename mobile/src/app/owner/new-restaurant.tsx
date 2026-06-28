import { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { createRestaurant } from '../../services/api';

interface FieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    keyboardType?: TextInputProps['keyboardType'];
    colors: typeof Colors.light;
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default', colors: c }: FieldProps) {
    return (
        <View>
            <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
            <TextInput
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
                placeholder={placeholder}
                placeholderTextColor={c.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType={keyboardType}
                autoCorrect={false}
            />
        </View>
    );
}

export default function NewRestaurantScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { token } = useAuth();

    useEffect(() => {
        if (!token) router.replace('/(tabs)/profile');
    }, [token]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [phone, setPhone] = useState('');
    const [openHours, setOpenHours] = useState('');
    const [loading, setLoading] = useState(false);

    if (!token) return null;

    const handleSubmit = async () => {
        if (!name.trim() || !category.trim() || !lat.trim() || !lng.trim()) {
            Alert.alert('Missing fields', 'Name, category, latitude and longitude are required.');
            return;
        }
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum)) {
            Alert.alert('Invalid coordinates', 'Latitude and longitude must be numbers.');
            return;
        }
        if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
            Alert.alert('Invalid coordinates', 'Latitude must be −90 to 90, longitude −180 to 180.');
            return;
        }
        setLoading(true);
        try {
            await createRestaurant(
                { name: name.trim(), description: description.trim(), category: category.trim(),
                  location: { lat: latNum, lng: lngNum }, phone: phone.trim(), openHours: openHours.trim() },
                token
            );
            Alert.alert('Success', `"${name}" created!`, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Creation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={{ backgroundColor: c.background }}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <Field label="Name *" value={name} onChange={setName} placeholder="e.g. Pizza Roma" colors={c} />
            <Field label="Category *" value={category} onChange={setCategory} placeholder="e.g. Italian" colors={c} />
            <Field label="Latitude *" value={lat} onChange={setLat} placeholder="e.g. 32.08" keyboardType="decimal-pad" colors={c} />
            <Field label="Longitude *" value={lng} onChange={setLng} placeholder="e.g. 34.78" keyboardType="decimal-pad" colors={c} />
            <Field label="Description" value={description} onChange={setDescription} placeholder="Short description" colors={c} />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="e.g. 03-1234567" keyboardType="phone-pad" colors={c} />
            <Field label="Opening hours" value={openHours} onChange={setOpenHours} placeholder="e.g. 10:00-23:00" colors={c} />

            <Pressable
                style={[styles.btn, { backgroundColor: c.accent }, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Create Restaurant</Text>
                }
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: Spacing[5], paddingBottom: Spacing[6] },
    label: { fontSize: Typography.sm, fontWeight: '600', marginBottom: Spacing[1], marginTop: Spacing[3] },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        fontSize: Typography.base,
    },
    btn: {
        marginTop: Spacing[5],
        paddingVertical: Spacing[4],
        borderRadius: 12,
        alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: Typography.base },
});
