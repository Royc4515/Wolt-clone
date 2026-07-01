import { Platform } from 'react-native';
import Constants from 'expo-constants';

// On a physical device, hostUri is e.g. "192.168.1.101:8081" — use that IP with port 3000.
// On emulators, fall back to the loopback aliases.
const getHost = (): string => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3000`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const HOST = getHost();

const BASE_URL = `${HOST}/api`;

export const MEDIA_BASE = HOST;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const { headers: callerHeaders, ...restOptions } = options ?? {};
    const res = await fetch(`${BASE_URL}${path}`, {
        ...restOptions,
        headers: { 'Content-Type': 'application/json', ...callerHeaders },
    });
    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((json as { error?: string } | null)?.error ?? `HTTP ${res.status}`);
    return json as T;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Restaurant {
    id: string;
    name: string;
    description: string;
    category: string;
    location: { lat: number; lng: number };
    phone: string;
    openHours: string;
    isPromoted: boolean;
    rating: number;
    image: string;
    deliveryFee: number;
    deliveryTime: number;
    ownerId: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    section: string;
    sectionOrder: number;
    isAvailable: boolean;
    image: string;
    restaurantId: string;
}

export interface MenuSection {
    id: string;
    title: string;
    items: Product[];
}

export interface SearchResult {
    restaurants: Restaurant[];
    products: Product[];
}

export interface AuthUser {
    id: string;
    _id?: string;
    username: string;
    displayName: string;
    role: 'customer' | 'admin';
    location?: { lat: number; lng: number };
    profilePicture?: string;
}

export interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    _id: string;
    restaurantId: string;
    items: OrderItem[];
    mode: 'delivery' | 'pickup';
    status: 'pending' | 'accepted' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
    pricing: {
        total: number;
    };
    createdAt: string;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const getRestaurants = (lat?: number, lng?: number) => {
    const params = lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : '';
    return apiFetch<Restaurant[]>(`/restaurants${params}`);
};

export const getRestaurant = (id: string) =>
    apiFetch<Restaurant>(`/restaurants/${id}`);

export const getMenu = (id: string) =>
    apiFetch<MenuSection[]>(`/restaurants/${id}/menu`);

export const searchAll = (query: string) =>
    apiFetch<SearchResult>(`/search/${encodeURIComponent(query)}`);

export const login = (username: string, password: string) =>
    apiFetch<{ token: string; user: AuthUser }>('/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

export const register = (data: {
    username: string;
    password: string;
    displayName: string;
    profilePicture: string;
    location: { lat: number; lng: number };
    role: 'customer' | 'admin';
}) => apiFetch<{ id: string }>('/users', { method: 'POST', body: JSON.stringify(data) });

export const createRestaurant = (
    data: Partial<Restaurant>,
    token: string
) =>
    apiFetch<void>('/restaurants', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });

export const deleteRestaurant = (id: string, token: string) =>
    apiFetch<void>(`/restaurants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });

export const deleteUser = (id: string, token: string) =>
    apiFetch<void>(`/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });

export const updateUser = (id: string, data: Partial<AuthUser>, token: string) =>
    apiFetch<{ user: AuthUser; token: string }>(`/users/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });

export const updateRestaurant = (id: string, data: Partial<Restaurant>, token: string) =>
    apiFetch<Restaurant>(`/restaurants/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });

export const createProduct = (restaurantId: string, data: Partial<Product>, token: string) =>
    apiFetch<Product>(`/restaurants/${restaurantId}/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });

export const updateProduct = (restaurantId: string, productId: string, data: Partial<Product>, token: string) =>
    apiFetch<Product>(`/restaurants/${restaurantId}/products/${productId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });

export const deleteProduct = (restaurantId: string, productId: string, token: string) =>
    apiFetch<void>(`/restaurants/${restaurantId}/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });

export const createOrder = (data: any, token: string) =>
    apiFetch<any>('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });

export const getUserOrders = (token: string) =>
    apiFetch<Order[]>('/orders', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });