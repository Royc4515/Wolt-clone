import { cartKey, readCart, writeCart, clearCart } from './cartStorage';

const CART = [
  { item: { id: 'i1', name: 'Garlic Bread', price: 24 }, qty: 2 },
  { item: { id: 'i2', name: 'Margherita', price: 62 }, qty: 1 },
];

afterEach(() => localStorage.clear());

describe('cartStorage — keys', () => {
  test('cartKey namespaces by restaurant id', () => {
    expect(cartKey('42')).toBe('cart_42');
  });
});

describe('cartStorage — read', () => {
  test('returns empty array when nothing is saved', () => {
    expect(readCart('1')).toEqual([]);
  });

  test('returns the saved cart', () => {
    localStorage.setItem('cart_1', JSON.stringify(CART));
    expect(readCart('1')).toEqual(CART);
  });

  test('returns empty array on malformed JSON', () => {
    localStorage.setItem('cart_1', '{not json');
    expect(readCart('1')).toEqual([]);
  });

  test('returns empty array when stored value is not an array', () => {
    localStorage.setItem('cart_1', JSON.stringify({ foo: 'bar' }));
    expect(readCart('1')).toEqual([]);
  });
});

describe('cartStorage — write & clear', () => {
  test('writeCart persists items', () => {
    writeCart('1', CART);
    expect(JSON.parse(localStorage.getItem('cart_1'))).toEqual(CART);
  });

  test('writeCart with empty array removes the key', () => {
    localStorage.setItem('cart_1', JSON.stringify(CART));
    writeCart('1', []);
    expect(localStorage.getItem('cart_1')).toBeNull();
  });

  test('clearCart removes the key', () => {
    localStorage.setItem('cart_1', JSON.stringify(CART));
    clearCart('1');
    expect(localStorage.getItem('cart_1')).toBeNull();
  });
});
