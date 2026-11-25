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

// restaurantsService persists through the Mongoose models (SCRUM-416/417),
// so these tests stub the model statics it calls with a small in-memory
// store via node:test's `t.mock`. No database connection is needed, and the
// real service code runs unchanged.
function mockRestaurantModels(t, { restaurants = [], products = [] } = {}) {
  const Restaurant = require('../src/models/Restaurant');
  const Product = require('../src/models/Product');
  const store = {
    restaurants: new Map(restaurants.map((r) => [r.id, { ...r }])),
    products: new Map(products.map((p) => [p.id, { ...p }])),
  };

  t.mock.method(Restaurant, 'findById', async (id) => store.restaurants.get(id) || null);
  t.mock.method(Restaurant, 'findByIdAndDelete', async (id) => {
    const doc = store.restaurants.get(id) || null;
    store.restaurants.delete(id);
    return doc;
  });
  t.mock.method(Product, 'deleteMany', async ({ restaurantId }) => {
    let deletedCount = 0;
    for (const [id, p] of store.products) {
      if (p.restaurantId === restaurantId) {
        store.products.delete(id);
        deletedCount += 1;
      }
    }
    return { deletedCount };
  });

  return store;
}

test('restaurantsService.remove cascades to all products of that restaurant', async (t) => {
  const store = mockRestaurantModels(t, {
    restaurants: [
      { id: 'r1', name: 'Burger Place' },
      { id: 'r2', name: 'Sushi Master' },
    ],
    products: [
      { id: 'p1', name: 'Cheeseburger', restaurantId: 'r1' },
      { id: 'p2', name: 'Fries', restaurantId: 'r1' },
      { id: 'p3', name: 'Salmon Roll', restaurantId: 'r2' },
    ],
  });
  const service = loadRestaurantsService();

  const removed = await service.remove('r1');
  assert.equal(removed, true);

  assert.equal(store.restaurants.has('r1'), false);
  assert.equal(store.products.has('p1'), false);
  assert.equal(store.products.has('p2'), false);
  // Other restaurant and its product survive.
  assert.equal(store.restaurants.get('r2').name, 'Sushi Master');
  assert.equal(store.products.get('p3').name, 'Salmon Roll');
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

test('restaurantsService.remove on a restaurant with zero products succeeds', async (t) => {
  const store = mockRestaurantModels(t, {
    restaurants: [{ id: 'r-empty', name: 'Empty Diner' }],
    products: [{ id: 'p-other', name: 'Salad', restaurantId: 'r-other' }],
  });
  const service = loadRestaurantsService();
  const productsBefore = store.products.size;

  const removed = await service.remove('r-empty');
  assert.equal(removed, true);
  assert.equal(store.restaurants.has('r-empty'), false);
  assert.equal(store.products.size, productsBefore,
    'products store must be untouched when restaurant has no products');
});

test('restaurantsService.remove on unknown id returns false and mutates nothing', async (t) => {
  const store = mockRestaurantModels(t, {
    restaurants: [{ id: 'r1', name: 'Burger Place' }],
    products: [{ id: 'p1', name: 'Cheeseburger', restaurantId: 'r1' }],
  });
  const Product = require('../src/models/Product');
  const service = loadRestaurantsService();

  const before = JSON.stringify([...store.restaurants, ...store.products]);

  const removed = await service.remove('definitely-not-a-real-restaurant-id');
  assert.equal(removed, false);

  const after = JSON.stringify([...store.restaurants, ...store.products]);
  assert.equal(after, before, 'stores must be identical after a no-op remove');
  assert.equal(Product.deleteMany.mock.callCount(), 0,
    'no product delete may be issued for an unknown restaurant');
});
