import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export function ProductImage({ uri }: { uri?: string }) {
    const [err, setErr] = useState(false);
    if (!uri || err) return null;
    return (
        <Image source={uri} style={styles.itemImg} contentFit="cover" onError={() => setErr(true)} />
    );
}

const styles = StyleSheet.create({
    itemImg: { width: 90, height: 90, borderRadius: 10 },
});
