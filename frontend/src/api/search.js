import { apiFetch } from './api';
import { realDeliveryFee } from '../utils/checkout';
import { getUserLocation } from '../utils/location';

export const searchAll = async (query) => {
    if (!query || query.trim() === '') return { restaurants: [], products: [] };

    const [searchData, allRestsData] = await Promise.all([
        apiFetch(`/api/search/${encodeURIComponent(query.trim())}`, { method: 'GET' }),
        apiFetch('/api/restaurants', { method: 'GET' }).catch(() => null),
    ]);

    const userLoc = getUserLocation();
    const rawRestaurants = searchData.restaurants || searchData.Restaurants || [];
    const rawProducts    = searchData.products    || searchData.Products    || [];

    // Show the real, distance-based delivery fee (falls back to base fee).
    const restaurants = rawRestaurants.map(r => ({ ...r, deliveryFee: realDeliveryFee(r, userLoc) }));

    // Build lookup from all restaurants (full list) so every product's restId resolves
    const allRestsArray = Array.isArray(allRestsData)
        ? allRestsData
        : (allRestsData?.restaurants || restaurants);
    const restMap = Object.fromEntries(allRestsArray.map(r => [r.id, r]));

    const products = rawProducts.map(p => {
        const rest = restMap[p.restId] || {};
        const loc = rest.location;
        const restaurantCoords = loc && loc.lat != null && loc.lng != null
            ? `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`
            : null;
        return {
            ...p,
            restaurantName:  rest.name        ?? p.restaurantName ?? null,
            restaurantCoords,
            deliveryFee:     rest.id ? realDeliveryFee(rest, userLoc) : (rest.deliveryFee ?? null),
            deliveryTime:    rest.deliveryTime ?? null,
            rating:          rest.rating       ?? null,
        };
    });

    return { restaurants, products };
};
