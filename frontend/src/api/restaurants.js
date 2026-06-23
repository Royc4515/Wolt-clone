import { apiFetch, apiMutate } from './api';

// Build a `?lat=&lng=` query from coords, or '' when either is missing/invalid.
// Shared by the feed and the recommendations request so both honour the radius.
const coordsQuery = (coords) => {
    const lat = coords?.lat;
    const lng = coords?.lng;
    return Number.isFinite(lat) && Number.isFinite(lng)
        ? `?${new URLSearchParams({ lat, lng }).toString()}`
        : '';
};

/**
 * Fetches the list of restaurants.
 * Target: GET /api/restaurants (optionally ?lat=&lng=)
 *
 * When valid coordinates are supplied, the server filters the feed to
 * restaurants within the delivery radius. Called without coords (guests /
 * users with no saved location), it returns every restaurant.
 *
 * @param {{ lat?: number, lng?: number }} [coords]
 */
export const getRestaurants = async (coords) => {
    return await apiFetch(`/api/restaurants${coordsQuery(coords)}`, {
        method: 'GET',
    });
};

/**
 * Fetches a specific restaurant by id.
 * Target: GET /api/restaurants/:id
 */
export const getRestaurant = async (id) => {
    return await apiFetch(`/api/restaurants/${id}`, {
        method: 'GET',
    });
};

/**
 * Fetches personalized restaurant recommendations for the logged-in user.
 * Target: GET /api/restaurants/recommended (optionally ?lat=&lng=)
 *
 * Coordinates are forwarded just like getRestaurants so the server can apply
 * the same 15 km delivery radius to the recommendations (it falls back to
 * nearby defaults when needed). Returns up to 5 restaurant objects (same shape
 * as getRestaurants). The caller MUST be authenticated before calling this:
 * the endpoint is auth-only and apiFetch force-logs-out on 401.
 *
 * @param {{ lat?: number, lng?: number }} [coords]
 */
export const getRecommendedRestaurants = async (coords) => {
    return await apiFetch(`/api/restaurants/recommended${coordsQuery(coords)}`, {
        method: 'GET',
    });
};

/**
 * Searches for restaurants or products based on a text query.
 * Target: GET /api/search/:query
 */
export const searchRestaurants = async (query) => {
    // First, ensure that the query is not empty.
    if (!query || query.trim() === '') return []; 
    
    return await apiFetch(`/api/search/${query}`, {
        method: 'GET',
    });
};

/**
 * Fetches the full menu (all products) for a specific restaurant by its ID.
 * Target: GET /api/restaurants/:id/menu
 */
export const getMenu = async (restaurantId) => {
    return await apiFetch(`/api/restaurants/${restaurantId}/menu`, {
        method: 'GET',
    });
};

/* ── Admin: restaurant management (require admin + ownership) ── */

// Create a restaurant. Returns { id } of the new restaurant.
export const createRestaurant = (data) =>
    apiMutate('/api/restaurants', { method: 'POST', body: JSON.stringify(data) });

export const updateRestaurant = (id, data) =>
    apiMutate(`/api/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteRestaurant = (id) =>
    apiMutate(`/api/restaurants/${id}`, { method: 'DELETE' });