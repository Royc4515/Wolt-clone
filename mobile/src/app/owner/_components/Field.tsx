import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants/theme';

export interface FieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    keyboardType?: TextInputProps['keyboardType'];
    error?: string;
    hint?: string;
    multiline?: boolean;
    numberOfLines?: number;
    colors: typeof Colors.light;
}

export default function Field({
    label, value, onChange, placeholder,
    keyboardType = 'default', error, hint, multiline, numberOfLines, colors: c,
}: FieldProps) {
    return (
        <View>
            <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    { backgroundColor: c.surface, borderColor: error ? c.danger : c.border, color: c.text },
                    multiline && styles.inputMultiline,
                ]}
                placeholder={placeholder}
                placeholderTextColor={c.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType={keyboardType}
                autoCorrect={false}
                multiline={multiline}
                numberOfLines={numberOfLines}
                textAlignVertical={multiline ? 'top' : 'auto'}
            />
            {hint && !error ? <Text style={[styles.hint, { color: c.textMuted }]}>{hint}</Text> : null}
            {error ? <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: Typography.sm, fontWeight: '600', marginBottom: Spacing[1], marginTop: Spacing[3] },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        fontSize: Typography.base,
    },
    inputMultiline: {
        minHeight: 80,
        paddingTop: Spacing[3],
    },
    hint: { fontSize: Typography.xs, marginTop: Spacing[1], lineHeight: 16 },
    errorText: { fontSize: Typography.xs, marginTop: Spacing[1] },
});
