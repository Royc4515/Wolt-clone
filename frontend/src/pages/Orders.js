import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { getOrders, cancelOrder } from '../api/orders';
import { getRestaurant } from '../api/restaurants';
import '../styles/Orders.css';

const TABS = [
  { id: 'personal', label: 'Personal info', to: '/profile' },
  { id: 'orders',   label: 'Order Again' },
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusLabel(status) {
  const labels = {
    pending:   'Pending',
    preparing: 'Preparing',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let stale = false;

    getOrders()
      .then(async (data) => {
        if (stale) return;
        setOrders(data);

        const uniqueRestIds = [...new Set(data.map(o => o.restaurantId))];
        const pairs = await Promise.all(
          uniqueRestIds.map(id =>
            getRestaurant(id)
              .then(r => [id, r])
              .catch(() => [id, null])
          )
        );
        if (!stale) {
          setRestaurants(Object.fromEntries(pairs));
        }
      })
      .catch(err => {
        if (!stale) setError(err.message || 'Failed to load orders');
      })
      .finally(() => {
        if (!stale) setIsLoading(false);
      });

    return () => { stale = true; };
  }, []);

  async function handleCancel(id) {
    setCancellingId(id);
    setError('');
    try {
      await cancelOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  }

  const activeOrders  = orders.filter(o => o.status === 'pending');
  const historyOrders = orders.filter(o => o.status !== 'pending');

  return (
    <div className="orders-page">
      <AppBar />

      <div className="orders-content">
        <div className="orders-header">
          <h1 className="orders-heading">My Orders</h1>
        </div>

        <nav className="orders-tabs">
          {TABS.map(tab =>
            tab.to ? (
              <Link key={tab.id} to={tab.to} className="orders-tab">
                {tab.label}
              </Link>
            ) : (
              <span key={tab.id} className="orders-tab orders-tab--active">
                {tab.label}
              </span>
            )
          )}
        </nav>

        {error && <div className="orders-error-banner">{error}</div>}

        {isLoading ? (
          <div className="orders-loading">
            <div className="orders-spinner" />
          </div>
        ) : (
          <>
            <section className="orders-section">
              <h2 className="orders-section-title">Shopping Cart</h2>
              {activeOrders.length === 0 ? (
                <p className="orders-empty">Your cart is empty.</p>
              ) : (
                <ul className="orders-list">
                  {activeOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      restaurant={restaurants[order.restaurantId]}
                      onCancel={handleCancel}
                      isCancelling={cancellingId === order.id}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="orders-section">
              <h2 className="orders-section-title">Order Again</h2>
              {historyOrders.length === 0 ? (
                <p className="orders-empty">No past orders yet.</p>
              ) : (
                <ul className="orders-list">
                  {historyOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      restaurant={restaurants[order.restaurantId]}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, restaurant, onCancel, isCancelling }) {
  const restName  = restaurant?.name ?? 'Restaurant';
  const itemCount = order.items?.length ?? 0;
  const total     = typeof order.totalPrice === 'number'
    ? order.totalPrice.toFixed(2)
    : '—';

  return (
    <li className="order-card">
      <div className="order-card-top">
        <span className="order-card-restaurant">{restName}</span>
        <span className={`order-status order-status--${order.status}`}>
          {statusLabel(order.status)}
        </span>
      </div>

      <div className="order-card-meta">
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        <span className="order-card-sep">·</span>
        <span>₪{total}</span>
      </div>

      <div className="order-card-date">{formatDate(order.createdAt)}</div>

      {order.status === 'pending' && (
        <button
          className="order-cancel-btn"
          onClick={() => onCancel(order.id)}
          disabled={isCancelling}
        >
          {isCancelling ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
    </li>
  );
}
