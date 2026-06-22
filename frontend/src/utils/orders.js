export const ORDER_STATUS = {
  pending: 'Pending',
  preparing: 'Preparing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// The statuses a restaurant admin can move an order through, in order.
export const ADMIN_STATUS_FLOW = ['pending', 'preparing', 'delivered'];

// Orders in this app never progress past "pending", so a placed order would
// otherwise read as perpetually pending in history. Show it as completed.
export function displayStatus(status) {
  return status === 'pending' ? 'delivered' : status;
}

export function statusLabel(status) {
  return ORDER_STATUS[displayStatus(status)] || status;
}

// The true status label, without the customer-facing pending→delivered remap.
// Used by the admin orders view, which must show the real lifecycle stage.
export function adminStatusLabel(status) {
  return ORDER_STATUS[status] || status;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function readLocalCarts() {
  const carts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('cart_')) continue;
    try {
      const items = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(items) && items.length > 0) {
        carts.push({ restaurantId: key.slice('cart_'.length), items });
      }
    } catch (err) {
      console.error('Failed to parse cart for key', key, err);
    }
  }
  return carts;
}
