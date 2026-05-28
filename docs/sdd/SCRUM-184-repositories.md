# SCRUM-184 — In-Memory Volatile Repositories

## 1. Purpose

Build the data-access layer for the Ex3 web server: a volatile in-memory
store that backs every entity (users, restaurants, products, orders).
Subsequent feature tickets read and write through this layer rather than
holding mock arrays inside controllers.

Blocked by SCRUM-183 (which establishes the directory layout this ticket
fills). Blocks the per-entity migration tickets and the new-feature
tickets for products/orders/search.

## 2. Architectural Placement

Repositories are the **Data Access Layer** — distinct from `models/`
(schema + validation) and from `services/` (business logic). They live
under `src/services/repositories/` because they are infrastructure that
services consume; they never touch `req`/`res`.

```
src/
  controllers/                       HTTP adapters
  services/
    repositories/                    ← THIS TICKET
      baseRepository.js              generic factory (createRepository)
      users.repository.js            singleton instance for users
      restaurants.repository.js      singleton instance for restaurants
      products.repository.js         singleton instance for products
      orders.repository.js           singleton instance for orders
    users.service.js                 (future ticket) orchestrates repos + model
    restaurants.service.js           (future ticket)
    ...
  models/
    baseModel.js                     validate / create (from SCRUM-183)
    users.model.js                   (future ticket) schema + required fields
    ...
```

### Why a separate `repositories/` subdirectory under `services/`?

- Services orchestrate business logic; repositories only persist/retrieve.
  Putting them in the same flat directory mixes responsibilities.
- A future swap to MongoDB (Ex4+) becomes a one-folder refactor: replace
  `repositories/` implementations, services and models untouched.
- Tests can import repositories in isolation without dragging service
  logic in.

## 3. Generic Repository API

`src/services/repositories/baseRepository.js` exports a single function:

```js
function createRepository() { ... }
```

Calling `createRepository()` returns an object with the following
contract. All methods operate on a private `Map` keyed by entity id.

| Method | Signature | Returns | Notes |
|---|---|---|---|
| `findAll` | `() => Entity[]` | array of all entities | snapshot copy; mutating the returned array does not affect the store |
| `findById` | `(id: string) => Entity \| undefined` | entity or `undefined` | no throw on missing id |
| `findBy` | `(predicate: (e: Entity) => boolean) => Entity[]` | filtered array | used for relational lookups and `/api/search` |
| `create` | `(data: object) => Entity` | created entity with injected `id` | generates `id` via `crypto.randomUUID()`; `data.id` if provided is ignored |
| `update` | `(id, patch: object) => Entity \| null` | updated entity or `null` | shallow merge; `id` is immutable; returns `null` if id not found |
| `remove` | `(id: string) => boolean` | `true` if removed, `false` if id not found | repositories never cascade — see §5 |

### Contract guarantees

1. **Entities are plain objects.** No classes, no prototypes — keeps JSON
   serialization trivial.
2. **`id` is always present, always a v4 UUID, always immutable.** `update`
   silently drops `id` from the patch.
3. **No validation. Validation is the model's job, not the repository's.**
   The repository trusts its caller. Required-field checks, type checks,
   and business invariants are performed by the model (via
   `baseModel.validate` and per-entity validators) before the service
   calls the repo. Concretely, if `create` is called with `null`, a
   non-object, an array, or with missing required fields, **behavior is
   undefined** — the repo will happily store whatever it receives. Pushing
   validation into the repo would duplicate it across data-access
   implementations (in-memory now, MongoDB later) and violate SRP.
4. **No I/O, no side effects beyond the in-memory store.** Restarting the
   server wipes all state — matches Ex3.pdf §"שמירת מידע".

## 4. ID Generation

All ids come from `require('node:crypto').randomUUID()`. This matches the
example responses in Ex3.pdf (e.g. `ffc76e45-2353-4265-9e6a-29760a01f408`)
and the convention already used by `baseModel.create` from SCRUM-183.

## 5. Cascading Deletes — Service-Layer Orchestration

Repositories themselves never cascade. They handle one collection each
(Single Responsibility). Cascade rules are **business decisions** and
therefore live in the service layer.

### 5.1 Restaurant deletion cascades to Products

```js
// src/services/restaurants.service.js  (future ticket)
function remove(id) {
  const products = productsRepo.findBy(p => p.restaurantId === id);
  for (const product of products) productsRepo.remove(product.id);
  return restaurantsRepo.remove(id);
}
```

