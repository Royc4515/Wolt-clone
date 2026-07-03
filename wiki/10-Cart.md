# 🛒 Cart (Mobile)

Multiple per-restaurant carts, isolated per user, that survive the guest → account transition.

**At a glance:** for **customers & guests** · context `mobile/src/context/CartContext.tsx` · screens `mobile/src/app/orders/cart.tsx` (single) and `mobile/src/app/orders/cart-overview.tsx` (all carts).

## Multi-restaurant carts

Cart state is an object keyed by restaurant: `{ [restaurantId]: CartItem[] }`. You can build carts at several restaurants at once — each appears as its own card (items, thumbnails, subtotal) in the **Cart Overview**.

## Per-user data isolation

Carts persist in `AsyncStorage` under a **user-specific key**:

| Who | Storage key |
| --- | --- |
| Logged-in user | `@carts_${userId}` |
| Guest | `@carts_guest` |

Because the key is scoped to the user id, two people logging into the same device never see or change each other's carts.

## Guest → account migration

```mermaid
flowchart LR
    G["Guest builds cart<br/>@carts_guest"] -->|login / register| M["Merge into<br/>@carts_userId"]
    M --> W["Clear @carts_guest"]
```

When a guest logs in or registers, their guest cart is merged into the authenticated user's cart, then the guest entry is cleared so nothing is duplicated.

## Empty states & images

- Both the single cart and Cart Overview show a friendly empty state (icon + "No active carts" / "Cart is empty").
- Thumbnails render base64 (`data:…`) and `http` images; a themed placeholder icon (fast-food / storefront) fills in for missing images.

## Walkthrough

1. As a guest, add items from two restaurants; open **Cart Overview** and confirm both carts appear with correct subtotals.
2. Log in — confirm the guest carts migrate in and the guest cart clears.
3. Log out and log in as a *different* user; confirm you do **not** see the first user's carts.
4. Empty a cart and confirm the empty state renders.

## Media

> 📷 **Capture — `cart-overview.png`** ([guide C1](00-Media-Capture-Guide.md#-cart--checkout--orders)) · phone · light
> **Show:** Cart Overview with ≥2 active carts.

> 📷 **Capture — `cart-single.png`** ([guide C2](00-Media-Capture-Guide.md#-cart--checkout--orders)) · phone · light
> **Show:** a single-restaurant cart with items and subtotal.

> 📷 **Capture — `cart-empty.png`** ([guide C3](00-Media-Capture-Guide.md#-cart--checkout--orders)) · phone · light
> **Show:** the empty-cart state.

---

↩ [Wiki index](README.md) · Next: [Checkout](11-Checkout.md)
