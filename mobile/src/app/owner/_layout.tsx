import { Stack, Redirect } from 'expo-router';
import { useContext } from 'react';
import { Colors } from '../../constants/theme';
import { ThemeToggleButton } from '../../components/ThemeToggleButton';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { AnimatedSplashOverlay } from '../../components/animated-icon';

export default function OwnerLayout() {
    const { isDark } = useContext(ThemeContext);
    const { token, user, isLoading } = useContext(AuthContext);
    const c = isDark ? Colors.dark : Colors.light;

    if (isLoading) return <AnimatedSplashOverlay />;

    if (!token || user?.role !== 'admin') {
        return <Redirect href="/(tabs)/profile" />;
    }

    const ownerHeaderOpts = {
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerShadowVisible: false,
        headerLeft: () => <HeaderBackButton />,
        headerRight: () => <ThemeToggleButton />,
    };

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{ title: 'My Restaurants', ...ownerHeaderOpts }}
            />
            <Stack.Screen
                name="new-restaurant"
                options={{ title: 'New Restaurant', ...ownerHeaderOpts }}
            />
            <Stack.Screen
                name="edit-restaurant/[id]"
                options={{ title: 'Edit Restaurant', ...ownerHeaderOpts }}
            />
            <Stack.Screen
                name="[rid]/dishes/index"
                options={{ title: 'Dishes', ...ownerHeaderOpts }}
            />
            <Stack.Screen
                name="[rid]/dishes/new"
                options={{ title: 'New Dish', ...ownerHeaderOpts }}
            />
            <Stack.Screen
                name="[rid]/dishes/[pid]/edit"
                options={{ title: 'Edit Dish', ...ownerHeaderOpts }}
            />
            <Stack.Screen
                name="[rid]/orders"
                options={{ title: 'Orders', ...ownerHeaderOpts }}
            />
        </Stack>
    );
}
