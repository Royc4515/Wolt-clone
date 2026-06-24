# Wolt-Clone — Ex4: Full-Stack Food-Delivery Web App

[![React](https://img.shields.io/badge/UI-React%2019-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/API-Node.js%20%E2%89%A518-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Server-Express-black.svg)](https://expressjs.com/)
[![nginx](https://img.shields.io/badge/Serve-nginx-009639.svg)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/Run-Docker%20Compose-blue.svg)](https://www.docker.com/)

A **Wolt-style food-delivery web application**. The UI is a **React single-page
app** that talks to our **Node.js + Express** server from Ex3, which in turn
bridges to the legacy **Ex2 C++ recommendation server** for personalized
recommendations. Everything runs together with a single **`docker compose up`**.

The React app shows **real data from the server** — restaurants, menus, orders,
search results and recommendations are all fetched over HTTP; nothing is
hard-coded in the client. Creating a restaurant, placing an order, registering a
user, etc. all go through the API.

> **Project history:** this app's backend is the **Ex3 Node/Express API server**
> (its sources are in `src/`, documented throughout this README) ·
> [Ex2 — C++ server + Python client](Ex2_README.md) ·
> [Ex1 — CLI recommender](Ex1_README.md).

---

## Team Members

| Name |
| :--- |
| **Dana Sela** |
| **Roy Carmelli** |

---

## Features

- **Authentication** — register & login with **client- and server-side
  validation**. On login the server returns a **JWT**, which the client attaches
  to every protected request (`Authorization: Bearer <token>`).
- **Protected pages** — checkout, profile, orders and the whole admin area are
  guarded by route guards on the client and JWT checks on the server; an
  unauthenticated visit redirects to the login screen.
- **Home screen** — nearby restaurants, promoted restaurants, and a
  **personalized "Recommended for you"** row (in-range restaurants ranked using
  the Ex2 C++ recommender), plus category filters.
- **Live search** — search restaurants and dishes from the top bar, with a
  dropdown and a full results page.
- **Restaurant page** — full menu grouped into sections, item modal, and an
  add-to-cart flow.
- **Cart & checkout** — a cart **persisted per user** across sessions, then a
  checkout that places a real order.
- **Orders** — view your past and current orders.
- **Profile** — view/update your profile (display name, picture, location).
- **Dark / light theme** — a toggle in the top bar switches the whole app's
  theme (see screenshots).
- **Admin area** — users with the `admin` role can create/edit restaurants,
  manage menus, and view/update the orders for their restaurants.

---

## Architecture

The app runs as **three containers** on a private Docker network. Only the
frontend is published to your machine — it is the **single entry point**, and it
reverse-proxies API and image traffic to the backend internally.

```text
                       ┌─────────────────────────── host ───────────────────────────┐
  browser ──:3000────► │  frontend  (nginx)                                          │
                       │     ├─ /            → React static bundle (HTML/CSS/JS)      │
                       │     ├─ /api/...      → proxies to  web:3000                  │
                       │     └─ /images/...   → proxies to  web:3000                  │
                       │                                   │                          │
                       │  web  (Node.js + Express API) ◄───┘   internal :3000         │
                       │     └─ TCP bridge ────────────────┐                          │
                       │                                   ▼                          │
                       │  ex2-server  (C++ recommender)   internal :8080 (TCP)        │
                       └─────────────────────────────────────────────────────────────┘
```

| Container | Role | Listens (internal) | Published to host |
| :--- | :--- | :---: | :---: |
| `frontend` | React build served by **nginx** (single entry point) | `80` | **`3000` → `80`** |
| `web` | **Node.js + Express** API server (Ex3) | `3000` | — (internal) |
| `ex2-server` | Legacy **Ex2 C++** recommendation server (TCP) | `8080` | — (internal) |

Because the React client uses **relative URLs** (`/api/...`), the whole app is
**single-origin** at `http://localhost:3000`: the home page returns the React
app, and the API lives behind it at `/api`. nginx forwards `/api` and `/images`
to the `web` service over the internal network, and `web` reaches the C++ server
as host `ex2-server`.

---

## Tech Stack

- **Frontend:** React 19, React Router 7, Bootstrap 5, Create-React-App build.
- **Backend:** Node.js + Express (MVC), JSON Web Tokens, in-memory data store.
- **Recommender:** C++ TCP server (Ex2), reached over a `node:net` bridge.
- **Serving / orchestration:** nginx (static + reverse proxy), Docker Compose.

---

## Project Structure

```text
.
├── docker-compose.yml         # Orchestrates all three containers (Ex4 entry point)
├── Dockerfile.web             # Node/Express API image
├── Dockerfile.server          # Ex2 C++ server image
├── frontend/                  # React single-page app
│   ├── Dockerfile             #   multi-stage: build with Node → serve with nginx
│   ├── nginx.conf             #   SPA fallback + /api and /images reverse proxy
│   └── src/
│       ├── App.js             #   routes (React Router)
│       ├── pages/             #   Home, Login, Register, Restaurant, Checkout,
│       │   └── admin/         #     Orders, Profile, SearchResults, + admin pages
│       ├── components/        #   AppBar, CartDrawer, route guards, cards, …
│       ├── api/               #   fetch wrappers (apiFetch attaches the JWT)
│       ├── hooks/ utils/      #   theme, cart storage, auth helpers, …
│       └── styles/ assets/
└── src/                       # Ex3 Node/Express server (backend)
    ├── app.js / server.js     #   Express app + bootstrap
    ├── routes/ controllers/   #   REST endpoints (users, tokens, restaurants,
    │                          #     products, orders, search)
    ├── middleware/auth.js     #   requireAuth / requireAdmin (JWT)
    ├── services/              #   in-memory repositories + TCP bridge to Ex2
    └── seed.js                #   seeds 8 restaurants with full menus on startup
```

The **Ex2 C++ server** sources live in the same repo (`src/Server`, `src/Logic`,
…, `cpp-tests/`) and are documented in **[Ex2_README.md](Ex2_README.md)**.

---

## How to Run (Docker Compose)

This is the required way to run the project — one command builds and starts the
whole stack.

### Prerequisite

**Docker Desktop** (or Docker Engine + Compose v2) installed and **running**.
Nothing else is needed — Node, the C++ toolchain and nginx all live inside the
images.

### 1. Build & start everything

From the repository root:

```bash
docker compose up --build
```

This single command **compiles all the code that needs compiling and starts all
the servers**:

1. **`ex2-server`** — compiles the **C++** recommendation server with CMake/`make`
   inside the image, then runs it (TCP `:8080`, internal).
2. **`web`** — installs backend dependencies and starts the **Node/Express** API
   (`:3000`, internal). It waits until the C++ server reports **healthy** before
   starting.
3. **`frontend`** — builds the **React** production bundle with Node, then serves
   it with **nginx**, published on **host `:3000`**.

Add `-d` to run it detached (in the background): `docker compose up --build -d`.

### 2. Open the app

```
http://localhost:3000
```

You should see the home screen with the seeded restaurants loaded from the
server. See it in action under [Demo & Screenshots](#demo--screenshots).

### 3. Verify it's up

```bash
docker compose ps
```

```text
NAME                          SERVICE      STATUS                       PORTS
wolt-clone-ex2-ex2-server-1   ex2-server   Up (healthy)                 8080/tcp
wolt-clone-ex2-frontend-1     frontend     Up                           0.0.0.0:3000->80/tcp
wolt-clone-ex2-web-1          web          Up                           3000/tcp
```

Only `frontend` is published to the host; `web` and `ex2-server` are reachable
only inside the Docker network. Quick endpoint checks:

```bash
curl -i http://localhost:3000/                       # 200 → the React app (index.html)
curl    http://localhost:3000/api/restaurants        # JSON list of restaurants (via nginx → web)
curl -I http://localhost:3000/images/restaurants/pizza-roma.jpg   # 200 image/jpeg (proxied)
```

### 4. Stop it

```bash
docker compose down
```

### Configuration

| Variable | Used by | Default | Notes |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | `web` | `wolt-clone-demo-jwt-secret` | Signs/verifies JWTs. Sourced from the host env / a local (gitignored) `.env` when present; otherwise the **non-sensitive demo** default is used so the stack runs out of the box. |
| `PORT` | `web` | `3000` | Internal API port. |
| `EX2_HOST` / `EX2_PORT` | `web` | `ex2-server` / `8080` | How the API reaches the C++ server on the Docker network. |

> No real secrets are committed. `JWT_SECRET` is only a local signing key for a
> demo with throwaway data — override it via your environment for any non-demo use.

---

## Using the App

1. **Browse without logging in** — the home screen, search, and restaurant menus
   are public.
2. **Register** (`/register`) — pick a username, password, display name, profile
   picture and a location. Fields are validated both in the browser and on the
   server (e.g. a missing field or an existing username is rejected with a clear
   message).
3. **Log in** (`/login`) — on success you receive a JWT and gain access to the
   cart/checkout, orders and profile pages.
4. **Order** — open a restaurant, add items to the cart, and check out.
5. **Admin** — a user whose role is `admin` also sees the admin area (`/admin`)
   to manage restaurants, menus and incoming orders. (Roles are set on the user
   record; the API defaults new users to `customer`.)

---

## API Reference

Base URL: `http://localhost:3000/api` — every response is JSON.

**Authentication:** protected routes (marked 🔒) require the JWT returned by
`POST /api/tokens`, sent as `Authorization: Bearer <token>`. Routes marked
**👑** additionally require the `admin` role. Missing/invalid tokens return
`401`; non-admins on admin routes get `403`.

### Users & authentication
| Method | Path | Auth | Description |
| :--- | :--- | :--: | :--- |
| `POST` | `/api/users` | — | Register — `username, password, displayName, profilePicture, location{lat,lng}` (all required) → `201 {id}`. `400` on missing fields or duplicate username. |
| `POST` | `/api/tokens` | — | Log in with `username` + `password` → `200 {token}` (`404` unknown user, `401` wrong password). |
| `GET` | `/api/users/:id` | — | Get a user's details (password never returned). |
| `PATCH` | `/api/users/:id` | 🔒 | Update your own profile → returns a refreshed `{user, token}`. |

### Restaurants
| Method | Path | Auth | Description |
| :--- | :--- | :--: | :--- |
| `GET` | `/api/restaurants` | — | List all restaurants. |
| `GET` | `/api/restaurants/recommended` | 🔒 | Personalized restaurant recommendations for the logged-in user. |
| `POST` | `/api/restaurants` | 🔒👑 | Create a restaurant → `201 {id}`. |
| `GET` | `/api/restaurants/:id` | — | Get one restaurant. |
| `GET` | `/api/restaurants/:id/menu` | — | Get the restaurant's menu, grouped into sections. |
| `PATCH` | `/api/restaurants/:id` | 🔒👑 | Update a restaurant. |
| `DELETE` | `/api/restaurants/:id` | 🔒👑 | Delete a restaurant (cascades its products). |

### Products (a restaurant's menu)
| Method | Path | Auth | Description |
| :--- | :--- | :--: | :--- |
| `GET` | `/api/restaurants/:id/products` | — | List the restaurant's products. |
| `GET` | `/api/restaurants/:id/products/recommended` | 🔒 | Recommended products for this restaurant. |
| `POST` | `/api/restaurants/:id/products` | 🔒 | Add a product → `201 {id}`. |
| `GET` | `/api/restaurants/:id/products/:pid` | — | Get a product — **also logs a view to the Ex2 server**. |
| `PATCH` | `/api/restaurants/:id/products/:pid` | 🔒 | Update a product. |
| `DELETE` | `/api/restaurants/:id/products/:pid` | 🔒 | Remove a product. |

### Orders
| Method | Path | Auth | Description |
| :--- | :--- | :--: | :--- |
| `POST` | `/api/orders` | 🔒 | Create an order → `201` + `Location`. |
| `GET` | `/api/orders` | 🔒 | List the logged-in user's orders. |
| `GET` | `/api/orders/:id` | 🔒 | Get one order (`403` if it isn't yours). |
| `PATCH` | `/api/orders/:id` | 🔒 | Update an order. |
| `DELETE` | `/api/orders/:id` | 🔒 | Delete an order. |
| `PATCH` | `/api/orders/:id/status` | 🔒👑 | Update an order's status. |
| `GET` | `/api/orders/restaurant/:restaurantId` | 🔒👑 | All orders for a restaurant (admin view). |

### Search & health
| Method | Path | Auth | Description |
| :--- | :--- | :--: | :--- |
| `GET` | `/api/search/:query` | — | Case-insensitive match → `{ restaurants: [...], products: [...] }`. |
| `GET` | `/api/health` | — | Liveness check → `200 {"status":"ok"}`. |

---

## Demo & Screenshots

> **📂 Media placeholders:** the items below point at files in `screenshots/`.
> The login/register shots already exist; the rest are **placeholders** — drop
> your captured images/videos into `screenshots/` using the filenames shown (or
> rename the references to match your files) and they will render here.
> *(GitHub also lets you drag-and-drop a video straight into the PR description
> for inline playback if you prefer that over committing the file.)*

### 🎥 Demo videos

| Demo | File to add |
| :--- | :--- |
| Full order flow — browse → restaurant → cart → checkout → orders | [`screenshots/demo-order.mp4`](screenshots/demo-order.mp4) |
| Auth — register (with validation) → login → protected pages | [`screenshots/demo-auth.mp4`](screenshots/demo-auth.mp4) |
| Admin — manage restaurants, menus & incoming orders | [`screenshots/demo-admin.mp4`](screenshots/demo-admin.mp4) |

<!-- Optional inline players (GitHub renders <video>; replace src with your file):
<video src="screenshots/demo-order.mp4" controls width="720"></video>
-->

### 🖥️ Running with Docker

`docker compose up --build` bringing the full stack up:

![docker compose up — all three services build and start](screenshots/compose-up.png)

### 🔐 Login — light & dark theme
The top-bar toggle re-themes the entire app.

| Light | Dark |
| :---: | :---: |
| ![Login (light)](screenshots/login-light.png) | ![Login (dark)](screenshots/login-dark.png) |

### 📝 Register — with validation
Required fields, password rules, profile picture and location, with clear inline
feedback.

| Top | Bottom |
| :---: | :---: |
| ![Register (top)](screenshots/register-dark-top.png) | ![Register (bottom)](screenshots/register-dark-bottom.png) |

### 🏠 Home — nearby, promoted & recommended
Restaurant feed with category filters and the personalized "Recommended for you" row.

![Home screen](screenshots/home.png)

### 🍽️ Restaurant — full menu
Menu grouped into sections, item modal and add-to-cart.

![Restaurant menu page](screenshots/restaurant.png)

### 🛒 Cart & checkout
The per-user cart drawer and the checkout that places a real order.

| Cart | Checkout |
| :---: | :---: |
| ![Cart drawer](screenshots/cart.png) | ![Checkout](screenshots/checkout.png) |

### 📦 Orders
Past and current orders for the logged-in user.

![Orders page](screenshots/orders.png)

### 🛠️ Admin area
Create/edit restaurants, manage menus and view restaurant orders.

![Admin dashboard](screenshots/admin.png)

---

## Running Without Docker (development)

Useful for fast iteration on the frontend. Run three processes:

```bash
# 1) Ex2 C++ server (build once with CMake — see Ex2_README.md)
mkdir build && cd build && cmake .. && make && ./WoltClone 8080

# 2) Node/Express API (point it at the local C++ server)
#    Linux/macOS:
EX2_HOST=127.0.0.1 EX2_PORT=8080 PORT=3000 JWT_SECRET=dev-secret npm start
#    Windows PowerShell:
#    $env:EX2_HOST='127.0.0.1'; $env:EX2_PORT=8080; $env:PORT=3000; $env:JWT_SECRET='dev-secret'; npm start

# 3) React dev server (proxies /api to :3000 — see frontend/package.json "proxy")
cd frontend && npm install && npm start
```

> Since the API already holds port `3000`, the CRA dev server starts on the next
> free port (it will offer **`http://localhost:3001`**) and proxies `/api` calls
> to the Express server on `:3000`. In the Docker build, nginx plays that proxy
> role instead — which is why the containerized app is single-origin on `:3000`.

---

## Tests

```bash
npm test                 # backend — node:test suites (repositories, app, TCP bridge)
cd frontend && npm test  # frontend — React Testing Library / Jest component tests
```

---

## Work Process & Project Management

Developed with **Agile Scrum**, tracked in **JIRA**:

- Work is split into **epics → user stories → subtasks**; each is assigned before
  work begins and built on a **feature branch** whose name contains the JIRA
  issue key (e.g. `SCRUM-276-docker-and-readme`), which auto-links the branch and
  PR to the issue.
- **Feature-branch workflow:** every change merges into `main` only through a
  **pull request reviewed and approved by another team member** — the approver is
  never the author. Status moves `In Progress → Code Review → Done` on the board,
  and blockers are tracked with *is blocked by* links.
- **Status meetings** are held through the sprint and their decisions recorded in
  JIRA.
- **Test-driven where it applies** — data layer, the TCP bridge and many React
  components ship with tests.

This Ex4 sprint ("UI for Wolt App") added the React frontend on top of the Ex3
API and containerized the whole stack.

---

## Notes & Limitations

- **In-memory store:** all data is volatile and resets when the `web` container
  restarts. On startup the server **seeds 8 restaurants with full menus** so the
  app is populated immediately.
- **No secrets:** this is a teaching exercise — do not store or send real
  passwords, cards, tokens or keys. `JWT_SECRET` is a throwaway demo value.
- **Allowed tooling only:** React/JS/CSS/Bootstrap on the client, Node.js +
  Express on the server, plus standard infrastructure (nginx, Docker).
</content>
</invoke>
