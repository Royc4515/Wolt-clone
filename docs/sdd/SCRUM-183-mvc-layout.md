# SCRUM-183 — MVC Directory & File Structuring

## 1. Purpose

Lock in the directory layout and dependency direction for the Ex3 Node.js +
Express web server. This ticket establishes the scaffolding only; no business
logic is added. Subsequent tickets fill in features by adding files to the
buckets defined here — they do not re-shape the layout.

## 2. Layered Layout (Node side)

```
src/
  routes/        HTTP surface. Express routers; declare paths + verbs.
  controllers/   HTTP adapters. Parse req, call services, shape res.
  services/      Use-cases / business logic. Orchestrate models + external clients.
  models/        Data shape + validation rules. In-memory stores live here for now.
  middleware/    Cross-cutting (json parser, notFound, errorHandler).
  config/        Env + constants.
  app.js         Wires middleware + mounts routes/index.js. Exports the app (no listen).
  server.js      Boots the app — the only file that calls .listen().
```

Existing C++/Python/CMake/Docker artifacts from Ex1/Ex2 remain untouched
(`src/Server/`, `src/Client/`, `src/Commands/`, `src/Logic/`, `src/Data/`,
`src/Archive/`, `src/main.cpp`, `CMakeLists.txt`, `Dockerfile.*`).

## 3. Dependency Rule (DIP)

Imports flow **inward only**:

```
routes  ─►  controllers  ─►  services  ─►  models
```

### Hard rules — enforced at code-review time

1. **No upward imports.** A model never imports a service. A service never
   imports a controller. A controller never imports a route. The inner layers
   know nothing about HTTP or Express.

2. **No sideways imports across siblings of the same layer** unless going
   through a shared abstraction. Example: `services/orders.service.js` does
   not `require('../services/users.service.js')`; if it needs user data, it
   talks to `models/users.model.js` (or a shared port).

3. **Express types stay in `routes/` and `controllers/`.** `req`/`res` must
   not appear inside `services/` or `models/`. Services receive plain data
   and return plain data (or throw typed errors).

4. **External clients (e.g., TCP client to the Ex2 server) live in the
   service layer.** Routes/controllers never open sockets directly; they
   call a service which encapsulates the external dependency.

5. **Validation lives in `models/`.** Controllers ask the model to validate;
   they do not re-implement field checks.

## 4. Migration Strategy: Additive Scaffolding (Strangler Fig)

The repo currently contains pre-layered implementations for some endpoints
(`POST /api/users`, `GET /api/users/:id`, `POST /api/tokens`,
`GET /api/restaurants`). These were written before this ticket existed; they
satisfy the external API contract but mix parsing, validation, business
logic, and storage inside their controllers.

This ticket **does not regress** any working endpoint. Instead, it builds
the new layered structure **alongside** the existing code (additive). Later
per-entity refactor tickets will migrate each existing endpoint into the
new layers without changing its external behavior — the response shape and
status codes stay identical; only the internal plumbing is reorganized.

This is the **Strangler Fig Pattern**: grow the new architecture around
the old code, then strangle the old code out one piece at a time. The
public API never goes down.

### What this ticket adds

- The four lowercase directories: `models/`, `services/`, `controllers/`,
  `routes/` (the last already exists; `controllers/` is renamed from
  `Controllers/` for Linux/Docker case-sensitivity).
- `controllers/genericController.js` exposing `notImplemented`, which
  returns `501 { error: "Not implemented" }`. Used as the temporary handler
  for routes whose business logic has not yet been built.
- `models/baseModel.js` exposing `validate(input, requiredFields)` returning
  `{ ok, errors }`, and `create(input, requiredFields)` for the standard
  "validate then assign id" path.
- Route files for the three not-yet-implemented entities: `products.routes.js`,
  `orders.routes.js`, `search.routes.js`. Each declares its real routes
  (`router.all('/', ...)`, `router.all('/:id', ...)`, etc.) and points them
  at `genericController.notImplemented`. **File names are final** — when
  a future ticket implements products, it will replace the handler reference,
  not rename the file.
- `routes/index.js` updated to mount the three new routers alongside the
  existing `users`, `restaurants`, and `tokens` routers (which continue to
  serve their existing implementations).
- `test/mvc.test.js` asserting (a) the validator contract on `baseModel`,
  and (b) that the three new entity surfaces return `501` for GET and POST.

### What this ticket does **not** touch

- Any handler logic in `controllers/users.controller.js` or
  `controllers/restaurants.controller.js`.
- The routing of `users`, `restaurants`, or `tokens` (these continue to
  return their real responses — `201/200/400/404` — through the existing
  implementations).
- Tests for existing endpoints (`test/app.test.js` continues to pass
  unchanged).

## 5. Acceptance Criteria

1. `src/models/`, `src/services/`, `src/controllers/` exist as lowercase
   directories.
2. `Controllers/` (uppercase) no longer exists; all imports reference the
   lowercase path.
3. `baseModel.validate({}, ['name'])` returns
   `{ ok: false, errors: [<at least one entry mentioning "name">] }`.
4. `baseModel.validate({ name: 'x' }, ['name'])` returns `{ ok: true }`.
5. `GET` and `POST` to `/api/products`, `/api/orders`, `/api/search` return
   HTTP `501` with body `{ "error": "Not implemented" }`.
6. `GET /api/restaurants`, `POST /api/users`, `POST /api/tokens`,
   `GET /api/users/:id` continue to return the **same** responses they
   returned before this ticket — no regression on Definition-of-Done work
   from prior sprints.
7. All tests (`node --test`) pass, including both `test/app.test.js`
   (existing) and `test/mvc.test.js` (new).
8. The app starts under Docker on Linux without `MODULE_NOT_FOUND` errors
   caused by case-sensitivity.

## 6. Out of Scope for SCRUM-183

- In-memory repository / persistence — SCRUM-184.
- Migration of existing endpoints into the layered structure — separate
  per-entity refactor tickets.
- TCP client to the Ex2 server — separate service-layer ticket.
- `x-user-id` header handling — separate ticket.
- README + run instructions — separate ticket.

## 7. Follow-up Tickets This Unlocks

- **SCRUM-184**: In-memory repository (`Map`-based, UUIDv4, cascading
  deletes at the data layer).
- **Refactor Users to Layered MVC**: Move parsing-only logic into
  `controllers/users.controller.js`, business logic into
  `services/users.service.js`, validation rules into
  `models/users.model.js`, replace `mockUserId` constant with
  `usersRepo.add(...)` returning a real UUID. External API behavior
  preserved.
- **Refactor Restaurants to Layered MVC**: Same pattern for restaurants.
- **Refactor Tokens to Layered MVC**: Same pattern for the login endpoint.

Each refactor ticket should `is blocked by` the corresponding new-feature
ticket in the same domain — e.g., the "products CRUD" ticket is blocked by
"Refactor Restaurants to Layered MVC", so the refactor lands first and
products is built on the clean foundation.

## 8. References

- Ex3.pdf §"הנחיות טכניות" — mandates MVC + SOLID + future-extensibility.
- Express routing & middleware conventions.
- Strangler Fig Pattern (Martin Fowler) — the strategy for non-regressive
  refactors of pre-existing implementations.
