import { useContext } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export function ThemeToggleButton() {
    const { isDark, toggleTheme } = useContext(ThemeContext);

    return (
        <Pressable
            onPress={toggleTheme}
            style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 10,
                backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
            }}
        >
            <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={isDark ? '#fff' : '#1c1d2a'}
            />
        </Pressable>
    );
}
