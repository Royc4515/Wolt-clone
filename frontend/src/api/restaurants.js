import { apiFetch, apiMutate } from './api';

/**
 * Fetches the list of all restaurants.
 * Target: GET /api/restaurants
 */
export const getRestaurants = async () => {
    return await apiFetch('/api/restaurants', {
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