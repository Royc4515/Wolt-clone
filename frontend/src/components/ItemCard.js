import { Link } from 'react-router-dom';
import { BikeIcon } from './icons';
import './ItemCard.css';

const SmileyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default function ItemCard({ product: p, onClick }) {
  const inner = (
    <>
      <div className="item-card__img-wrap">
        {p.image && <img src={p.image} alt={p.name} />}
      </div>
      <div className="item-card__info">
        {p.price != null && <span className="item-card__price">₪{p.price}</span>}
        <span className="item-card__name">{p.name}</span>
        {p.restaurantName && (
          <div className="item-card__rest-row">
            {p.restId && !onClick
              ? <Link to={`/restaurant/${p.restId}`} className="item-card__rest-name">{p.restaurantName}</Link>
              : <span className="item-card__rest-name item-card__rest-name--plain">{p.restaurantName}</span>
            }
            {p.restaurantCoords && (
              <>
                <span className="item-card__sep" aria-hidden="true">|</span>
                <span className="item-card__location">{p.restaurantCoords}</span>
              </>
            )}
          </div>
        )}
        <div className="item-card__footer">
          <BikeIcon />
          {p.deliveryFee != null && (
            <span>{p.deliveryFee === 0 ? 'Free' : `₪${p.deliveryFee}`}</span>
          )}
          {p.deliveryTime && (
            <>
              <span className="item-card__dot" aria-hidden="true">·</span>
              <span>{p.deliveryTime}</span>
            </>
          )}
          {p.rating != null && (
            <>
              <span className="item-card__dot" aria-hidden="true">·</span>
              <SmileyIcon />
              <span>{p.rating}</span>
            </>
          )}
        </div>
      </div>
    </>
  );

  return onClick
    ? <button className="item-card" onClick={() => onClick(p)}>{inner}</button>
    : <div className="item-card">{inner}</div>;
}
