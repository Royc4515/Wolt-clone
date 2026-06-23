// Shared access to the shopping cart persisted in localStorage.
//
// Carts are namespaced by the *current user's id* (or 'guest' when nobody is
// logged in): keys look like `cart_<scope>_<restaurantId>`. This lets a cart
// survive logout/login for the same user and never leak to a different user on
// the same browser. A guest's in-progress cart is merged into the user's scope
// on login via adoptGuestCarts(). Cart entries have the shape { item, qty } —
// matching the useCart hook.

import { getCurrentUser } from './auth';

const CART_PREFIX = 'cart_';
const GUEST_SCOPE = 'guest';

// The scope segment for whoever is currently authenticated (or 'guest').
// Assumes a real user id is never the literal 'guest' (server ids are numeric/
// UUID), so logged-in scopes can't collide with the anonymous guest scope.
function currentScope() {
  return getCurrentUser()?.id ?? GUEST_SCOPE;
}

const scopePrefix = (scope) => `${CART_PREFIX}${scope}_`;

// Prefix shared by all of the current scope's cart keys, e.g. "cart_u1_".
// Scanners (cart-count badge, active-carts list) use this to stay scoped.
export function cartScopePrefix() {
  return scopePrefix(currentScope());
}

export const cartKey = (restaurantId) => `${cartScopePrefix()}${restaurantId}`;

// Parse a cart out of localStorage by full key. Always returns an array.
function parseCartAt(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Read the saved cart for a restaurant (current scope). Never throws.
export function readCart(restaurantId) {
  return parseCartAt(cartKey(restaurantId));
}

// Persist a cart (current scope). An empty cart removes the key entirely.
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

// Merge two carts by item id, summing quantities (capped at each item's maxQty).
// Returns fresh entry/item objects so neither input array is mutated.
function mergeCarts(base, incoming) {
  const byId = new Map(base.map(e => [e.item.id, { ...e, item: { ...e.item } }]));
  for (const entry of incoming) {
    const existing = byId.get(entry.item.id);
    if (existing) {
      const cap = existing.item.maxQty ?? Infinity;
      existing.qty = Math.min(existing.qty + entry.qty, cap);
    } else {
      byId.set(entry.item.id, { ...entry, item: { ...entry.item } });
    }
  }
  return [...byId.values()];
}

// On login, fold any guest carts into the now-authenticated user's scope
// (merging with anything already saved there), then drop the guest carts.
// No-op when called while not logged in.
export function adoptGuestCarts() {
  const userScope = currentScope();
  if (userScope === GUEST_SCOPE) return;

  const guestPrefix = scopePrefix(GUEST_SCOPE);
  const guestKeys = Object.keys(localStorage).filter(k => k.startsWith(guestPrefix));

  for (const guestKey of guestKeys) {
    const restaurantId = guestKey.slice(guestPrefix.length);
    const guestItems = parseCartAt(guestKey);
    localStorage.removeItem(guestKey);
    if (guestItems.length === 0) continue;

    const userKey = `${scopePrefix(userScope)}${restaurantId}`;
    const merged = mergeCarts(parseCartAt(userKey), guestItems);
    if (merged.length === 0) localStorage.removeItem(userKey);
    else localStorage.setItem(userKey, JSON.stringify(merged));
  }
}