**Why:** A product cannot exist without its restaurant; orphan products
are an invalid state (Ex3 menu endpoints are nested under
`/api/restaurants/:id/products/:pId`).

### 5.2 User deletion does NOT cascade to Orders

```js
// src/services/users.service.js  (future ticket)
function remove(id) {
  return usersRepo.remove(id);
  // Orders remain in ordersRepo by design.
}
```

**Why:** Orders are historical financial records. Deleting a user
account must not retroactively delete the merchant's transaction history.
Real-world e-commerce systems treat orders as immutable once placed.

### 5.3 Transactional limitation of an in-memory store

`Map.delete()` is synchronous and cannot reject; the JavaScript event loop
is single-threaded; and every cascade in this codebase executes inside a
single sync tick. In practice, partial-state failure modes that haunt
relational databases (process killed mid-commit, network partition,
etc.) do not exist here. **However**, two patterns make the service-layer
orchestrator robust enough that the same logic survives the future
MongoDB migration unchanged:

**Pattern A — Collect-then-Execute.** Decision phase reads only; mutation
phase reads nothing. If the decision phase throws, no mutation has
happened yet.

```js
function remove(id) {
  // Phase 1 — collect (read-only). If this throws, nothing mutated.
  const restaurant = restaurantsRepo.findById(id);
  if (!restaurant) return false;
  const productsToRemove = productsRepo.findBy(p => p.restaurantId === id);

  // Phase 2 — execute (mutations only, no further decisions).
  for (const product of productsToRemove) productsRepo.remove(product.id);
  return restaurantsRepo.remove(id);
}
```

**Pattern B — Idempotency.** Every `remove` is safe to retry. Calling
`restaurantsService.remove(id)` twice on the same id returns `false` the
second time and changes nothing. If a future retry-after-failure handler
ever exists, it cannot double-delete by accident.

When Ex4 introduces a real persistence layer, wrap Phase 2 in a
`session.withTransaction(...)` block — the surrounding logic and tests
need no changes.

### 5.4 Other relationships (out of scope here, documented for clarity)

| If we delete… | Then… | Why |
|---|---|---|
| A restaurant | Delete all its products | Products require a restaurant |
| A user | Keep their orders | Orders are history |
| A product | Keep orders that reference it (no order edit) | Orders are immutable history |
| An order | Standalone delete (no cascade) | Orders own no children |

## 6. Concrete Repositories

Each is a singleton instance — module load returns the same `Map`-backed
object on every `require`. This is the in-memory equivalent of a
"connection pool":

```js
// src/services/repositories/users.repository.js
'use strict';
const { createRepository } = require('./baseRepository');
module.exports = createRepository();
```

The same one-liner repeats for `restaurants.repository.js`,
`products.repository.js`, `orders.repository.js`. No per-entity logic
lives here — that's the model's and service's job.

## 7. Acceptance Criteria (from JIRA)

1. `repo.create(data)` returns the created entity with a valid **v4 UUID**
   injected as `id`. Asserted by unit test.
2. `repo.remove(id)` deletes the entity, and a subsequent
   `repo.findById(id)` returns `undefined`. Asserted by unit test.
3. Deleting a restaurant via `restaurantsService.remove(id)` removes the
   restaurant **and** every product whose `restaurantId` matched the
   removed restaurant's id. Asserted by unit test (this is the cascade
   test).
4. Deleting a user via `usersService.remove(id)` removes the user but
   leaves any orders with that user's `userId` intact in
   `ordersRepository`. Asserted by unit test (negative cascade).
5. `repo.findById(<unknown-id>)` returns `undefined` (does not throw).
6. `repo.update(<unknown-id>, patch)` returns `null` (does not throw,
   does not create).
7. `repo.update(id, { id: 'something-else', ...patch })` ignores the
   incoming `id` — the entity's id is immutable.
8. `findBy(predicate)` returns only entities matching the predicate.
9. `remove(id)` is idempotent: calling it twice on the same id returns
   `true` then `false`, and the repo is in a consistent state both times.
10. `restaurantsService.remove(id)` on a restaurant with **zero** products
    succeeds (returns `true`) and leaves `productsRepo` untouched —
    guards against off-by-one bugs in the cascade loop.
11. `restaurantsService.remove(<unknown-id>)` returns `false` and performs
    zero mutations on `productsRepo` (verified by deep-equal snapshot
    before/after).
12. The whole suite (existing + new) passes under `node --test` on Linux
    (verified inside the existing Dockerfile).

## 8. Test Plan

