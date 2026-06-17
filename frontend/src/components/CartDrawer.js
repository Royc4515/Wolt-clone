import { useState, useRef } from 'react';
import './CartDrawer.css';

const SCROLL_THRESHOLD_PX = 20;

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

export default function CartDrawer({ items, count, total, onClose, onCheckout, onUpdateQty, onItemClick }) {
  const [expandedId, setExpandedId] = useState(null);
  const [bodyScrolled, setBodyScrolled] = useState(false);
  const bodyRef = useRef(null);

  function handleStepperToggle(e, itemId) {
    e.stopPropagation();
    setExpandedId(id => id === itemId ? null : itemId);
  }

  function handleQtyChange(e, itemId, newQty) {
    e.stopPropagation();
    onUpdateQty(itemId, newQty);
    if (newQty <= 0) setExpandedId(null);
  }

  function handleDelete(e, itemId) {
    e.stopPropagation();
    onUpdateQty(itemId, 0);
    setExpandedId(null);
  }

  return (
    <>
      <div className="cart-drawer__backdrop" onClick={onClose} />
      <aside className="cart-drawer" aria-label="Your order" onClick={() => setExpandedId(null)}>
        <div className={`cart-drawer__header${bodyScrolled ? ' cart-drawer__header--scrolled' : ''}`}>
          <div className="cart-drawer__header-spacer" />
          {bodyScrolled
            ? <span className="cart-drawer__scroll-title">Your order</span>
            : <div className="cart-drawer__header-spacer" />
          }
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close cart">
            <XIcon />
          </button>
        </div>

        <div
          className="cart-drawer__body"
          ref={bodyRef}
          onScroll={e => setBodyScrolled(e.target.scrollTop > SCROLL_THRESHOLD_PX)}
        >
          <h2 className="cart-drawer__title">Your order</h2>
          {items.map(({ item, qty }) => {
            const expanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="cart-drawer__item"
                onClick={() => onItemClick && onItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') onItemClick && onItemClick(item); }}
              >
                <div className="cart-drawer__item-img">
                  {item.image
                    ? <img src={item.image} alt={item.name} />
                    : <span className="cart-drawer__item-emoji" aria-hidden="true">🍽</span>
                  }
                </div>
                <div className="cart-drawer__item-info">
                  <p className="cart-drawer__item-name">{item.name}</p>
                  <p className="cart-drawer__item-price">₪{(item.price * qty).toFixed(0)}</p>
                </div>

                <div className="cart-drawer__stepper-area" onClick={e => handleStepperToggle(e, item.id)}>
                  {expanded ? (
                    <div className="cart-drawer__stepper">
                      <button
                        type="button"
                        className="cart-drawer__stepper-btn"
                        onClick={e => handleQtyChange(e, item.id, qty - 1)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className="cart-drawer__stepper-qty">{qty}</span>
                      <button
                        type="button"
                        className="cart-drawer__stepper-btn"
                        onClick={e => handleQtyChange(e, item.id, qty + 1)}
                        disabled={qty >= item.maxQty}
                        aria-label="Increase quantity"
                      >+</button>
                      <button
                        type="button"
                        className="cart-drawer__stepper-btn cart-drawer__stepper-btn--trash"
                        onClick={e => handleDelete(e, item.id)}
                        aria-label="Remove item"
                      ><TrashIcon /></button>
                    </div>
                  ) : (
                    <div className="cart-drawer__qty-badge">{qty}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-drawer__footer">
          <button type="button" className="cart-drawer__checkout-btn" onClick={onCheckout}>
            <span className="cart-drawer__checkout-count">{count}</span>
            <span className="cart-drawer__checkout-label">Go to checkout</span>
            <span className="cart-drawer__checkout-total">₪{total}</span>
          </button>
          <p className="cart-drawer__fees">Estimated service &amp; delivery fees</p>
        </div>
      </aside>
    </>
  );
}
