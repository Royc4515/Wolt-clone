import { Platform } from 'react-native';

const HOST =
    Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const BASE_URL = `${HOST}/api`;

export const MEDIA_BASE = HOST;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const { headers: callerHeaders, ...restOptions } = options ?? {};
    const res = await fetch(`${BASE_URL}${path}`, {
        ...restOptions,
        headers: { 'Content-Type': 'application/json', ...callerHeaders },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
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
    username: string;
    displayName: string;
    role: 'customer' | 'admin';
    location?: { lat: number; lng: number };
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
    apiFetch<{ token: string }>('/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

export const register = (data: {
    username: string;
    password: string;
    displayName: string;
    profilePicture: string;
    location: { lat: number; lng: number };
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
