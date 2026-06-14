import { Link } from 'react-router-dom';

const SmileyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const PriceTagIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
);

const CATEGORY_EMOJI = {
  Pizza: '🍕', Sushi: '🍣', Burgers: '🍔', Asian: '🥡',
  Salads: '🥗', Pasta: '🍝', Desserts: '🍰', Mexican: '🌮',
};

function hashIndex(str) {
  return str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 8;
}

export default function RestaurantCard({ id, name, description, image, category, rating, deliveryTime, deliveryFee, isPromoted }) {

  return (
    <Link to={`/restaurant/${id}`} className="restaurant-card" aria-label={name}>
      <div className="restaurant-card__image">
        {image
          ? <img src={image} alt={name} />
          : (
            <div
              className={`restaurant-card__placeholder restaurant-card__placeholder--c${hashIndex(name)}`}
              aria-hidden="true"
            >
              <span className="restaurant-card__placeholder-emoji">{CATEGORY_EMOJI[category] || '🍽️'}</span>
            </div>
          )
        }

        {isPromoted && (
          <span className="restaurant-card__badge restaurant-card__badge--promoted">Promoted</span>
        )}
        <div className="restaurant-card__pills">
          <span className="restaurant-card__pill">
            <PriceTagIcon />
            {deliveryFee === 0 ? 'Free delivery' : `₪${deliveryFee} delivery fee`}
          </span>
        </div>
      </div>

      <div className="restaurant-card__body">
        <div className="restaurant-card__header-row">
          <h3 className="restaurant-card__name">{name}</h3>
          <div className="restaurant-card__time-box">
            {deliveryTime}
          </div>
        </div>
        {description && <p className="restaurant-card__description">{description}</p>}
        <div className="restaurant-card__footer">
          <span className="restaurant-card__fee">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-4l-2 6h10l-2-6h-2z"/><path d="M5.5 14L8 8"/></svg>
            {deliveryFee === 0 ? '₪0.00' : `₪${deliveryFee}`}
          </span>
          <span className="restaurant-card__dot" aria-hidden="true">·</span>
          <span className="restaurant-card__rating"><SmileyIcon /> {rating}</span>
          <span className="restaurant-card__dot" aria-hidden="true">·</span>
          <span className="restaurant-card__category">{category}</span>
        </div>
      </div>
    </Link>
  );
}
