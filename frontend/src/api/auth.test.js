import { login, logout } from './auth';
import { apiFetch } from './api';

// Only the network layer is mocked; cartStorage + utils/auth run for real so we
// exercise the actual login -> adoptGuestCarts wiring and key scoping.
jest.mock('./api');

// A structurally-valid JWT whose payload decodes to user id 'u1'.
const FAKE_JWT = `x.${btoa(JSON.stringify({ id: 'u1' }))}.y`;
const CART = [{ item: { id: 'i1', name: 'Pita', price: 10, maxQty: 5 }, qty: 1 }];

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('logout', () => {
  test("removes the token but keeps the user's saved carts", () => {
    localStorage.setItem('jwt_token', FAKE_JWT);
    localStorage.setItem('cart_u1_1', JSON.stringify(CART));

    logout();

    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(localStorage.getItem('cart_u1_1')).not.toBeNull();
  });
});

describe('login', () => {
  test('saves the token and adopts the guest cart into the user scope', async () => {
    localStorage.setItem('cart_guest_1', JSON.stringify(CART));
    apiFetch.mockResolvedValue({ token: FAKE_JWT });

    await login('user', 'pass');

    expect(localStorage.getItem('jwt_token')).toBe(FAKE_JWT);
    expect(localStorage.getItem('cart_guest_1')).toBeNull();
    expect(JSON.parse(localStorage.getItem('cart_u1_1'))).toEqual(CART);
  });

  test('does not store a token when the server returns none', async () => {
    apiFetch.mockResolvedValue({});
    await login('user', 'pass');
    expect(localStorage.getItem('jwt_token')).toBeNull();
  });

  test('the same user still has their cart after logout then login again', async () => {
    apiFetch.mockResolvedValue({ token: FAKE_JWT });

    // First session: log in and save a cart under the user scope.
    await login('user', 'pass');
    localStorage.setItem('cart_u1_1', JSON.stringify(CART));

    logout();
    expect(localStorage.getItem('jwt_token')).toBeNull();

    // Second session: logging back in must not have lost the cart.
    await login('user', 'pass');
    expect(JSON.parse(localStorage.getItem('cart_u1_1'))).toEqual(CART);
  });
});
