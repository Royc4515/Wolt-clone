import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { cancelOrder } from '../api/orders';
import { TrashIcon } from '../components/icons';
import { statusLabel, displayStatus, formatDate } from '../utils/orders';
import useOrdersData from '../hooks/useOrdersData';
import '../styles/Orders.css';

const TABS = [
  { id: 'personal', label: 'Personal info', to: '/profile' },
  { id: 'orders',   label: 'My Orders' },
];

export default function Orders() {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [editSection, setEditSection] = useState(null); // null | 'carts' | 'orders'
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { localCarts, orders, restaurants, loading, error: loadError, setLocalCarts, setOrders } =
    useOrdersData();

  const [actionError, setActionError] = useState('');
  const error = loadError || actionError;

  const currentEditIds = editSection === 'carts'
    ? localCarts.map(c => c.restaurantId)
    : orders.map(o => o.id);
  const allSelected = currentEditIds.length > 0 && currentEditIds.every(id => selectedIds.has(id));

  function enterEdit(section) { setEditSection(section); setSelectedIds(new Set()); }
  function cancelEdit() { setEditSection(null); setSelectedIds(new Set()); }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(currentEditIds));
  }

  async function handleDeleteSelected() {
    setActionError('');
    if (editSection === 'carts') {
      selectedIds.forEach(restId => localStorage.removeItem(`cart_${restId}`));
      setLocalCarts(prev => prev.filter(c => !selectedIds.has(c.restaurantId)));
      cancelEdit();
    } else {
      setDeletingId('bulk');
      try {
        await Promise.all([...selectedIds].map(id => cancelOrder(id)));
        setOrders(prev => prev.filter(o => !selectedIds.has(o.id)));
        cancelEdit();
      } catch (err) {
        setActionError(err.message || 'Failed to delete orders');
      } finally {
        setDeletingId(null);
      }
    }
  }

  function handleDeleteCart(restaurantId) {
    setActionError('');
    localStorage.removeItem(`cart_${restaurantId}`);
    setLocalCarts(prev => prev.filter(c => c.restaurantId !== restaurantId));
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setActionError('');
    try {
      await cancelOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setActionError(err.message || 'Failed to delete order');
    } finally {
      setDeletingId(null);
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

        {loading ? (
          <div className="orders-loading">
            <div className="orders-spinner" />
          </div>
        ) : (
          <>
            <section className="orders-section">
              <div className="orders-section-header">
                {editSection === 'carts' ? (
                  <>
                    <button className="orders-select-all-btn" onClick={handleSelectAll}>
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                    <button className="orders-cancel-edit-btn" onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <h2 className="orders-section-title">Shopping Carts</h2>
                    {localCarts.length > 0 && (
                      <button className="orders-edit-btn" onClick={() => enterEdit('carts')}>Edit</button>
                    )}
                  </>
                )}
              </div>

              {localCarts.length === 0 ? (
                <p className="orders-empty">Your cart is empty.</p>
              ) : (
                <ul className="orders-list">
                  {localCarts.map(cart => (
                    <LocalCartCard
                      key={cart.restaurantId}
                      cart={cart}
                      restaurant={restaurants[cart.restaurantId]}
                      onAddMore={() => navigate(`/restaurant/${cart.restaurantId}`)}
                      onCheckout={() => navigate(`/checkout/${cart.restaurantId}`)}
                      onDelete={() => handleDeleteCart(cart.restaurantId)}
                      editMode={editSection === 'carts'}
                      isSelected={selectedIds.has(cart.restaurantId)}
                      onToggleSelect={() => toggleSelect(cart.restaurantId)}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="orders-section">
              <div className="orders-section-header">
                {editSection === 'orders' ? (
                  <>
                    <button className="orders-select-all-btn" onClick={handleSelectAll}>
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                    <button className="orders-cancel-edit-btn" onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <h2 className="orders-section-title">Order Again</h2>
                    {orders.length > 0 && (
                      <button className="orders-edit-btn" onClick={() => enterEdit('orders')}>Edit</button>
                    )}
                  </>
                )}
              </div>

              {orders.length === 0 ? (
                <p className="orders-empty">No past orders yet.</p>
              ) : (
                <ul className="orders-list">
                  {orders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      restaurant={restaurants[order.restaurantId]}
                      onDelete={handleDelete}
                      isDeleting={deletingId === order.id}
                      editMode={editSection === 'orders'}
                      isSelected={selectedIds.has(order.id)}
                      onToggleSelect={() => toggleSelect(order.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {editSection && selectedIds.size > 0 && (
        <div className="orders-edit-footer">
          <button
            className="orders-delete-selected-btn"
            onClick={handleDeleteSelected}
            disabled={deletingId === 'bulk'}
          >
            {deletingId === 'bulk' ? 'Deleting…' : `Delete (${selectedIds.size})`}
          </button>
        </div>
      )}
    </div>
  );
}

function LocalCartCard({ cart, restaurant, onAddMore, onCheckout, onDelete, editMode, isSelected, onToggleSelect }) {
  const restName  = restaurant?.name ?? 'Restaurant';
  const itemCount = cart.items.reduce((sum, e) => sum + e.qty, 0);
  const total     = cart.items.reduce((sum, e) => sum + e.item.price * e.qty, 0).toFixed(2);

  return (
    <li className={`order-card${isSelected ? ' order-card--selected' : ''}`}>
      <div className="order-card-banner">
        {restaurant?.image
          ? <img src={restaurant.image} alt={restName} />
          : <span className="order-card-banner-emoji" aria-hidden="true">🍽</span>
        }
      </div>
      <div className="order-card-top">
        <button className="order-card-restaurant order-card-restaurant--link" onClick={onAddMore}>
          {restName}
        </button>
        <div className="order-card-top-right">
          {!editMode && <span className="order-status order-status--cart">In Cart</span>}
          {editMode ? (
            <button
              className={`order-card__checkbox${isSelected ? ' order-card__checkbox--checked' : ''}`}
              onClick={onToggleSelect}
              aria-label={isSelected ? 'Deselect' : 'Select'}
            />
          ) : (
            <button
              className="order-delete-btn"
              onClick={onDelete}
              aria-label="Remove cart"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      <div className="order-card-meta">
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        <span className="order-card-sep">·</span>
        <span>₪{total}</span>
      </div>

      {!editMode && (
        <div className="order-card-actions">
          <button className="order-continue-btn" onClick={onAddMore}>
            Add more
          </button>
          <button className="order-checkout-btn" onClick={onCheckout}>
            Go to checkout
          </button>
        </div>
      )}
    </li>
  );
}

function OrderCard({ order, restaurant, onDelete, isDeleting, editMode, isSelected, onToggleSelect }) {
  const navigate  = useNavigate();
  const restName  = restaurant?.name ?? 'Restaurant';
  const itemCount = order.items?.length ?? 0;
  const total     = typeof order.pricing?.total === 'number' ? order.pricing.total.toFixed(2) : '—';

  function handleOrderAgain() {
    navigate(`/restaurant/${order.restaurantId}`, { state: { reorderItems: order.items } });
  }

  return (
    <li className={`order-card${isSelected ? ' order-card--selected' : ''}`}>
      <div className="order-card-banner">
        {restaurant?.image
          ? <img src={restaurant.image} alt={restName} />
          : <span className="order-card-banner-emoji" aria-hidden="true">🍽</span>
        }
      </div>
      <div className="order-card-top">
        <button className="order-card-restaurant order-card-restaurant--link" onClick={() => navigate(`/restaurant/${order.restaurantId}`)}>
          {restName}
        </button>
        <div className="order-card-top-right">
          {!editMode && (
            <span className={`order-status order-status--${displayStatus(order.status)}`}>
              {statusLabel(order.status)}
            </span>
          )}
          {editMode ? (
            <button
              className={`order-card__checkbox${isSelected ? ' order-card__checkbox--checked' : ''}`}
              onClick={onToggleSelect}
              aria-label={isSelected ? 'Deselect' : 'Select'}
            />
          ) : (
            <button
              className="order-delete-btn"
              onClick={() => onDelete(order.id)}
              disabled={isDeleting}
              aria-label="Delete order"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      <div className="order-card-meta">
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        <span className="order-card-sep">·</span>
        <span>₪{total}</span>
      </div>

      <div className="order-card-date">{formatDate(order.createdAt)}</div>

      {!editMode && (
        <div className="order-card-actions">
          <button className="order-checkout-btn" onClick={handleOrderAgain}>
            Order again
          </button>
        </div>
      )}
    </li>
  );
}
