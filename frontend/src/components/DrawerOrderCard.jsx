import React from 'react';
import { TrashIcon } from './icons';
import { statusLabel, formatDate } from '../utils/orders';

const MAX_THUMBS = 5;

function DrawerOrderCard({ order, restaurant, menuMap, onViewDetails, onOrderAgain, onDelete, isDeleting, editMode, isSelected, onToggleSelect, onRestaurantClick }) {
  const restName = restaurant?.name ?? 'Restaurant';
  const total = typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : '—';

  const itemsWithData = (order.items || [])
    .map(({ productId, quantity }) => ({ item: menuMap?.get(productId), qty: quantity }))
    .filter(e => e.item);
  const visible = itemsWithData.slice(0, MAX_THUMBS);
  const overflow = itemsWithData.length - MAX_THUMBS;

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
          <span className="od-card__rest-sub">
            {statusLabel(order.status)} · {formatDate(order.createdAt)}
          </span>
        </div>
        {editMode ? (
          <button
            className={`od-card__checkbox${isSelected ? ' od-card__checkbox--checked' : ''}`}
            onClick={onToggleSelect}
            aria-label={isSelected ? 'Deselect' : 'Select'}
          />
        ) : (
          <button className="od-card__trash" onClick={onDelete} disabled={isDeleting} aria-label="Delete order">
            <TrashIcon />
          </button>
        )}
      </div>

      <div className="od-card__divider" />

      {visible.length > 0 && (
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
      )}

      <p className="od-card__price-line">Total: ₪{total}</p>

      {!editMode && (
        <div className="od-card__actions">
          <button className="od-card__btn od-card__btn--secondary" onClick={onViewDetails}>
            View details
          </button>
          <button className="od-card__btn od-card__btn--primary" onClick={onOrderAgain}>
            Order again
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(DrawerOrderCard);
