import { cartKey, cartScopePrefix, readCart, writeCart, clearCart, adoptGuestCarts } from './cartStorage';
import { getCurrentUser } from './auth';

jest.mock('./auth');

const CART = [
  { item: { id: 'i1', name: 'Garlic Bread', price: 24, maxQty: 5 }, qty: 2 },
  { item: { id: 'i2', name: 'Margherita', price: 62, maxQty: 5 }, qty: 1 },
];

const asUser = (id) => getCurrentUser.mockReturnValue({ id });
const asGuest = () => getCurrentUser.mockReturnValue(null);

beforeEach(asGuest);
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('cartStorage — scoped keys', () => {
  test('guest carts live under the guest scope', () => {
    expect(cartScopePrefix()).toBe('cart_guest_');
    expect(cartKey('42')).toBe('cart_guest_42');
  });

  test('logged-in carts are namespaced by user id', () => {
    asUser('u1');
    expect(cartScopePrefix()).toBe('cart_u1_');
    expect(cartKey('42')).toBe('cart_u1_42');
  });

  test('two users get different keys for the same restaurant', () => {
    asUser('u1');
    const a = cartKey('42');
    asUser('u2');
    const b = cartKey('42');
    expect(a).not.toBe(b);
  });
});

describe('cartStorage — read/write/clear (scoped)', () => {
  test('returns empty array when nothing is saved', () => {
    expect(readCart('1')).toEqual([]);
  });

  test('round-trips the saved cart for the current scope', () => {
    writeCart('1', CART);
    expect(JSON.parse(localStorage.getItem(cartKey('1')))).toEqual(CART);
    expect(readCart('1')).toEqual(CART);
  });

  test('returns empty array on malformed JSON', () => {
    localStorage.setItem(cartKey('1'), '{not json');
    expect(readCart('1')).toEqual([]);
  });

  test('writeCart with an empty array removes the key', () => {
    writeCart('1', CART);
    writeCart('1', []);
    expect(localStorage.getItem(cartKey('1'))).toBeNull();
  });

  test('clearCart removes the key', () => {
    writeCart('1', CART);
    clearCart('1');
    expect(localStorage.getItem(cartKey('1'))).toBeNull();
  });

  test('one user cannot read another user\'s cart', () => {
    asUser('u1');
    writeCart('1', CART);
    asUser('u2');
    expect(readCart('1')).toEqual([]);
  });
});

describe('cartStorage — adoptGuestCarts', () => {
  test('is a no-op while not logged in', () => {
    writeCart('1', CART); // guest scope
    adoptGuestCarts();
    expect(localStorage.getItem('cart_guest_1')).not.toBeNull();
  });

  test('moves a guest cart into the user scope on login', () => {
    writeCart('1', CART); // guest scope
    asUser('u1');
    adoptGuestCarts();
    expect(localStorage.getItem('cart_guest_1')).toBeNull();
    expect(readCart('1')).toEqual(CART);
  });

  test('moves multiple guest carts, merging only where the user already has one', () => {
    asUser('u1');
    writeCart('1', [{ item: { id: 'i1', name: 'A', price: 10, maxQty: 9 }, qty: 1 }]); // user has restaurant 1
    asGuest();
    writeCart('1', [{ item: { id: 'i1', name: 'A', price: 10, maxQty: 9 }, qty: 2 }]); // guest also has 1
    writeCart('2', CART);                                                              // guest-only restaurant 2
    asUser('u1');
    adoptGuestCarts();

    expect(readCart('1').find(e => e.item.id === 'i1').qty).toBe(3); // merged 1+2
    expect(readCart('2')).toEqual(CART);                            // moved as-is
    expect(localStorage.getItem('cart_guest_1')).toBeNull();
    expect(localStorage.getItem('cart_guest_2')).toBeNull();
  });

  test('cleans up an empty guest cart key without writing a user cart', () => {
    localStorage.setItem('cart_guest_1', JSON.stringify([])); // empty guest cart
    asUser('u1');
    adoptGuestCarts();
    expect(localStorage.getItem('cart_guest_1')).toBeNull();
    expect(localStorage.getItem('cart_u1_1')).toBeNull();
  });

  test('merges guest items into an existing user cart, summing capped quantities', () => {
    asUser('u1');
    writeCart('1', [{ item: { id: 'i1', name: 'Garlic Bread', price: 24, maxQty: 5 }, qty: 4 }]);
    asGuest();
    writeCart('1', [
      { item: { id: 'i1', name: 'Garlic Bread', price: 24, maxQty: 5 }, qty: 3 }, // 4+3=7, capped at 5
      { item: { id: 'i2', name: 'Margherita', price: 62, maxQty: 5 }, qty: 1 },   // new item
    ]);
    asUser('u1');
    adoptGuestCarts();

    const merged = readCart('1');
    expect(merged.find(e => e.item.id === 'i1').qty).toBe(5);
    expect(merged.find(e => e.item.id === 'i2').qty).toBe(1);
    expect(localStorage.getItem('cart_guest_1')).toBeNull();
  });
});
