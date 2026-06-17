import { useRef } from 'react';
import { XIcon, BackIcon } from './icons';
import { statusLabel, formatDate } from '../utils/orders';
import useOutsideClick from '../hooks/useOutsideClick';

export default function OrderDetailView({ order, restaurant, menuMap, onBack, onClose }) {
  const restName = restaurant?.name ?? 'Restaurant';
  const total = typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : '—';
  const panelRef = useRef(null);
  useOutsideClick(panelRef, true, onClose, onClose);

  return (
    <>
      <div className="od__backdrop" />
      <aside className="od__panel" ref={panelRef}>
        <div className="od__header od__header--detail">
          <button className="od__back-btn" onClick={onBack} aria-label="Back">
            <BackIcon />
          </button>
          <button className="od__close-btn" onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>

        <div className="od__body">
          <h2 className="od__detail-title">{restName}</h2>
          <div className="od__detail-meta">
            <span>Order placed: {formatDate(order.createdAt)}</span>
            <span className={`od__detail-status od__detail-status--${order.status}`}>
              {statusLabel(order.status)}
            </span>
          </div>
          {order.id && <p className="od__detail-row">Order ID: {order.id}</p>}

          <h3 className="od__detail-items-heading">Items</h3>
          <div className="od__detail-items-divider" />

          {(order.items || []).map(({ productId, quantity }) => {
            const item = menuMap?.get(productId);
            const name = item?.name ?? productId;
            const price = item?.price ?? 0;
            return (
              <div key={productId} className="od__detail-item">
                <span className="od__detail-item-name">{name}</span>
                <span className="od__detail-item-price">₪{price.toFixed(2)}</span>
                <span className="od__detail-item-qty">×{quantity}</span>
                <span className="od__detail-item-total">₪{(price * quantity).toFixed(2)}</span>
              </div>
            );
          })}

          <div className="od__detail-total">Total: ₪{total}</div>
        </div>
      </aside>
    </>
  );
}
