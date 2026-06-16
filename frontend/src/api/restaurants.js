export async function fetchRestaurants() {
  const res = await fetch('/api/restaurants');
  if (!res.ok) throw new Error('Failed to fetch restaurants');
  return res.json();
}

export async function fetchRestaurant(id) {
  const res = await fetch(`/api/restaurants/${id}`);
  if (!res.ok) throw new Error('Restaurant not found');
  return res.json();
}

export async function fetchMenu(restaurantId) {
  const res = await fetch(`/api/restaurants/${restaurantId}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}
