// Shared access to the per-restaurant shopping cart persisted in localStorage.
// Cart entries have the shape { item, qty } — matching the useCart hook.

const CART_PREFIX = 'cart_';

export const cartKey = (restaurantId) => `${CART_PREFIX}${restaurantId}`;

// Read the saved cart for a restaurant. Always returns an array (never throws).
export function readCart(restaurantId) {
  try {
    const saved = localStorage.getItem(cartKey(restaurantId));
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Persist a cart. An empty cart removes the key entirely.
export function writeCart(restaurantId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    localStorage.removeItem(cartKey(restaurantId));
    return;
  }
  localStorage.setItem(cartKey(restaurantId), JSON.stringify(items));
}

export function clearCart(restaurantId) {
  localStorage.removeItem(cartKey(restaurantId));
}
