# 📸 Media Capture Guide

This page is the single checklist for every screenshot and video the wiki needs. Each flow page has a matching **capture block** at the point where the media should appear; this guide collects them all so they can be captured in one sitting.

## How to use it

1. Bring the system up ([Environment Setup](01-Environment-Setup.md)) and run the mobile app.
2. Work down the tables below, capturing each item in the state described.
3. Save each file under the listed folder with the exact filename (the pages already reference these names).
4. On the relevant page, replace the capture block with the image/video embed.

## Conventions

- **Screenshots** → `assets/mobile/` (phone screens) or `assets/desktop/` (browser / Docker terminal). Save as `.png`.
- **Videos** → embed by dragging the clip into the pull-request description to get a GitHub `user-attachments` URL (same approach as the main project [README](../README.md#-demo-videos)), **or** commit a compressed `.mp4` under `assets/video/` and link it. Keep clips ~20–45s.
- **Device & theme:** use one phone (iOS or Android) consistently. Capture the app in **light** theme unless a row asks for dark, so the set looks uniform.
- **Data:** run against the seeded database (8 restaurants) so screens look full; create one throwaway admin account for the owner/CRUD shots.

Embed syntax to paste in place of a capture block:

```markdown
<img src="assets/mobile/home-01-feed.png" width="300" alt="Home feed">
```

---

## 🎥 Videos (headline flows)

| ID | File | Page | What to record (≈length) |
| --- | --- | --- | --- |
| V1 | `flow-bringup.mp4` | [01](01-Environment-Setup.md) | `docker compose up --build` → `docker compose ps` all healthy → open the app and see restaurants load (~30s) |
| V2 | `flow-auth.mp4` | [09](09-Auth-and-Profile.md) | Register with live validation → log in → open profile → log out (~40s) |
| V3 | `flow-restaurant-crud.mp4` | [06](06-Restaurant-CRUD.md) | Create a restaurant (photo + location + hours) → edit a field → delete it (~40s) |
| V4 | `flow-dish-crud.mp4` | [07](07-Dish-CRUD.md) | Add a dish → edit price/availability → drag-reorder → delete (~35s) |
| V5 | `flow-order.mp4` | [11](11-Checkout.md) / [12](12-Order-History-and-Reorder.md) | Browse restaurant → add items → cart → checkout (delivery) → place order → see it in history → reorder (~45s) |

## 📷 Environment

| ID | File | Folder | Device/theme | Show |
| --- | --- | --- | --- | --- |
| E1 | `env-compose-up.png` | desktop | terminal | `docker compose up --build` output with all 4 services started |
| E2 | `env-compose-ps.png` | desktop | terminal | `docker compose ps` — `ex2-server` healthy, `mongo`, `web`, `frontend` up |
| E3 | `env-expo-connected.png` | mobile | phone · light | Expo Go running the app, restaurants loaded (proves mobile ↔ backend) |

## 📷 Authentication & Profile

| ID | File | Folder | Device/theme | Show |
| --- | --- | --- | --- | --- |
| A1 | `auth-register.png` | mobile | phone · light | Register form with a validation hint visible + the Customer/Admin role toggle |
| A2 | `auth-login.png` | mobile | phone · light | Login screen, including the "continue as guest" entry |
| A3 | `auth-guest-location.png` | mobile | phone · light | Guest location-input screen with coordinates entered |
| A4 | `profile-admin.png` | mobile | phone · light | Profile of an admin — avatar, "Restaurant Owner" badge, "My Restaurants" row |
| A5 | `profile-edit.png` | mobile | phone · light | Edit-profile screen |
| A6 | `profile-delete.png` | mobile | phone · light | Delete-account confirmation dialog |

## 📷 Discovery (Home · Search · Menu)

| ID | File | Folder | Device/theme | Show |
| --- | --- | --- | --- | --- |
| H1 | `home-feed.png` | mobile | phone · light | Home top — category tiles + Promoted carousel (≥2 cards) + header location pill |
| H2 | `home-category.png` | mobile | phone · light | Home with a category filter active |
| H3 | `home-location.png` | mobile | phone · light | Location-edit modal |
| S1 | `search-all.png` | mobile | phone · light | Search "All" mode with restaurant + dish results |
| S2 | `search-restaurants.png` | mobile | phone · light | Search "Restaurants" tab |
| S3 | `search-items.png` | mobile | phone · light | Search "Items" tab |
| S4 | `search-filters.png` | mobile | phone · light | Sort/filter panel open |
| M1 | `menu-hero.png` | mobile | phone · light | Restaurant page — hero + sectioned menu |
| M2 | `menu-item-modal.png` | mobile | phone · light | Item detail modal (quantity + Add to Cart) |
| M3 | `menu-search.png` | mobile | phone · light | In-restaurant item search overlay |

## 📷 Owner tools (Dashboard · Restaurant CRUD · Dish CRUD)

| ID | File | Folder | Device/theme | Show |
| --- | --- | --- | --- | --- |
| O1 | `owner-dashboard.png` | mobile | phone · light | Owner dashboard — list of owned restaurants |
| O2 | `owner-card-actions.png` | mobile | phone · light | An expanded restaurant card showing Edit / Menu / Delete |
| O3 | `owner-empty.png` | mobile | phone · light | Empty state ("Grow Your Business") |
| RC1 | `restaurant-create-top.png` | mobile | phone · light | Create-restaurant form — photo + basic info |
| RC2 | `restaurant-create-location.png` | mobile | phone · light | Create-restaurant form — location / hours / delivery |
| RC3 | `restaurant-edit.png` | mobile | phone · light | Edit-restaurant form pre-filled |
| RC4 | `restaurant-delete.png` | mobile | phone · light | Delete-restaurant confirmation |
| DC1 | `dish-list.png` | mobile | phone · light | Dish list grouped by section |
| DC2 | `dish-create.png` | mobile | phone · light | Create-dish form |
| DC3 | `dish-reorder.png` | mobile | phone · light | Drag-to-reorder in progress |
| DC4 | `dish-delete.png` | mobile | phone · light | Delete-dish confirmation |

## 📷 Cart · Checkout · Orders

| ID | File | Folder | Device/theme | Show |
| --- | --- | --- | --- | --- |
| C1 | `cart-overview.png` | mobile | phone · light | Cart Overview with ≥2 active carts |
| C2 | `cart-single.png` | mobile | phone · light | Single-restaurant cart with items |
| C3 | `cart-empty.png` | mobile | phone · light | Empty-cart state |
| K1 | `checkout-delivery.png` | mobile | phone · light | Checkout in delivery mode with the pricing breakdown |
| K2 | `checkout-pickup-alert.png` | mobile | phone · light | The "too far → Pickup only" alert (address > 15 km) |
| K3 | `checkout-tip-pay.png` | mobile | phone · light | Tip selector + payment methods |
| K4 | `checkout-schedule.png` | mobile | phone · light | Schedule-for-later time-slot modal |
| R1 | `orders-history.png` | mobile | phone · light | Order-history list with status badges |
| R2 | `orders-detail.png` | mobile | phone · light | Order detail modal (itemized receipt) |
| R3 | `orders-partial.png` | mobile | phone · light | "Partial Order Recreated" alert on reorder |
| R4 | `orders-unavailable.png` | mobile | phone · light | Grayed "Unavailable" reorder for a deleted restaurant |

---

↩ [Wiki index](README.md)
