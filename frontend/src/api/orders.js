import { apiFetch } from './api';

export const getOrders = () => apiFetch('/api/orders', { method: 'GET' });

export const getOrder = (id) => apiFetch(`/api/orders/${id}`, { method: 'GET' });

// DELETE returns 204 No Content, so apiFetch (which calls .json()) cannot be used here.
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
