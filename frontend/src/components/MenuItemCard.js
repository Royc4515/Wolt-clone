import { hashColor } from '../utils/colorHash';
import useTheme from '../hooks/useTheme';
import './MenuItemCard.css';

export default function MenuItemCard({ item, qty, onAdd, onRemove, onCardClick }) {
  const { name, price, image, description, maxQty } = item;
  const atMax = maxQty != null && qty >= maxQty;
  const bgColor = hashColor(item.id);
  const isLight = useTheme() === 'light';

  return (
    <article
      className="menu-item-card"
      onClick={onCardClick}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={onCardClick ? e => { if (e.key === 'Enter' || e.key === ' ') onCardClick(); } : undefined}
      aria-label={onCardClick ? `View ${name} details` : undefined}
    >
      <div
        className="menu-item-card__image"
        style={!image && !isLight ? { background: bgColor } : undefined}
      >
        {image
          ? <img src={image} alt={name} />
          : <span className="menu-item-card__emoji" aria-hidden="true">🍽</span>
        }

        {/* Corner badge — always visible: shows + when empty, count when in cart */}
        <button
          type="button"
          className="menu-item-card__qty-badge"
          onClick={e => { e.stopPropagation(); onAdd(); }}
          disabled={atMax && qty > 0}
          aria-label={qty === 0 ? `Add ${name}` : `Add another ${name}`}
        >
          {qty === 0 ? '+' : qty}
        </button>

        {/* Stepper — only when qty > 0, appears on hover */}
        {qty > 0 && (
          <div className="menu-item-card__qty-ctrl">
            <button
              type="button"
              className="menu-item-card__qty-btn"
              onClick={e => { e.stopPropagation(); onRemove(); }}
              aria-label={`Remove one ${name}`}
            >−</button>
            <span className="menu-item-card__qty-num">{qty}</span>
            <button
              type="button"
              className="menu-item-card__qty-btn"
              onClick={e => { e.stopPropagation(); onAdd(); }}
              disabled={atMax}
              aria-label={`Add another ${name}`}
            >+</button>
          </div>
        )}
      </div>

      <div className="menu-item-card__body">
        <span className="menu-item-card__price">₪{price.toFixed(2)}</span>
        <h3 className="menu-item-card__name">{name}</h3>
        {description && (
          <p className="menu-item-card__desc">{description}</p>
        )}
      </div>
    </article>
  );
}
