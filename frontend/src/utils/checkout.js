// Fee model for the checkout page. These mirror the server's calculation
// (src/controllers/orders.controller.js + src/services/distance.js) so the
// live summary matches what the server will actually charge. The server is
// the source of truth — the order it returns carries the authoritative
// `pricing` object, which we use for the final receipt.

export const SERVICE_FEE = 2.0; // matches the server's SERVICE_FEE

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

const round2 = (n) => Number(n.toFixed(2));

// Aerial distance in km (Haversine) — identical to the server's distance.js.
export function calcAerialDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Real delivery fee for a restaurant given the user's location: base fee +
// ₪2/km (Haversine). Falls back to the base fee when either location is
// missing. Mirrors the server so cards, the info bar and checkout all agree.
export function realDeliveryFee(restaurant, userLocation) {
  let km = 0;
  if (restaurant?.location && userLocation) {
    km = calcAerialDistance(
      restaurant.location.lat,
      restaurant.location.lng,
      userLocation.lat,
      userLocation.lng
    );
  }
  return round2((restaurant?.deliveryFee ?? 0) + km * 2);
}

// Mirror of the server pricing. Service fee always applies. Delivery adds the
// distance-based fee; pickup has no delivery fee. This is an estimate for the
// summary — the server recomputes the authoritative pricing on order.
export function computeTotals({ subtotal, tip = 0, mode = 'delivery', restaurant, userLocation }) {
  const serviceFee = SERVICE_FEE;
  const safeTip = typeof tip === 'number' ? tip : 0;

  if (mode === 'pickup') {
    return {
      subtotal,
      serviceFee,
      deliveryFee: 0,
      tip: safeTip,
      total: round2(subtotal + serviceFee + safeTip),
    };
  }

  const deliveryFee = realDeliveryFee(restaurant, userLocation);

  return {
    subtotal,
    serviceFee,
    deliveryFee,
    tip: safeTip,
    total: round2(subtotal + serviceFee + deliveryFee + safeTip),
  };
}
