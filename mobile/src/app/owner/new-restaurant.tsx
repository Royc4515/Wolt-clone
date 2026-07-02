import { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { createRestaurant, getRestaurants } from '../../services/api';
import Field from '../../components/owner/Field';

function CategoryDropdown({
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
                    placeholder="Select or type a category…"
                    placeholderTextColor={c.textMuted}
                    autoCorrect={false}
                />
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={c.textMuted}
                />
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

function SectionHeader({ title, colors: c }: { title: string; colors: typeof Colors.light }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{title}</Text>
        </View>
    );
}

function TimePicker({
    label, hour, minute,
    onHourChange, onMinuteChange,
    colors: c,
}: {
    label: string;
    hour: number;
    minute: number;
    onHourChange: (h: number) => void;
    onMinuteChange: (m: number) => void;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.timePicker}>
            <Text style={[styles.timeLabel, { color: c.textMuted }]}>{label}</Text>
            <View style={styles.timeBoxRow}>
                {/* ── Hour ── */}
                <View style={styles.timeUnit}>
                    <Pressable style={styles.timeArrow} onPress={() => onHourChange((hour + 1) % 24)}>
                        <Ionicons name="chevron-up" size={18} color={c.accent} />
                    </Pressable>
                    <TextInput
                        style={[styles.timeInput, { backgroundColor: c.surface, borderColor: c.accent, color: c.accent }]}
                        value={String(hour).padStart(2, '0')}
                        onChangeText={(v) => {
                            const n = parseInt(v, 10);
                            if (v === '') { onHourChange(0); return; }
                            if (!isNaN(n) && n >= 0 && n <= 23) onHourChange(n);
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        selectTextOnFocus
                    />
                    <Pressable style={styles.timeArrow} onPress={() => onHourChange((hour - 1 + 24) % 24)}>
                        <Ionicons name="chevron-down" size={18} color={c.accent} />
                    </Pressable>
                    <Text style={[styles.timeUnitLabel, { color: c.textMuted }]}>hr</Text>
                </View>

                <Text style={[styles.timeSep, { color: c.text }]}>:</Text>

                {/* ── Minute ── */}
                <View style={styles.timeUnit}>
                    <Pressable style={styles.timeArrow} onPress={() => onMinuteChange((minute + 15) % 60)}>
                        <Ionicons name="chevron-up" size={18} color={c.accent} />
                    </Pressable>
                    <TextInput
                        style={[styles.timeInput, { backgroundColor: c.surface, borderColor: c.accent, color: c.accent }]}
                        value={String(minute).padStart(2, '0')}
                        onChangeText={(v) => {
                            const n = parseInt(v, 10);
                            if (v === '') { onMinuteChange(0); return; }
                            if (!isNaN(n) && n >= 0 && n <= 59) onMinuteChange(n);
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        selectTextOnFocus
                    />
                    <Pressable style={styles.timeArrow} onPress={() => onMinuteChange(((minute - 15) + 60) % 60)}>
                        <Ionicons name="chevron-down" size={18} color={c.accent} />
                    </Pressable>
                    <Text style={[styles.timeUnitLabel, { color: c.textMuted }]}>min</Text>
                </View>
            </View>
        </View>
    );
}

export default function NewRestaurantScreen() {
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    const { token, user } = useAuth();
    const [saving, setSaving] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!token || user?.role !== 'admin') { router.replace('/(tabs)/profile'); return; }
    }, [token, user?.role]);

    const [categories, setCategories] = useState<string[]>([]);
    useEffect(() => {
        getRestaurants()
            .then((all) => {
                const unique = Array.from(new Set(all.map((r) => r.category).filter(Boolean))).sort();
                setCategories(unique);
            })
            .catch(() => {});
    }, []);

    const [image, setImage] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [phone, setPhone] = useState('');
    const [openHour, setOpenHour] = useState(9);
    const [openMin, setOpenMin] = useState(0);
    const [closeHour, setCloseHour] = useState(22);
    const [closeMin, setCloseMin] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState('0');
    const [deliveryTime, setDeliveryTime] = useState(30);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!lat && !lng) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [lat, lng]);

    const clearError = (key: string) => {
        if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
    };

    const derivedHours = `${String(openHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')}-${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}`;

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.25,
            base64: true,
        });
        if (!result.canceled && result.assets[0]?.base64) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const useMyLocation = () => {
        if (user?.location) {
            setLat(String(user.location.lat));
            setLng(String(user.location.lng));
            clearError('lat');
            clearError('lng');
        } else {
            Alert.alert('No location', 'No location is saved in your profile.');
        }
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Restaurant name is required';
        if (!category.trim()) e.category = 'Please select or type a category';
        if (!lat.trim()) {
            e.lat = 'Latitude is required';
        } else if (isNaN(parseFloat(lat))) {
            e.lat = 'Must be a valid number (e.g. 32.08)';
        } else if (parseFloat(lat) < -90 || parseFloat(lat) > 90) {
            e.lat = 'Must be between −90 and 90';
        }
        if (!lng.trim()) {
            e.lng = 'Longitude is required';
        } else if (isNaN(parseFloat(lng))) {
            e.lng = 'Must be a valid number (e.g. 34.78)';
        } else if (parseFloat(lng) < -180 || parseFloat(lng) > 180) {
            e.lng = 'Must be between −180 and 180';
        }
        if (phone.trim()) {
            const digits = phone.replace(/\D/g, '');
            if (digits.length < 7) e.phone = 'Phone number is too short';
            else if (digits.length > 15) e.phone = 'Phone number is too long';
        }
        const feeNum = parseFloat(deliveryFee);
        if (deliveryFee !== '' && isNaN(feeNum)) e.deliveryFee = 'Must be a number';
        else if (!isNaN(feeNum) && feeNum < 0) e.deliveryFee = 'Cannot be negative';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await createRestaurant({
                name: name.trim(),
                description: description.trim(),
                category: category.trim(),
                location: { lat: parseFloat(lat), lng: parseFloat(lng) },
                phone: phone.trim(),
                openHours: derivedHours,
                deliveryFee: parseFloat(deliveryFee) || 0,
                deliveryTime,
                image,
            }, token!);
            router.back();
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
            {/* ── Hero image ──────────────────────────────────────────────── */}
            <Pressable
                style={[styles.imagePicker, { backgroundColor: c.surface }]}
                onPress={pickImage}
            >
                {image ? (
                    <>
                        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        <View style={styles.imageOverlay}>
                            <Ionicons name="camera-outline" size={18} color="#fff" />
                            <Text style={styles.imageOverlayText}>Change photo</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera-outline" size={36} color={c.textMuted} />
                        <Text style={[styles.imagePlaceholderText, { color: c.textMuted }]}>
                            Tap to add a cover photo
                        </Text>
                    </View>
                )}
            </Pressable>

            {/* ── Basic Info ──────────────────────────────────────────────── */}
            <View style={{ marginTop: Spacing[5], zIndex: 10, elevation: 10 }}>
                <SectionHeader title="Basic Info" colors={c} />
                <View style={[styles.sectionCard, { backgroundColor: c.surface }]}>
                    <Field
                        label="Name *"
                        value={name}
                        onChange={(v) => { setName(v); clearError('name'); }}
                        placeholder="e.g. Pizza Roma"
                        error={errors.name}
                        colors={c}
                    />

                    <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Category *</Text>
                    <CategoryDropdown
                        value={category}
                        onChange={(v) => { setCategory(v); clearError('category'); }}
                        options={categories}
                        error={errors.category}
                        colors={c}
                    />

                    <Field
                        label="Description"
                        value={description}
                        onChange={setDescription}
                        placeholder="A short description of your restaurant…"
                        multiline
                        numberOfLines={3}
                        colors={c}
                    />
                </View>
            </View>

            {/* ── Location ────────────────────────────────────────────────── */}
            <SectionHeader title="Location" colors={c} />
            <View style={[styles.sectionCard, { backgroundColor: c.surface }]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Pressable
                        style={[styles.locationBtn, { backgroundColor: c.accent + '18', borderColor: c.accent + '55' }]}
                        onPress={useMyLocation}
                    >
                        <Ionicons name="location-outline" size={16} color={c.accent} />
                        <Text style={[styles.locationBtnText, { color: c.accent }]}>Use my profile location</Text>
                    </Pressable>
                </Animated.View>

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Latitude *"
                            value={lat}
                            onChange={(v) => { setLat(v); clearError('lat'); }}
                            placeholder="e.g. 32.08"
                            keyboardType="decimal-pad"
                            error={errors.lat}
                            colors={c}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Longitude *"
                            value={lng}
                            onChange={(v) => { setLng(v); clearError('lng'); }}
                            placeholder="e.g. 34.78"
                            keyboardType="decimal-pad"
                            error={errors.lng}
                            colors={c}
                        />
                    </View>
                </View>
                <Text style={[styles.hint, { color: c.textMuted }]}>
                    Ensure coordinates are accurate for delivery calculations.
                </Text>
            </View>

            {/* ── Contact & Hours ─────────────────────────────────────────── */}
            <SectionHeader title="Contact & Hours" colors={c} />
            <View style={[styles.sectionCard, { backgroundColor: c.surface }]}>
                <Field
                    label="Phone"
                    value={phone}
                    onChange={(v) => {
                        const cleaned = v.replace(/[^\d+\-() ]/g, '');
                        setPhone(cleaned);
                        clearError('phone');
                    }}
                    placeholder="e.g. 03-1234567"
                    keyboardType="phone-pad"
                    error={errors.phone}
                    hint="Digits, +, −, spaces and parentheses only"
                    colors={c}
                />

                <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Opening Hours</Text>
                <View style={styles.timeRow}>
                    <TimePicker
                        label="From"
                        hour={openHour}
                        minute={openMin}
                        onHourChange={setOpenHour}
                        onMinuteChange={setOpenMin}
                        colors={c}
                    />
                    <Text style={[styles.timeRangeDash, { color: c.textMuted }]}>—</Text>
                    <TimePicker
                        label="Until"
                        hour={closeHour}
                        minute={closeMin}
                        onHourChange={setCloseHour}
                        onMinuteChange={setCloseMin}
                        colors={c}
                    />
                </View>
                <Text style={[styles.hoursPreview, { color: c.accent }]}>
                    🕐 {derivedHours}
                </Text>
            </View>

            {/* ── Delivery ────────────────────────────────────────────────── */}
            <SectionHeader title="Delivery" colors={c} />
            <View style={[styles.sectionCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Delivery Fee</Text>
                <View style={[
                    styles.prefixInput,
                    { backgroundColor: c.surface, borderColor: errors.deliveryFee ? c.danger : c.border },
                ]}>
                    <Text style={[styles.prefix, { color: c.textMuted }]}>₪</Text>
                    <TextInput
                        style={[styles.prefixTextInput, { color: c.text }]}
                        value={deliveryFee}
                        onChangeText={(v) => { setDeliveryFee(v); clearError('deliveryFee'); }}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={c.textMuted}
                    />
                </View>
                {errors.deliveryFee
                    ? <Text style={[styles.errorText, { color: c.danger }]}>{errors.deliveryFee}</Text>
                    : null}

                <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Delivery Time</Text>
                <View style={styles.stepper}>
                    <Pressable
                        style={[styles.stepperBtn, { backgroundColor: c.surface, borderColor: c.border }]}
                        onPress={() => setDeliveryTime((t) => Math.max(5, t - 5))}
                    >
                        <Ionicons name="remove" size={20} color={c.text} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: c.text }]}>{deliveryTime} min</Text>
                    <Pressable
                        style={[styles.stepperBtn, { backgroundColor: c.surface, borderColor: c.border }]}
                        onPress={() => setDeliveryTime((t) => Math.min(120, t + 5))}
                    >
                        <Ionicons name="add" size={20} color={c.text} />
                    </Pressable>
                </View>
            </View>

            {/* ── Submit ──────────────────────────────────────────────────── */}
            <Text style={[styles.requiredNote, { color: c.textMuted }]}>* Required fields</Text>
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
    container: { paddingBottom: Spacing[6] },

    // Hero image
    imagePicker: { height: 220, overflow: 'hidden' },
    imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[2] },
    imagePlaceholderText: { fontSize: Typography.sm },
    imageOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: Spacing[2], paddingVertical: Spacing[3],
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    imageOverlayText: { color: '#fff', fontSize: Typography.sm, fontWeight: '700' },

    // Section
    sectionCard: {
        borderRadius: 20,
        padding: Spacing[4],
        marginHorizontal: Spacing[4],
        marginBottom: Spacing[5],
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    sectionHeader: {
        paddingHorizontal: Spacing[4], paddingBottom: Spacing[2], marginLeft: Spacing[2],
    },
    sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

    fieldLabel: { fontSize: Typography.sm, fontWeight: '600', marginTop: Spacing[3], marginBottom: Spacing[1] },

    // Category dropdown
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
        shadowOpacity: 0.12, shadowRadius: 6,
        zIndex: 10,
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
        borderBottomWidth: 1,
    },
    dropdownItemText: { fontSize: Typography.base },

    // Location
    row: { flexDirection: 'row', gap: Spacing[3] },
    locationBtn: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
        alignSelf: 'flex-start', marginTop: Spacing[2],
        paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
        borderRadius: 10, borderWidth: 1,
    },
    locationBtnText: { fontSize: Typography.sm, fontWeight: '600' },
    hint: { fontSize: Typography.xs, lineHeight: 16, marginTop: Spacing[2] },

    // Time picker
    timeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[4], marginTop: Spacing[2] },
    timePicker: { flex: 1, alignItems: 'center' },
    timeLabel: { fontSize: Typography.sm, fontWeight: '700', marginBottom: Spacing[2] },
    timeBoxRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeUnit: { alignItems: 'center', gap: 2 },
    timeArrow: { padding: 4 },
    timeInput: {
        borderWidth: 1.5, borderRadius: 10,
        width: 52, height: 48,
        fontSize: Typography.lg, fontWeight: '700',
        textAlign: 'center',
    },
    timeUnitLabel: { fontSize: 11, marginTop: 2 },
    timeSep: { fontSize: Typography.h3, fontWeight: '700', marginBottom: 24 },
    timeRangeDash: { fontSize: Typography.lg, fontWeight: '700', marginTop: 68, marginLeft: -4 },
    hoursPreview: { fontSize: Typography.sm, fontWeight: '600', marginTop: Spacing[3], textAlign: 'center' },

    // Delivery
    prefixInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing[3], marginTop: Spacing[1],
    },
    prefix: { fontSize: Typography.base, fontWeight: '600', marginRight: 4 },
    prefixTextInput: { flex: 1, paddingVertical: Spacing[3], fontSize: Typography.base },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], marginTop: Spacing[1] },
    stepperBtn: {
        width: 40, height: 40, borderRadius: 10, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    stepperValue: { fontSize: Typography.base, fontWeight: '700', minWidth: 70, textAlign: 'center' },

    // Footer
    requiredNote: { fontSize: Typography.xs, marginTop: Spacing[4], marginHorizontal: Spacing[4] },
    errorText: { fontSize: Typography.xs, marginTop: Spacing[1] },
    btn: {
        marginTop: Spacing[3], marginHorizontal: Spacing[4],
        paddingVertical: Spacing[4], borderRadius: 14, alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: Typography.base },
});
