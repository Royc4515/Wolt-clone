import { apiFetch } from './api';

export const getOrders = () => apiFetch('/api/orders', { method: 'GET' });

export const getOrder = (id) => apiFetch(`/api/orders/${id}`, { method: 'GET' });

// POST returns 201 No Content — cannot use apiFetch which always calls .json()
export const createOrder = async (restaurantId, items) => {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ restaurantId, items }),
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
};

// DELETE returns 204 No Content — same reason, cannot use apiFetch
export const cancelOrder = async (id) => {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (response.status === 401) {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to cancel order');
    }
};