Tests live in `test/repositories.test.js` (new file) using only
`node:test` and `node:assert/strict` — no third-party deps.

Test groups:

- **`createRepository` contract** (10 tests):
  1. `create` returns the entity with a generated UUID injected as `id`.
  2. `create` ignores any `id` provided by the caller (id is repo-assigned).
  3. `findById(existing)` returns the same object reference structurally.
  4. `findById(unknown)` returns `undefined` without throwing.
  5. `findAll` returns a snapshot array; mutating it does not corrupt the store.
  6. `findBy(predicate)` returns only matching entities; empty match returns `[]`.
  7. `update(existing, patch)` shallow-merges and returns the new entity.
  8. `update` rejects any attempt to change `id` (id stays immutable).
  9. `update(unknown, patch)` returns `null` without throwing or inserting.
  10. `remove(existing)` returns `true`; subsequent `findById` returns `undefined`.
  11. `remove(unknown)` returns `false` without throwing or affecting state.
  12. **Idempotency:** calling `remove(id)` twice on the same id returns
      `true` then `false`, with the store in a consistent state after both
      calls. This protects against double-execution under future
      retry-after-failure handlers.

- **Cascade behavior — service-layer orchestrator** (4 tests):
  1. **Positive cascade.** `restaurantsService.remove(id)` removes the
     restaurant **and** every product whose `restaurantId` matched.
  2. **Negative cascade.** `usersService.remove(id)` removes the user but
     leaves all orders with that `userId` intact in `ordersRepo`.
  3. **Zero-cascade edge case.** Removing a restaurant with no products
     succeeds (returns `true`), leaves `productsRepo` untouched, and does
     not throw. Guards against off-by-one assumptions in the loop.
  4. **No-side-effects on unknown id.** `restaurantsService.remove(<unknown-id>)`
     returns `false`, performs zero `productsRepo.remove` calls, and the
     full product store is byte-identical (deep-equal) before and after.

- **UUID format** (1 test): the generated `id` matches the v4 regex
  `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`.

## 9. Out of Scope

- File-system persistence or external DB (MongoDB lands in Ex4).
- Wiring repositories into existing endpoints (each entity migration is
  its own ticket — see SCRUM-183 §7).
- Controller-level changes — no `req`/`res` touched in this ticket.
- Concurrency / locking — single-process Node is single-threaded for JS;
  no race condition between Map mutations.
- Schema/validation logic — lives in `models/` (separate per-entity
  tickets).
- Service-layer orchestrators beyond what's needed to demonstrate the
  cascade behavior in tests. Full service files (`users.service.js`,
  etc.) ship with their per-entity migration tickets.
- **Real password storage or hashing.** Ex3.pdf §"אבטחה" explicitly
  forbids storing real passwords, credit cards, or any sensitive data:
  *"אין לאחסן (או לשלוח) מידע חשוב כמו סיסמאות אמיתיות או כרטיסי אשראי
  אל השרת או בשרת או בשום מקום."* `users.repository` will store the
  mock `password` field as a plain string for the duration of Ex3; bcrypt
  / argon2 / any real credential handling belongs to Ex4+ and is out of
  scope for this data layer.

## 10. Workflow

1. **SDD** (this document) → Dana reviews.
2. **Red phase** — write `test/repositories.test.js` with all expected
   assertions; verify failures. → Dana reviews.
3. **Green phase** — implement `baseRepository.js`, 4 specific
   repositories, and minimal cascade orchestrators sufficient to pass
   the cascade tests. → Dana reviews.
4. **PR** opened against `main` → Dana approves → merge.

## 11. Follow-up Tickets This Unlocks

- **Refactor Users to layered MVC** — wire `usersRepo` into
  `services/users.service.js`, replace the `"user-12345"` constant with
  `usersRepo.create(...)`-generated UUIDs.
- **Refactor Restaurants to layered MVC** — same pattern, plus replace
  the `mockRestaurants` array.
- **Refactor Tokens to layered MVC**.
- **Products CRUD** (Restaurant menu).
- **Orders CRUD**.
- **Search** — uses `findBy(predicate)` across restaurants and products.

## 12. References

- Ex3.pdf §"שמירת מידע" — mandates in-memory volatile storage.
- Ex3.pdf example responses showing UUID format.
- SCRUM-183 SDD (`docs/sdd/SCRUM-183-mvc-layout.md`) — defines the
  directory layout this ticket fills.
- Repository pattern (Eric Evans, *Domain-Driven Design*).
- Single Responsibility Principle — repos manage one collection each;
  cascades belong to services.
