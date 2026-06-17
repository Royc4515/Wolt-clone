import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

function readLocalCarts() {
  const carts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('cart_')) continue;
    try {
      const items = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(items) && items.length > 0) {
        carts.push({ restaurantId: key.slice('cart_'.length), items });
      }
    } catch {
      // malformed entry — skip
    }
  }
  return carts;
}

export default function Orders() {
  const navigate = useNavigate();
  const [localCarts, setLocalCarts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let stale = false;

    const carts = readLocalCarts();
    setLocalCarts(carts);

    getOrders()
      .then(async (data) => {
        if (stale) return;
        setOrders(data);

        const orderRestIds = data.map(o => o.restaurantId);
        const cartRestIds  = carts.map(c => c.restaurantId);
        const uniqueIds    = [...new Set([...orderRestIds, ...cartRestIds])];

        const pairs = await Promise.all(
          uniqueIds.map(id =>
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
            {/* ── Shopping Cart: localStorage items not yet checked out ── */}
            <section className="orders-section">
              <h2 className="orders-section-title">Shopping Cart</h2>
              {localCarts.length === 0 ? (
                <p className="orders-empty">Your cart is empty.</p>
              ) : (
                <ul className="orders-list">
                  {localCarts.map(cart => (
                    <LocalCartCard
                      key={cart.restaurantId}
                      cart={cart}
                      restaurant={restaurants[cart.restaurantId]}
                      onContinue={() => navigate(`/restaurant/${cart.restaurantId}`)}
                    />
                  ))}
                </ul>
              )}
            </section>

            {/* ── Order Again: all placed orders from backend ── */}
            <section className="orders-section">
              <h2 className="orders-section-title">Order Again</h2>
              {orders.length === 0 ? (
                <p className="orders-empty">No past orders yet.</p>
              ) : (
                <ul className="orders-list">
                  {orders.map(order => (
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
          </>
        )}
      </div>
    </div>
  );
}

function LocalCartCard({ cart, restaurant, onContinue }) {
  const restName  = restaurant?.name ?? 'Restaurant';
  const itemCount = cart.items.reduce((sum, e) => sum + e.qty, 0);
  const total     = cart.items
    .reduce((sum, e) => sum + e.item.price * e.qty, 0)
    .toFixed(2);

  return (
    <li className="order-card">
      <div className="order-card-top">
        <span className="order-card-restaurant">{restName}</span>
        <span className="order-status order-status--cart">In Cart</span>
      </div>

      <div className="order-card-meta">
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        <span className="order-card-sep">·</span>
        <span>₪{total}</span>
      </div>

      <button className="order-continue-btn" onClick={onContinue}>
        Continue order
      </button>
    </li>
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
