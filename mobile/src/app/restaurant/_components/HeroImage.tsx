import { useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { HERO_H } from './constants';

export default function HeroImage({ uri }: { uri?: string }) {
    const [err, setErr] = useState(false);
    const { isDark } = useContext(ThemeContext);
    const c = isDark ? Colors.dark : Colors.light;
    if (!uri || err) {
        return (
            <View style={[styles.hero, { backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="fast-food-outline" size={64} color={c.textMuted} />
            </View>
        );
    }
    return (
        <Image source={uri} style={styles.hero} contentFit="cover" onError={() => setErr(true)} />
    );
}

const styles = StyleSheet.create({
    hero: { width: '100%', height: HERO_H },
});
