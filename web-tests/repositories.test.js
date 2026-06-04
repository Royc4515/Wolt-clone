'use strict';

// SCRUM-184 — tests for the in-memory data layer.
// Covers three things, in order:
//   1. The generic `createRepository()` contract (CRUD + immutability +
//      idempotency + bad-id handling).
//   2. The four entity-specific singleton repositories actually export
//      working instances.
//   3. The service-layer orchestrators implement cascading deletes
//      correctly: restaurant → products cascade, user → orders does NOT.
//
// Uses only `node:test`, `node:assert/strict`, and `node:crypto` —
// no third-party dependencies.

const test = require('node:test');
const assert = require('node:assert/strict');

// Lazy require so module-load failures during Red phase don't abort the
// whole file. Each test fails independently before src/services/* exists.
function loadBase() {
  return require('../src/services/repositories/baseRepository');
}
function loadUsersRepo() {
  return require('../src/services/repositories/users.repository');
}
function loadRestaurantsRepo() {
  return require('../src/services/repositories/restaurants.repository');
}
function loadProductsRepo() {
  return require('../src/services/repositories/products.repository');
}
function loadOrdersRepo() {
  return require('../src/services/repositories/orders.repository');
}
function loadRestaurantsService() {
  return require('../src/services/restaurants.service');
}
function loadUsersService() {
  return require('../src/services/users.service');
}

// v4 UUID per RFC 4122.
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ----- createRepository contract ----------------------------------------

test('create returns the entity with a generated UUID id', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const created = repo.create({ name: 'foo' });
  assert.equal(typeof created.id, 'string');
  assert.match(created.id, UUID_V4_RE);
  assert.equal(created.name, 'foo');
});

test('create ignores any id provided by the caller', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const created = repo.create({ id: 'caller-supplied', name: 'foo' });
  assert.notEqual(created.id, 'caller-supplied');
  assert.match(created.id, UUID_V4_RE);
});

test('findById returns the stored entity for a known id', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const created = repo.create({ name: 'foo' });
  const fetched = repo.findById(created.id);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.name, 'foo');
});

test('findById returns undefined for an unknown id', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  assert.equal(repo.findById('does-not-exist'), undefined);
});

test('findAll returns a snapshot; mutating it does not affect the store', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  repo.create({ name: 'a' });
  repo.create({ name: 'b' });
  const snapshot = repo.findAll();
  assert.equal(snapshot.length, 2);
  snapshot.length = 0;
  assert.equal(repo.findAll().length, 2);
});

test('findBy returns only entities matching the predicate', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  repo.create({ name: 'pizza', restaurantId: 'r1' });
  repo.create({ name: 'sushi', restaurantId: 'r2' });
  repo.create({ name: 'burger', restaurantId: 'r1' });
  const r1Items = repo.findBy((e) => e.restaurantId === 'r1');
  assert.equal(r1Items.length, 2);
  assert.ok(r1Items.every((e) => e.restaurantId === 'r1'));
});

test('findBy returns an empty array when nothing matches', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  repo.create({ name: 'pizza' });
  const result = repo.findBy((e) => e.name === 'nope');
  assert.deepEqual(result, []);
});

test('update shallow-merges the patch and returns the updated entity', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const created = repo.create({ name: 'foo', address: 'A' });
  const updated = repo.update(created.id, { address: 'B' });
  assert.equal(updated.id, created.id);
  assert.equal(updated.name, 'foo');
  assert.equal(updated.address, 'B');
  // Repository reflects the merged state.
  assert.equal(repo.findById(created.id).address, 'B');
});

test('update rejects any attempt to change id', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const created = repo.create({ name: 'foo' });
  const updated = repo.update(created.id, { id: 'hacker', name: 'bar' });
  assert.equal(updated.id, created.id, 'id must remain immutable');
  assert.equal(updated.name, 'bar');
  assert.equal(repo.findById('hacker'), undefined);
});

test('update on an unknown id returns null (no throw, no insert)', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const result = repo.update('does-not-exist', { name: 'x' });
  assert.equal(result, null);
  assert.equal(repo.findAll().length, 0);
});

test('remove on existing id returns true and clears the entity', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const created = repo.create({ name: 'foo' });
  assert.equal(repo.remove(created.id), true);
  assert.equal(repo.findById(created.id), undefined);
});

test('remove on unknown id returns false and does not throw', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  repo.create({ name: 'foo' });
  assert.equal(repo.remove('does-not-exist'), false);
  assert.equal(repo.findAll().length, 1);
});

