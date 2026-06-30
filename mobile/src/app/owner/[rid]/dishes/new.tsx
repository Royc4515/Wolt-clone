import { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../../../constants/theme';
import { createProduct, getMenu } from '../../../../services/api';
import { Field } from '../../_components/Field';

function SectionDropdown({
    value, onChange, options, error, colors: c,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    error?: string;
    colors: typeof Colors.light;
}) {
    const [open, setOpen] = useState(false);
    const filtered = value.trim()
        ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
        : options;

    return (
        <View style={{ zIndex: 10 }}>
            <View style={[
                styles.dropdownInput,
                { backgroundColor: c.surface, borderColor: error ? c.danger : open ? c.accent : c.border },
            ]}>
                <TextInput
                    style={[styles.dropdownTextInput, { color: c.text }]}
                    value={value}
                    onChangeText={(v) => { onChange(v); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Select or type a section…"
                    placeholderTextColor={c.textMuted}
                    autoCorrect={false}
                />
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.textMuted} />
            </View>

            {open && filtered.length > 0 && (
                <View style={[styles.dropdownList, { backgroundColor: c.surface, borderColor: c.border }]}>
                    {filtered.slice(0, 6).map((item) => (
                        <Pressable
                            key={item}
                            style={[
                                styles.dropdownItem,
                                { borderBottomColor: c.border },
                                value === item && { backgroundColor: c.accent + '18' },
                            ]}
                            onPress={() => { onChange(item); setOpen(false); }}
                        >
                            <Text style={[styles.dropdownItemText, { color: value === item ? c.accent : c.text }]}>
                                {item}
                            </Text>
                            {value === item && <Ionicons name="checkmark" size={16} color={c.accent} />}
                        </Pressable>
                    ))}
                </View>
            )}

            {error ? <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text> : null}
        </View>
    );
}

export default function NewDishScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { token, user } = useAuth();
    const { rid } = useLocalSearchParams<{ rid: string }>();

    const [sections, setSections] = useState<string[]>([]);
    const [image, setImage] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [section, setSection] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!token || user?.role !== 'admin') { router.replace('/(tabs)/profile'); return; }
    }, [token, user?.role]);

    useEffect(() => {
        if (!rid) return;
        getMenu(rid)
            .then((data) => {
                const names = Array.from(new Set(data.map((s) => s.title).filter(Boolean))).sort();
                setSections(names);
            })
            .catch(() => {});
    }, [rid]);

    if (!token || user?.role !== 'admin') return null;

    const clearError = (key: string) => {
        if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled && result.assets[0]?.base64) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Dish name is required';
        if (!price.trim()) {
            e.price = 'Price is required';
        } else if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            e.price = 'Must be a positive number';
        }
        if (!section.trim()) e.section = 'Section is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await createProduct(
                rid,
                {
                    name: name.trim(),
                    description: description.trim(),
                    price: parseFloat(price),
                    section: section.trim(),
                    sectionOrder: 9999,
                    isAvailable,
                    image,
                },
                token
            );
            router.back();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Creation failed';
            Alert.alert('Error', msg.includes('403') ? "You don't have permission" : msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={{ backgroundColor: c.background }}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* ── Photo ──────────────────────────────────────────────────── */}
            <Pressable
                style={[
                    styles.coverImage,
                    { backgroundColor: c.border },
                    !image && { alignItems: 'center', justifyContent: 'center' }
                ]}
                onPress={pickImage}
            >
                {image ? (
                    <>
                        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        <View style={styles.imageOverlay}>
                            <Ionicons name="camera-outline" size={16} color="#fff" />
                            <Text style={styles.imageOverlayText}>Change</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={32} color={c.textMuted} />
                        <Text style={[styles.coverPlaceholderText, { color: c.textMuted }]}>
                            Add Dish Photo
                        </Text>
                    </View>
                )}
            </Pressable>

            <View style={styles.content}>
                {/* ── Fields ─────────────────────────────────────────────────── */}
            <Field
                label="Name *"
                value={name}
                onChange={(v) => { setName(v); clearError('name'); }}
                placeholder="e.g. Margherita"
                error={errors.name}
                colors={c}
            />

            <Field
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Short description of the dish…"
                multiline
                numberOfLines={2}
                colors={c}
            />

            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Price *</Text>
            <View style={[
                styles.prefixInput,
                { backgroundColor: c.surface, borderColor: errors.price ? c.danger : c.border },
            ]}>
                <Text style={[styles.prefix, { color: c.textMuted }]}>₪</Text>
                <TextInput
                    style={[styles.prefixTextInput, { color: c.text }]}
                    value={price}
                    onChangeText={(v) => { setPrice(v); clearError('price'); }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={c.textMuted}
                />
            </View>
            {errors.price ? <Text style={[styles.errorText, { color: c.danger }]}>{errors.price}</Text> : null}

            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Section *</Text>
            <SectionDropdown
                value={section}
                onChange={(v) => { setSection(v); clearError('section'); }}
                options={sections}
                error={errors.section}
                colors={c}
            />

            {/* ── Availability ────────────────────────────────────────────── */}
            <Pressable
                style={[
                    styles.toggleCard,
                    { backgroundColor: isAvailable ? (c.accent + '15') : c.surface },
                    { borderColor: isAvailable ? c.accent : c.border }
                ]}
                onPress={() => setIsAvailable(!isAvailable)}
            >
                <View style={styles.toggleInfo}>
                    <Text style={[styles.toggleLabel, { color: isAvailable ? c.accent : c.text }]}>
                        {isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                    <Text style={[styles.toggleHint, { color: isAvailable ? c.accent : c.textMuted }]}>
                        {isAvailable ? 'Visible to customers' : 'Hidden from menu'}
                    </Text>
                </View>
                <Switch
                    value={isAvailable}
                    onValueChange={setIsAvailable}
                    trackColor={{ false: c.border, true: c.accent + '80' }}
                    thumbColor={isAvailable ? c.accent : c.textMuted}
                />
            </Pressable>

            <Text style={[styles.requiredNote, { color: c.textMuted }]}>* Required fields</Text>

            <Pressable
                style={[styles.btn, { backgroundColor: c.accent }, saving && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={saving}
            >
                {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Add Dish</Text>
                }
            </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { paddingBottom: Spacing[6] },
    content: { padding: Spacing[4] },

    coverImage: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    coverPlaceholderText: {
        marginTop: Spacing[2],
        fontSize: Typography.sm,
        fontWeight: '600',
    },
    imageOverlay: {
        position: 'absolute', bottom: Spacing[3], right: Spacing[3],
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
        gap: 6,
    },
    imageOverlayText: { color: '#fff', fontSize: Typography.sm, fontWeight: '600' },

    fieldLabel: { fontSize: Typography.sm, fontWeight: '600', marginTop: Spacing[3], marginBottom: Spacing[1] },

    prefixInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing[3],
    },
    prefix: { fontSize: Typography.base, fontWeight: '600', marginRight: 4 },
    prefixTextInput: { flex: 1, paddingVertical: Spacing[3], fontSize: Typography.base },

    dropdownInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderRadius: 12,
        paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    },
    dropdownTextInput: { flex: 1, fontSize: Typography.base, paddingVertical: 4 },
    dropdownList: {
        position: 'absolute', top: '100%', left: 0, right: 0,
        borderWidth: 1, borderRadius: 12, marginTop: 4,
        overflow: 'hidden', elevation: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12, shadowRadius: 6, zIndex: 10,
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1,
    },
    dropdownItemText: { fontSize: Typography.base },

    toggleCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: Spacing[5], padding: Spacing[4],
        borderRadius: 16, borderWidth: 1.5,
    },
    toggleInfo: { flex: 1 },
    toggleLabel: { fontSize: Typography.base, fontWeight: '600' },
    toggleHint: { fontSize: Typography.xs, marginTop: 2 },

    requiredNote: { fontSize: Typography.xs, marginTop: Spacing[4] },
    errorText: { fontSize: Typography.xs, marginTop: Spacing[1], color: 'red' },

    btn: {
        marginTop: Spacing[3],
        paddingVertical: Spacing[4],
        borderRadius: 14, alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: Typography.base },
});
