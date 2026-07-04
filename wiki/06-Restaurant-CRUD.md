# ➕ Restaurant CRUD (Mobile & Web)

Create, edit, and delete a restaurant — demonstrated on both clients, which share one Mongo-backed API.

**At a glance:** for **admins (owners)** · mobile routes under `mobile/src/app/owner/` · reached from the [Owner Dashboard](05-Owner-Dashboard.md).

## Mobile

- **Create:** `mobile/src/app/owner/new-restaurant.tsx` — from the dashboard's empty state or FAB.
- **Edit:** `mobile/src/app/owner/edit-restaurant/[id].tsx` — from a card's "Edit"; pre-fills from `getRestaurant(id)`, 403s if you're not the owner.
- **Delete:** from a card's "Delete", with a double-confirm alert.

### Form fields (create & edit share one form)

| Section | Fields |
| --- | --- |
| Hero image | Photo picker (library/camera) → base64 data URI, with live preview |
| Basic info | Name (required), Category (searchable dropdown, auto-populated), Description |
| Location | Latitude / Longitude (required, range −90..90 / −180..180), "Use my profile location" |
| Contact & hours | Phone (optional, sanitized), Opening hours (From/Until time pickers) |
| Delivery | Delivery fee (₪, ≥ 0), Delivery time (stepper, 5–120 min, 5-min steps) |

### API used

| Action | Call |
| --- | --- |
| Create | `createRestaurant(data, token)` → `POST /api/restaurants` |
| Update | `updateRestaurant(id, data, token)` → `PATCH /api/restaurants/:id` |
| Delete | `deleteRestaurant(id, token)` → `DELETE /api/restaurants/:id` |

> [!NOTE]
> Deleting a restaurant **cascades** — the server deletes its products first (`Product.deleteMany({ restaurantId })`) before removing the restaurant. See the [cascade-delete diagram](08-Backend-Restaurants-Products.md#cascade-delete).

### Walkthrough (mobile)

1. As an owner, open Owner → **Create Restaurant**.
2. Fill name, category, location (or "Use my profile location"), hours, delivery fee/time, and pick a photo. Save.
3. Confirm the restaurant appears on the dashboard and on [Home](02-Home-and-Browsing.md)/[Search](03-Search.md) for customers.
4. Edit a field and confirm the change reflects everywhere.
5. Delete the restaurant, confirm the dialog, and confirm the restaurant **and its menu items** are gone.

## Web (Ex4 app)

The web admin dashboard exercises the same `POST/PATCH/DELETE /api/restaurants` endpoints. A recorded demo of registering an admin and creating a restaurant from the web client already exists — see **"▶ Register + create a restaurant (admin)"** in the main [README's demo videos](../README.md#-demo-videos), or [`screenshots/admin-register-restaurant.mp4`](../screenshots/admin-register-restaurant.mp4).

## Media

> 🎥 **Capture — `flow-restaurant-crud.mp4`** ([guide V3](00-Media-Capture-Guide.md#-videos-headline-flows))
> **Record:** create a restaurant (photo + location + hours) → edit a field → delete it. ~40s.

> 📷 **Capture — `restaurant-create-top.png`** ([guide RC1](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** the create-restaurant form top — photo picker + name/category/description.

> 📷 **Capture — `restaurant-create-location.png`** ([guide RC2](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** the location / hours / delivery section of the form.

> 📷 **Capture — `restaurant-edit.png`** ([guide RC3](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** the edit-restaurant form pre-filled with existing data.

> 📷 **Capture — `restaurant-delete.png`** ([guide RC4](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** the delete-restaurant confirmation dialog.

---

↩ [Wiki index](README.md) · Next: [Dish CRUD](07-Dish-CRUD.md)
