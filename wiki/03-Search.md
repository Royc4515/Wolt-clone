# 🔎 Search (Mobile)

Find restaurants and dishes from one search box.

**At a glance:** for **customers & guests** · Search tab · route `mobile/src/app/(tabs)/search.tsx`.

## What it does

Typing sends a debounced (300 ms) query to `searchAll(query)` → `GET /api/search/:query`, which matches restaurant name/description/category **and** dish name/description (see [Backend](08-Backend-Restaurants-Products.md#search)).

Results appear in three modes:

| Mode | Shows |
| --- | --- |
| **All** (default) | Matching restaurants, each with a horizontal slider of its matching/recommended dishes |
| **Restaurants** | Just matching restaurants, with delivery/rating sort applied |
| **Items** | A flat list of matching dishes, each row showing its restaurant + delivery info |

Tapping a restaurant opens its [menu](04-Restaurant-Menu.md); tapping a dish opens that restaurant's menu with the item highlighted.

## Sort & filters

- **Sort:** Recommended · Delivery Time · Delivery Fee · Rating.
- **Filters:** Free delivery · minimum rating (4.0+ / 4.5+) · max delivery time (< 20 / 30 / 45 min). Active filter count shows as a badge.

## Walkthrough

1. Open **Search** and type part of a restaurant name (e.g. "Pizza Roma").
2. Confirm **All** mode shows restaurant + dish sliders.
3. Switch to **Restaurants** and **Items** and confirm each result shape.
4. Apply a sort (Rating) and a filter (Free delivery) and confirm the list updates.
5. Search a query that matches only a dish name and confirm it still surfaces under **Items**/**All**.

## Media

> 📷 **Capture — `search-all.png`** ([guide S1](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** "All" mode with both restaurant rows and dish sliders visible.

> 📷 **Capture — `search-restaurants.png`** ([guide S2](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** the "Restaurants" tab of results.

> 📷 **Capture — `search-items.png`** ([guide S3](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** the "Items" tab of results.

> 📷 **Capture — `search-filters.png`** ([guide S4](00-Media-Capture-Guide.md#-discovery-home--search--menu)) · phone · light
> **Show:** the sort/filter panel open with a filter applied.

---

↩ [Wiki index](README.md) · Next: [Restaurant Menu](04-Restaurant-Menu.md)
