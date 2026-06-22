import { apiFetch } from './api';

export const getOrders = () => apiFetch('/api/orders', { method: 'GET' });

export const getOrder = (id) => apiFetch(`/api/orders/${id}`, { method: 'GET' });

// POST returns the complete order object with backend-calculated pricing.
export const createOrder = async (orderPayload) => {
    // orderPayload should include: restaurantId, items, mode, paymentMethod, cutlery, notes, location, tip.
    const token = localStorage.getItem('jwt_token');
    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
    });
    if (response.status === 401) {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to place order');
    }

    // Return the object from the server to present to user.
    return await response.json();
};

// DELETE now returns a JSON object from the server, allowing us to use apiFetch safely.
export const cancelOrder = (id) => apiFetch(`/api/orders/${id}`, { method: 'DELETE' });

/* ── Admin: restaurant order management (auth + admin + owner on the server) ── */

// All orders for a restaurant the admin owns. Target: GET /api/orders/restaurant/:restaurantId
export const getRestaurantOrders = (restaurantId) =>
    apiFetch(`/api/orders/restaurant/${restaurantId}`, { method: 'GET' });

// Update an order's status. Returns the full updated order.
// Target: PATCH /api/orders/:id/status
export const updateOrderStatus = (id, status) =>
    apiFetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
