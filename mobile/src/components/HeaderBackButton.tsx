import { useContext } from 'react';
import { Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { Colors } from '../constants/theme';

interface HeaderBackButtonProps {
    color?: string;
}

export function HeaderBackButton({ color }: HeaderBackButtonProps) {
    const { isDark } = useContext(ThemeContext);
    const tintColor = color ?? (isDark ? Colors.dark.text : Colors.light.text);

    return (
        <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{
                marginLeft: Platform.OS === 'ios' ? -8 : 0,
                paddingRight: 15,
            }}
        >
            <Ionicons name="chevron-back" size={28} color={tintColor} />
        </Pressable>
    );
}
