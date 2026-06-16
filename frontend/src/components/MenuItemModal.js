import { useEffect, useRef } from 'react';
import { hashColor } from '../utils/colorHash';
import useTheme from '../hooks/useTheme';
import './MenuItemModal.css';

export default function MenuItemModal({ item, qty, onAdd, onRemove, onClose }) {
  const { name, price, image, description, maxQty } = item;
  const atMax = maxQty != null && qty >= maxQty;
  const bgColor = hashColor(item.id);
  const isLight = useTheme() === 'light';

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') onCloseRef.current(); }
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="item-modal__backdrop" onClick={onClose}>
      <div
        className="item-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={name}
      >
        {/* ── Image ── */}
        <div
          className="item-modal__image"
          style={!image && !isLight ? { background: bgColor } : undefined}
        >
          {image
            ? <img src={image} alt={name} />
            : <span className="item-modal__emoji" aria-hidden="true">🍽</span>
          }
          <button
            type="button"
            className="item-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Content ── */}
        <div className="item-modal__body">
          <h2 className="item-modal__name">{name}</h2>
          <span className="item-modal__price">₪{price.toFixed(2)}</span>
          {description && <p className="item-modal__desc">{description}</p>}
        </div>

        {/* ── Footer: stepper + add button ── */}
        <div className="item-modal__footer">
          <div className="item-modal__stepper">
            <button
              type="button"
              className="item-modal__step-btn"
              onClick={onRemove}
              disabled={qty === 0}
              aria-label="Remove one"
            >−</button>
            <span className="item-modal__qty">{qty}</span>
            <button
              type="button"
              className="item-modal__step-btn"
              onClick={onAdd}
              disabled={atMax}
              aria-label="Add one"
            >+</button>
          </div>
          <button
            type="button"
            className="item-modal__add-btn"
            onClick={onAdd}
            disabled={atMax}
          >
            Add to order &nbsp;₪{(price * Math.max(qty, 1)).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
