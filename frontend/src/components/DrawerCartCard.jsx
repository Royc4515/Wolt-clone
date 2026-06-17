import React from 'react';
import { TrashIcon } from './icons';

const MAX_THUMBS = 5;

function DrawerCartCard({ cart, restaurant, onAddMore, onCheckout, onDelete, isCheckingOut, editMode, isSelected, onToggleSelect, onRestaurantClick }) {
  const restName = restaurant?.name ?? 'Restaurant';
  const subtotal = cart.items.reduce((s, e) => s + e.item.price * e.qty, 0).toFixed(2);
  const visible = cart.items.slice(0, MAX_THUMBS);
  const overflow = cart.items.length - MAX_THUMBS;

  return (
    <div className={`od-card${isSelected ? ' od-card--selected' : ''}`}>
      <div className="od-card__top">
        <div className="od-card__rest-img">
          {restaurant?.image
            ? <img src={restaurant.image} alt={restName} />
            : <span className="od-card__rest-emoji" aria-hidden="true">🍽</span>
          }
        </div>
        <div className="od-card__rest-info">
          <button className="od-card__rest-name od-card__rest-name--link" onClick={onRestaurantClick}>
            {restName}
          </button>
          {restaurant?.deliveryTime && (
            <span className="od-card__rest-sub">Delivery in {restaurant.deliveryTime}</span>
          )}
        </div>
        {editMode ? (
          <button
            className={`od-card__checkbox${isSelected ? ' od-card__checkbox--checked' : ''}`}
            onClick={onToggleSelect}
            aria-label={isSelected ? 'Deselect' : 'Select'}
          />
        ) : (
          <button className="od-card__trash" onClick={onDelete} aria-label="Remove cart">
            <TrashIcon />
          </button>
        )}
      </div>

      <div className="od-card__divider" />

      <div className="od-card__thumbs">
        {visible.map(({ item }) => (
          <div key={item.id} className="od-card__thumb">
            {item.image
              ? <img src={item.image} alt={item.name} />
              : <span aria-hidden="true">🍽</span>
            }
          </div>
        ))}
        {overflow > 0 && <div className="od-card__thumb od-card__thumb--overflow">+{overflow}</div>}
      </div>

      <p className="od-card__price-line">Item subtotal: ₪{subtotal}</p>

      {!editMode && (
        <div className="od-card__actions">
          <button className="od-card__btn od-card__btn--secondary" onClick={onAddMore}>
            Add more items
          </button>
          <button className="od-card__btn od-card__btn--primary" onClick={onCheckout} disabled={isCheckingOut}>
            {isCheckingOut ? 'Placing…' : 'Go to checkout'}
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(DrawerCartCard);
