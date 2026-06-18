import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cancelOrder } from '../api/orders';
import { XIcon } from './icons';
import useOutsideClick from '../hooks/useOutsideClick';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import useOrdersData from '../hooks/useOrdersData';
import DrawerCartCard from './DrawerCartCard';
import DrawerOrderCard from './DrawerOrderCard';
import OrderDetailView from './OrderDetailView';
import './OrdersDrawer.css';

const SCROLL_THRESHOLD_PX = 4;

export default function OrdersDrawer({ onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  useOutsideClick(panelRef, true, onClose, onClose);
  useBodyScrollLock();

  const [tab, setTab] = useState('carts');
  const [detailOrder, setDetailOrder] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bodyScrolled, setBodyScrolled] = useState(false);

  const { localCarts, orders, restaurants, menuMaps, loading, error, setLocalCarts, setOrders } =
    useOrdersData({ withMenus: true });

  const currentIds = tab === 'carts'
    ? localCarts.map(c => c.restaurantId)
    : orders.map(o => o.id);
  const allSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.has(id));

  function enterEdit() { setEditMode(true); setSelectedIds(new Set()); }
  function cancelEdit() { setEditMode(false); setSelectedIds(new Set()); }

  function handleTabChange(next) {
    setTab(next);
    setSelectedIds(new Set());
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(currentIds));
  }

  function handleCheckoutCart(cart) {
    onClose();
    navigate(`/checkout/${cart.restaurantId}`);
  }

  function handleDeleteCart(restaurantId) {
    localStorage.removeItem(`cart_${restaurantId}`);
    setLocalCarts(prev => prev.filter(c => c.restaurantId !== restaurantId));
  }

  async function handleDeleteOrder(id) {
    setDeletingId(id);
    try {
      await cancelOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error('Failed to delete order', err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteSelected() {
    if (tab === 'carts') {
      selectedIds.forEach(restId => localStorage.removeItem(`cart_${restId}`));
      setLocalCarts(prev => prev.filter(c => !selectedIds.has(c.restaurantId)));
      setSelectedIds(new Set());
      setEditMode(false);
    } else {
      setDeletingId('bulk');
      try {
        await Promise.all([...selectedIds].map(id => cancelOrder(id)));
        setOrders(prev => prev.filter(o => !selectedIds.has(o.id)));
        setSelectedIds(new Set());
        setEditMode(false);
      } catch (err) {
        console.error('Failed to delete orders', err);
      } finally {
        setDeletingId(null);
      }
    }
  }

  const handleBodyScroll = useCallback(e => {
    setBodyScrolled(e.currentTarget.scrollTop > SCROLL_THRESHOLD_PX);
  }, []);

  if (detailOrder) {
    return (
      <OrderDetailView
        order={detailOrder}
        restaurant={restaurants[detailOrder.restaurantId]}
        menuMap={menuMaps[detailOrder.restaurantId]}
        onBack={() => setDetailOrder(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      <div className="od__backdrop" />
      <aside className="od__panel" ref={panelRef}>

        {editMode ? (
          <div className="od__edit-bar">
            <button className="od__select-all-btn" onClick={handleSelectAll}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <div className="od__edit-bar-right">
              <button className="od__cancel-edit-btn" onClick={cancelEdit}>Cancel</button>
              <button className="od__close-btn" onClick={onClose} aria-label="Close">
                <XIcon />
              </button>
            </div>
          </div>
        ) : (
          <div className={`od__header${bodyScrolled ? ' od__header--scrolled' : ''}`}>
            <div className="od__header-spacer" />
            <div className="od__header-center">
              {bodyScrolled && <span className="od__scroll-title">Your orders</span>}
            </div>
            <div className="od__header-actions">
              <button className="od__edit-btn" onClick={enterEdit}>Edit</button>
              <button className="od__close-btn" onClick={onClose} aria-label="Close">
                <XIcon />
              </button>
            </div>
          </div>
        )}

        <div className={`od__tabs${bodyScrolled ? ' od__tabs--scrolled' : ''}`}>
          <div className="od__tabs-track">
            <div className={`od__tabs-pill${tab === 'carts' ? ' od__tabs-pill--left' : ' od__tabs-pill--right'}`} />
            <button
              className={`od__tab${tab === 'carts' ? ' od__tab--active' : ''}`}
              onClick={() => handleTabChange('carts')}
            >
              Shopping carts
            </button>
            <button
              className={`od__tab${tab === 'orders' ? ' od__tab--active' : ''}`}
              onClick={() => handleTabChange('orders')}
            >
              Order again
            </button>
          </div>
        </div>

        <div className="od__body" onScroll={handleBodyScroll}>
          <h2 className="od__title">Your orders</h2>
          {error && <div className="od__error">{error}</div>}

          {loading ? (
            <div className="od__loading"><div className="od__spinner" /></div>
          ) : tab === 'carts' ? (
            localCarts.length === 0
              ? <p className="od__empty">No active shopping carts.</p>
              : localCarts.map(cart => (
                <DrawerCartCard
                  key={cart.restaurantId}
                  cart={cart}
                  restaurant={restaurants[cart.restaurantId]}
                  onAddMore={() => { onClose(); navigate(`/restaurant/${cart.restaurantId}`); }}
                  onCheckout={() => handleCheckoutCart(cart)}
                  onDelete={() => handleDeleteCart(cart.restaurantId)}
                  editMode={editMode}
                  isSelected={selectedIds.has(cart.restaurantId)}
                  onToggleSelect={() => toggleSelect(cart.restaurantId)}
                  onRestaurantClick={() => { onClose(); navigate(`/restaurant/${cart.restaurantId}`); }}
                />
              ))
          ) : (
            orders.length === 0
              ? <p className="od__empty">No past orders yet.</p>
              : orders.map(order => (
                <DrawerOrderCard
                  key={order.id}
                  order={order}
                  restaurant={restaurants[order.restaurantId]}
                  menuMap={menuMaps[order.restaurantId]}
                  onViewDetails={() => setDetailOrder(order)}
                  onOrderAgain={() => {
                    onClose();
                    navigate(`/restaurant/${order.restaurantId}`, { state: { reorderItems: order.items } });
                  }}
                  onDelete={() => handleDeleteOrder(order.id)}
                  isDeleting={deletingId === order.id}
                  editMode={editMode}
                  isSelected={selectedIds.has(order.id)}
                  onToggleSelect={() => toggleSelect(order.id)}
                  onRestaurantClick={() => { onClose(); navigate(`/restaurant/${order.restaurantId}`); }}
                />
              ))
          )}
        </div>

        {editMode && selectedIds.size > 0 && (
          <div className="od__edit-footer">
            <button
              className="od__delete-selected-btn"
              onClick={handleDeleteSelected}
              disabled={deletingId === 'bulk'}
            >
              {deletingId === 'bulk' ? 'Deleting…' : `Delete (${selectedIds.size})`}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
