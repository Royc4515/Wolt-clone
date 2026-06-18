import { computeTotals, money, paymentLabel, SERVICE_FEE } from './checkout';

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

describe('checkout — computeTotals (delivery)', () => {
  test('adds service fee, delivery fee and tip', () => {
    const t = computeTotals({ subtotal: 110, deliveryFee: 9, tip: 10, mode: 'delivery' });
    expect(t.serviceFee).toBe(SERVICE_FEE);
    expect(t.deliveryFee).toBe(9);
    expect(t.tip).toBe(10);
    expect(t.total).toBeCloseTo(110 + SERVICE_FEE + 9 + 10);
  });

  test('free delivery still charges the service fee', () => {
    const t = computeTotals({ subtotal: 110, deliveryFee: 0, mode: 'delivery' });
    expect(t.total).toBeCloseTo(110 + SERVICE_FEE);
  });
});

describe('checkout — computeTotals (pickup)', () => {
  test('drops service fee, delivery and tip', () => {
    const t = computeTotals({ subtotal: 110, deliveryFee: 9, tip: 10, mode: 'pickup' });
    expect(t.serviceFee).toBe(0);
    expect(t.deliveryFee).toBe(0);
    expect(t.tip).toBe(0);
    expect(t.total).toBe(110);
  });
});
