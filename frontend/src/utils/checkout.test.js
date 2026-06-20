import { computeTotals, calcAerialDistance, money, paymentLabel, SERVICE_FEE } from './checkout';

const REST = { deliveryFee: 9, location: { lat: 32.0, lng: 34.0 } };
const USER = { lat: 32.0, lng: 34.0 }; // same point → distance 0

describe('checkout — money', () => {
  test('formats with two decimals and shekel sign', () => {
    expect(money(110)).toBe('₪110.00');
    expect(money(5.9)).toBe('₪5.90');
    expect(money()).toBe('₪0.00');
  });
});

describe('checkout — paymentLabel', () => {
  test('maps known ids to labels', () => {
    expect(paymentLabel('cash')).toBe('Cash');
  });
  test('falls back for unknown ids', () => {
    expect(paymentLabel('xxx')).toBe('Card');
  });
});

describe('checkout — calcAerialDistance', () => {
  test('is zero for the same point', () => {
    expect(calcAerialDistance(32, 34, 32, 34)).toBe(0);
  });
  test('is positive for different points', () => {
    expect(calcAerialDistance(32, 34, 32.1, 34)).toBeGreaterThan(0);
  });
});

describe('checkout — computeTotals (delivery)', () => {
  test('service fee is ₪2 and applies on top of subtotal + delivery + tip', () => {
    const t = computeTotals({ subtotal: 110, tip: 10, mode: 'delivery', restaurant: REST, userLocation: USER });
    expect(t.serviceFee).toBe(SERVICE_FEE);
    expect(SERVICE_FEE).toBe(2);
    // distance 0 → deliveryFee = base (9) + 0
    expect(t.deliveryFee).toBe(9);
    expect(t.tip).toBe(10);
    expect(t.total).toBeCloseTo(110 + 2 + 9 + 10);
  });

  test('delivery fee grows with distance (₪2 per km)', () => {
    const near = computeTotals({ subtotal: 100, mode: 'delivery', restaurant: REST, userLocation: USER });
    const far = computeTotals({
      subtotal: 100,
      mode: 'delivery',
      restaurant: REST,
      userLocation: { lat: 32.2, lng: 34.0 },
    });
    expect(far.deliveryFee).toBeGreaterThan(near.deliveryFee);
  });

  test('falls back to base delivery fee when no user location', () => {
    const t = computeTotals({ subtotal: 100, mode: 'delivery', restaurant: REST, userLocation: null });
    expect(t.deliveryFee).toBe(9);
  });
});

describe('checkout — computeTotals (pickup)', () => {
  test('keeps the service fee but has no delivery fee', () => {
    const t = computeTotals({ subtotal: 110, tip: 10, mode: 'pickup', restaurant: REST, userLocation: USER });
    expect(t.serviceFee).toBe(SERVICE_FEE);
    expect(t.deliveryFee).toBe(0);
    // total = subtotal + service fee + tip
    expect(t.total).toBeCloseTo(110 + 2 + 10);
  });
});
