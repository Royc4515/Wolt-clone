# 🍕 Dish CRUD (Mobile & Web)

Create, edit, delete, and reorder menu items within a restaurant.

**At a glance:** for **admins (owners)** · mobile routes under `mobile/src/app/owner/[rid]/dishes/` · reached from a dashboard card's "Menu".

## Mobile

- **List:** `mobile/src/app/owner/[rid]/dishes/index.tsx`
- **Create:** `mobile/src/app/owner/[rid]/dishes/new.tsx`
- **Edit:** `mobile/src/app/owner/[rid]/dishes/[pid]/edit.tsx`

### Dish list

- Dishes grouped by menu section (sections collapsible).
- Each row: thumbnail, name, description, price, an "Unavailable" badge when toggled off, and Edit/Delete icons.
- **Drag-to-reorder:** long-press (~280 ms) to pick up a row (`react-native-gesture-handler` + `react-native-reanimated`, haptics), drag, and drop to persist the new `sectionOrder`.
- Empty state: "Create your first dish".

### Create / edit form (shared)

| Field | Notes |
| --- | --- |
| Photo | Square (1:1) picker, lower quality (0.3) to keep the base64 payload small |
| Name | Required |
| Description | Optional |
| Price | Required, numeric, ≥ 0 |
| Section | Required — searchable dropdown of existing sections, or type a new one |
| Availability | Toggle — hides the dish from ordering without deleting it |

### API used

| Action | Call |
| --- | --- |
| List | `GET /api/restaurants/:id/products` |
| Create | `createProduct(rid, data, token)` → `POST /api/restaurants/:id/products` |
| Update | `updateProduct(rid, pid, data, token)` → `PATCH /api/restaurants/:id/products/:pid` |
| Delete | `deleteProduct(rid, pid, token)` → `DELETE /api/restaurants/:id/products/:pid` |

### Walkthrough (mobile)

1. From the dashboard, open a restaurant's **Menu**.
2. Create a dish (name, price, section, photo). Confirm it appears in the right section on both this list and the customer [menu](04-Restaurant-Menu.md).
3. Edit the dish (change price or toggle availability) and confirm the customer view reflects it (unavailable dishes aren't orderable).
4. Long-press and drag a dish to reorder; confirm the order persists after leaving and returning.
5. Delete a dish (confirm dialog) and confirm it disappears from both views.

## Web (Ex4 app)

The web admin dashboard manages menus through the same product endpoints. See **"▶ Admin features — manage menus & restaurant orders"** in the main [README's demo videos](../README.md#-demo-videos), or [`screenshots/admin-features.mp4`](../screenshots/admin-features.mp4).

## Media

> 🎥 **Capture — `flow-dish-crud.mp4`** ([guide V4](00-Media-Capture-Guide.md#-videos-headline-flows))
> **Record:** add a dish → edit price/availability → drag-reorder → delete. ~35s.

> 📷 **Capture — `dish-list.png`** ([guide DC1](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** the dish list grouped by section, with edit/delete icons.

> 📷 **Capture — `dish-create.png`** ([guide DC2](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** the create-dish form.

> 📷 **Capture — `dish-reorder.png`** ([guide DC3](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** a dish being dragged mid-reorder.

> 📷 **Capture — `dish-delete.png`** ([guide DC4](00-Media-Capture-Guide.md#-owner-tools-dashboard--restaurant-crud--dish-crud)) · phone · light
> **Show:** the delete-dish confirmation.

---

↩ [Wiki index](README.md) · Next: [Backend: Restaurants & Products](08-Backend-Restaurants-Products.md)
