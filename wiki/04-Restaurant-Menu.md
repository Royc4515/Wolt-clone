# 🍽️ Restaurant Menu (Mobile, Customer View)

A restaurant's full menu, grouped into sections, with add-to-cart.

**At a glance:** for **customers & guests** · route `mobile/src/app/restaurant/[id].tsx` (Expo Router dynamic segment) · opened by tapping a restaurant card from [Home](02-Home-and-Browsing.md) or [Search](03-Search.md).

## What you see

1. **Hero image** — full-width banner with a gradient overlay.
2. **Restaurant info block** — name, open hours, description, and pills for rating / delivery time / delivery fee (or "Free delivery").
3. **Recommended carousel** — a horizontal strip of up to 6 available items, when present.
4. **Sticky section tabs** — once the hero scrolls away, a tab bar fades in; tapping a tab jumps to that section.
5. **Menu sections** — a `SectionList` grouped exactly as returned by `GET /api/restaurants/:id/menu` (see [Backend](08-Backend-Restaurants-Products.md)), each item showing image, name, description, price.
6. **In-restaurant search** — an overlay that filters items within this restaurant by name/description.
7. **Item modal** — tapping an item opens a detail modal with a quantity stepper and "Add to Cart".
8. **Sticky cart bar** — once items are added, a frosted-glass bar shows the total and a "View cart" button.

> [!NOTE]
> Adding to cart hands off to the [Cart](10-Cart.md) / [Checkout](11-Checkout.md) flow.

## API used

| Action | Call |
| --- | --- |
| Restaurant header info | `getRestaurant(id)` → `GET /api/restaurants/:id` |
| Menu sections + items | `getMenu(id)` → `GET /api/restaurants/:id/menu` |

## Walkthrough

1. From Home or Search, tap into any restaurant.
2. Confirm the hero, info pills, and sectioned menu load.
3. Scroll down and confirm the sticky section-tab bar appears; tap a tab to jump to that section.
4. Open the in-page search and filter items by a keyword.
5. Tap an item → confirm the modal opens with quantity + Add to Cart → add it → confirm the sticky cart bar updates.

## Media

> 📷 **Capture — `menu-hero.png`** ([guide M1](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** the restaurant page — hero image + info pills + the start of the sectioned menu.

> 📷 **Capture — `menu-item-modal.png`** ([guide M2](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** an item detail modal with the quantity stepper and Add to Cart.

> 📷 **Capture — `menu-search.png`** ([guide M3](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** the in-restaurant item search overlay with a query typed.

---

↩ [Wiki index](README.md) · Next: [Owner Dashboard](05-Owner-Dashboard.md)
