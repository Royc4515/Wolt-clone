import { useState, useEffect } from 'react';
import { getOrders } from '../api/orders';
import { getRestaurant, getMenu } from '../api/restaurants';
import { readLocalCarts } from '../utils/orders';

/**
 * Loads local carts, remote orders, restaurant metadata, and (optionally) menu maps.
 * Returns state + setters so callers can mutate after checkout/delete.
 *
 * @param {{ withMenus?: boolean }} options
 */
export default function useOrdersData({ withMenus = false } = {}) {
  const [localCarts, setLocalCarts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState({});
  const [menuMaps, setMenuMaps] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let stale = false;
    const carts = readLocalCarts();
    setLocalCarts(carts);

    getOrders()
      .then(async data => {
        if (stale) return;
        setOrders(data);

        const allRestIds = [...new Set([
          ...carts.map(c => c.restaurantId),
          ...data.map(o => o.restaurantId),
        ])];

        const restPairs = await Promise.all(
          allRestIds.map(id => getRestaurant(id).then(r => [id, r]).catch(() => [id, null]))
        );

        let menuPairs = [];
        if (withMenus) {
          menuPairs = await Promise.all(
            [...new Set(data.map(o => o.restaurantId))].map(id =>
              getMenu(id)
                .then(sections => [id, new Map(sections.flatMap(s => s.items).map(item => [item.id, item]))])
                .catch(() => [id, new Map()])
            )
          );
        }

        if (!stale) {
          setRestaurants(Object.fromEntries(restPairs));
          if (withMenus) setMenuMaps(Object.fromEntries(menuPairs));
        }
      })
      .catch(err => {
        if (!stale) {
          console.error('Failed to load orders data', err);
          setError(err.message || 'Failed to load orders');
        }
      })
      .finally(() => { if (!stale) setLoading(false); });

    return () => { stale = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { localCarts, orders, restaurants, menuMaps, loading, error, setLocalCarts, setOrders };
}