test('remove is idempotent — second call returns false safely', () => {
  const { createRepository } = loadBase();
  const repo = createRepository();
  const created = repo.create({ name: 'foo' });
  assert.equal(repo.remove(created.id), true);
  assert.equal(repo.remove(created.id), false);
  assert.equal(repo.findById(created.id), undefined);
});

// ----- Specific repository singletons -----------------------------------

test('users.repository exports a repository instance', () => {
  const repo = loadUsersRepo();
  assert.equal(typeof repo.create, 'function');
  assert.equal(typeof repo.findById, 'function');
  assert.equal(typeof repo.remove, 'function');
});

test('restaurants/products/orders repositories export instances', () => {
  assert.equal(typeof loadRestaurantsRepo().create, 'function');
  assert.equal(typeof loadProductsRepo().create, 'function');
  assert.equal(typeof loadOrdersRepo().create, 'function');
});

// ----- Cascade behavior at the service layer ----------------------------

test('restaurantsService.remove cascades to all products of that restaurant', () => {
  const restaurantsRepo = loadRestaurantsRepo();
  const productsRepo = loadProductsRepo();
  const service = loadRestaurantsService();

  const restaurant = restaurantsRepo.create({ name: 'Burger Place' });
  const otherRestaurant = restaurantsRepo.create({ name: 'Sushi Master' });
  const p1 = productsRepo.create({ name: 'Cheeseburger', restaurantId: restaurant.id });
  const p2 = productsRepo.create({ name: 'Fries', restaurantId: restaurant.id });
  const p3 = productsRepo.create({ name: 'Salmon Roll', restaurantId: otherRestaurant.id });

  const removed = service.remove(restaurant.id);
  assert.equal(removed, true);

  assert.equal(restaurantsRepo.findById(restaurant.id), undefined);
  assert.equal(productsRepo.findById(p1.id), undefined);
  assert.equal(productsRepo.findById(p2.id), undefined);
  // Other restaurant's product survives.
  assert.equal(productsRepo.findById(p3.id).name, 'Salmon Roll');

  // Cleanup so other tests start from a known state.
  restaurantsRepo.remove(otherRestaurant.id);
  productsRepo.remove(p3.id);
});

test('usersService.remove does NOT cascade to orders (orders are history)', () => {
  const usersRepo = loadUsersRepo();
  const ordersRepo = loadOrdersRepo();
  const service = loadUsersService();

  const user = usersRepo.create({ name: 'Alice' });
  const order1 = ordersRepo.create({ userId: user.id, total: 50 });
  const order2 = ordersRepo.create({ userId: user.id, total: 30 });
  const otherUserOrder = ordersRepo.create({ userId: 'other-user', total: 10 });

  const removed = service.remove(user.id);
  assert.equal(removed, true);
  assert.equal(usersRepo.findById(user.id), undefined);

  // Orders persist by design — they are historical records.
  assert.equal(ordersRepo.findById(order1.id).total, 50);
  assert.equal(ordersRepo.findById(order2.id).total, 30);
  assert.equal(ordersRepo.findById(otherUserOrder.id).total, 10);

  // Cleanup.
  ordersRepo.remove(order1.id);
  ordersRepo.remove(order2.id);
  ordersRepo.remove(otherUserOrder.id);
});

test('restaurantsService.remove on a restaurant with zero products succeeds', () => {
  const restaurantsRepo = loadRestaurantsRepo();
  const productsRepo = loadProductsRepo();
  const service = loadRestaurantsService();

  const restaurant = restaurantsRepo.create({ name: 'Empty Diner' });
  const productsBefore = productsRepo.findAll().length;

  const removed = service.remove(restaurant.id);
  assert.equal(removed, true);
  assert.equal(restaurantsRepo.findById(restaurant.id), undefined);
  assert.equal(productsRepo.findAll().length, productsBefore,
    'products store must be untouched when restaurant has no products');
});

test('restaurantsService.remove on unknown id returns false and mutates nothing', () => {
  const productsRepo = loadProductsRepo();
  const service = loadRestaurantsService();

  // Snapshot products state before.
  const before = JSON.stringify(productsRepo.findAll());

  const removed = service.remove('definitely-not-a-real-restaurant-id');
  assert.equal(removed, false);

  const after = JSON.stringify(productsRepo.findAll());
  assert.equal(after, before, 'productsRepo must be byte-identical after a no-op remove');
});
