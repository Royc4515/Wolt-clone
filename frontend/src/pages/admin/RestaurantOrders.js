import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '../../components/AppBar';
import AdminOrderCard from '../../components/admin/AdminOrderCard';
import { getRestaurant } from '../../api/restaurants';
import { getRestaurantOrders, updateOrderStatus } from '../../api/orders';
import { getProducts } from '../../api/products';
import './admin.css';

// Admin view of every order placed at a restaurant the user owns. Lets the
// owner advance each order's status. The server enforces ownership (403) and
// existence (404); those surface in the error banner.
export default function RestaurantOrders() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getRestaurant(id), getRestaurantOrders(id), getProducts(id)])
      .then(([rest, ords, prods]) => {
        if (cancelled) return;
        setRestaurant(rest);
        setOrders(ords);
        setProducts(prods);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load orders. Please try again.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  // productId → product, for resolving order item names.
  const menuMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  async function handleStatusChange(orderId, status) {
    setUpdatingId(orderId);
    setError('');
    try {
      const updated = await updateOrderStatus(orderId, status);
      // Swap in the server's authoritative order, immutably.
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <AppBar />
        <main className="admin__loading"><div className="admin__spinner" /></main>
      </div>
    );
  }

  return (
    <div className="admin">
      <AppBar />
      <main className="admin__main admin__main--narrow">
        <button type="button" className="admin__link" onClick={() => navigate('/admin')}>← Back to admin</button>
        <div className="admin__head">
          <div>
            <h1 className="admin__title">Orders</h1>
            <p className="admin__sub">{restaurant?.name}</p>
          </div>
        </div>

        {error && <div className="admin__error" role="alert">{error}</div>}

        {orders.length === 0 ? (
          !error && <p className="admin__empty">No orders yet.</p>
        ) : (
          <ul className="admin__list">
            {orders.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                menuMap={menuMap}
                onStatusChange={handleStatusChange}
                updating={updatingId === order.id}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
