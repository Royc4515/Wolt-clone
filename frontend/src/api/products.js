import { apiFetch, apiMutate } from './api';

// All products (flat list) for a restaurant. Target: GET /api/restaurants/:id/products
export const getProducts = (restaurantId) =>
    apiFetch(`/api/restaurants/${restaurantId}/products`, { method: 'GET' });

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
