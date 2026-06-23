import { apiFetch, apiMutate } from './api';

// All products (flat list) for a restaurant. Target: GET /api/restaurants/:id/products
export const getProducts = (restaurantId) =>
    apiFetch(`/api/restaurants/${restaurantId}/products`, { method: 'GET' });

// Personalized product recommendations within a single restaurant (max 5),
// based on the user's last ordered product. Target (requires auth):
// GET /api/restaurants/:id/products/recommended
// Returns a flat array of product objects (same shape as getProducts) that all
// belong to this restaurant. Caller MUST be authenticated before calling:
// the endpoint is auth-only and apiFetch force-logs-out on 401.
export const getRecommendedProducts = (restaurantId) =>
    apiFetch(`/api/restaurants/${restaurantId}/products/recommended`, { method: 'GET' });

/* ── Admin: menu-item management (owner-only on the server) ── */

// Create a menu item. Returns { id } of the new product.
export const createProduct = (restaurantId, data) =>
    apiMutate(`/api/restaurants/${restaurantId}/products`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateProduct = (restaurantId, productId, data) =>
    apiMutate(`/api/restaurants/${restaurantId}/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });

export const deleteProduct = (restaurantId, productId) =>
    apiMutate(`/api/restaurants/${restaurantId}/products/${productId}`, {
        method: 'DELETE',
    });
