import './CartDrawer.css';

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function CartDrawer({ items, total, onClose, onCheckout, onUpdateQty, checkoutLabel = 'Go to checkout', checkoutLoading = false, error }) {
  const count = items.reduce((sum, e) => sum + e.qty, 0);

  return (
    <>
      <div className="cart-drawer__backdrop" onClick={onClose} />
      <aside className="cart-drawer" aria-label="Your order">
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Your order</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close cart">
            <XIcon />
          </button>
        </div>

        {error && <div className="cart-drawer__error">{error}</div>}

        <div className="cart-drawer__body">
          {items.map(({ item, qty }) => (
            <div key={item.id} className="cart-drawer__item">
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
              <div className="cart-drawer__stepper">
                <button
                  type="button"
                  className="cart-drawer__stepper-btn"
                  onClick={() => onUpdateQty(item.id, qty - 1)}
                  aria-label="Decrease quantity"
                >−</button>
                <span className="cart-drawer__stepper-qty">{qty}</span>
                <button
                  type="button"
                  className="cart-drawer__stepper-btn"
                  onClick={() => onUpdateQty(item.id, qty + 1)}
                  disabled={qty >= item.maxQty}
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-drawer__footer">
          <button type="button" className="cart-drawer__checkout-btn" onClick={onCheckout} disabled={checkoutLoading}>
            <span className="cart-drawer__checkout-count">{count}</span>
            <span className="cart-drawer__checkout-label">{checkoutLabel}</span>
            <span className="cart-drawer__checkout-total">₪{total}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
