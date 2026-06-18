// Fee model for the checkout page. Service fee / tip / fulfillment are faked
// on the frontend — the backend order endpoint only stores restaurant + items.

export const SERVICE_FEE = 5.9;

export const TIP_OPTIONS = [0, 5, 10, 15];

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit card' },
  { id: 'cash', label: 'Cash' },
  { id: 'applepay', label: 'Apple Pay' },
];

export function paymentLabel(methodId) {
  return PAYMENT_METHODS.find((m) => m.id === methodId)?.label || 'Card';
}

export function money(amount) {
  return `₪${Number(amount || 0).toFixed(2)}`;
}

// Pickup has no service or delivery fee and no courier tip — total is the
// item subtotal only (matches Wolt). Delivery adds service + delivery + tip.
export function computeTotals({ subtotal, deliveryFee = 0, tip = 0, mode = 'delivery' }) {
  if (mode === 'pickup') {
    return { subtotal, serviceFee: 0, deliveryFee: 0, tip: 0, total: subtotal };
  }
  return {
    subtotal,
    serviceFee: SERVICE_FEE,
    deliveryFee,
    tip,
    total: subtotal + SERVICE_FEE + deliveryFee + tip,
  };
}
