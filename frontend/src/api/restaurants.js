import { apiFetch } from './api';

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
 * Target: GET /api/restaurants/:id/products
 */
export const getMenu = async (restaurantId) => {
    return await apiFetch(`/api/restaurants/${restaurantId}/menu`, {
        method: 'GET',
    });
};