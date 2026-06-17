import { Link } from 'react-router-dom';
import { BikeIcon } from './icons';
import { CATEGORY_EMOJI, hashIndex } from '../utils/restaurantDisplay';
import './SearchRestaurantCard.css';

// Restaurant result card shared by the search dropdown (variant="compact") and
// the search results page (variant="full"). Renders as a <button> when an
// onClick handler is supplied, otherwise as a <Link> to the restaurant page.
export default function SearchRestaurantCard({ restaurant: r, variant = 'full', onClick }) {
  const inner = (
    <>
      <div className="search-rest-card__img">
        {r.image
          ? <img src={r.image} alt={r.name} />
          : (
            <div
              className={`search-rest-card__placeholder search-rest-card__placeholder--c${hashIndex(r.name)}`}
              aria-hidden="true"
            >
              <span>{CATEGORY_EMOJI[r.category] || '🍽️'}</span>
            </div>
          )
        }
      </div>
      <div className="search-rest-card__body">
        <div className="search-rest-card__header-row">
          <span className="search-rest-card__name">{r.name}</span>
        </div>
        {r.category && <span className="search-rest-card__category">{r.category}</span>}
        <div className="search-rest-card__footer">
          <BikeIcon size={variant === 'compact' ? 13 : 14} />
          {r.deliveryFee != null && (
            <span className="search-rest-card__fee">
              {r.deliveryFee === 0 ? 'Free' : `₪${r.deliveryFee}`}
            </span>
          )}
          {r.deliveryTime && (
            <>
              <span className="search-rest-card__dot" aria-hidden="true">·</span>
              <span className="search-rest-card__time">{r.deliveryTime}</span>
            </>
          )}
        </div>
      </div>
    </>
  );

  const className = `search-rest-card search-rest-card--${variant}`;
  return onClick
    ? <button type="button" className={className} onClick={() => onClick(r)}>{inner}</button>
    : <Link to={`/restaurant/${r.id}`} className={className}>{inner}</Link>;
}
