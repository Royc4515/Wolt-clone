# 🏠 Home & Browsing (Mobile)

The customer's landing screen — the live restaurant feed.

**At a glance:** for **customers & guests** · Home tab (default on launch) · route `mobile/src/app/(tabs)/index.tsx`.

## What you see

1. **Header bar** — profile avatar (→ Profile), current location (tap to edit), cart icon with an active-item badge, and the dark/light theme toggle.
2. **Category tiles** — a horizontal scroll of tiles (emoji + background image) built from the categories in the live restaurant list. Tapping one filters the feed.
3. **Sticky category pills** — once you scroll past the tiles, a compact pill bar fades in so the filter stays reachable.
4. **Promoted carousel** — restaurants with `isPromoted: true`, with a **"See all"** link to the full promoted page (`mobile/src/app/promoted.tsx`).
5. **All Restaurants** (or the active category) — a vertical list of cards: image, name, rating, delivery time, delivery fee.

Tapping any card opens the [Restaurant Menu](04-Restaurant-Menu.md).

## Location

- **Guests:** location is stored locally via `AsyncStorage` (`getGuestLocation()` / `saveGuestLocation()`).
- **Logged-in users:** "Use my profile location" or editing lat/lng calls `updateUser(id, data, token)` (`PATCH /api/users/:id`) to persist it.

Changing location live-updates the feed.

## API used

| Action | Call |
| --- | --- |
| Load the feed | `getRestaurants(lat?, lng?)` → `GET /api/restaurants` |
| Update saved location (logged in) | `updateUser(id, data, token)` → `PATCH /api/users/:id` |

## Walkthrough

1. Bring up the stack ([Environment Setup](01-Environment-Setup.md)) and launch the mobile app.
2. Confirm the seeded restaurants appear (8 from `src/seed.js`).
3. Tap a category tile — the feed filters and the Recommended/Promoted sections collapse.
4. Scroll down — confirm the sticky pills bar fades in.
5. Tap "See all" under Promoted — confirm the full promoted list opens.
6. Edit the location (lat/lng) and confirm the feed refreshes.

## Media

> 📷 **Capture — `home-feed.png`** ([guide H1](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** Home scrolled to top — category tiles, Promoted carousel (≥2 cards), header location pill.

> 📷 **Capture — `home-category.png`** ([guide H2](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** Home with a category filter active (feed narrowed, sticky pills visible).

> 📷 **Capture — `home-location.png`** ([guide H3](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** the location-edit modal open with lat/lng fields.

---

↩ [Wiki index](README.md) · Next: [Search](03-Search.md)
