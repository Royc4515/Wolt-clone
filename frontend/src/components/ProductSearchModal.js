import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurant } from '../api/restaurants';
import './ProductSearchModal.css';

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function ProductSearchModal({ product, onClose }) {
  const [restaurant, setRestaurant] = useState(null);
  const [loadingRest, setLoadingRest] = useState(true);
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  useEffect(() => {
    setLoadingRest(true);
    getRestaurant(product.restId)
      .then(setRestaurant)
      .catch(() => setRestaurant(null))
      .finally(() => setLoadingRest(false));
  }, [product.restId]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  function handleStartOrdering() {
    navigate(`/restaurant/${product.restId}`, {
      state: { reorderItems: [{ productId: product.id, quantity: 1 }] },
    });
    onClose();
  }

  function handleGoToRestaurant() {
    navigate(`/restaurant/${product.restId}`);
    onClose();
  }

  return (
    <div className="psm__overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="psm__card" role="dialog" aria-modal="true">
        <button className="psm__close" onClick={onClose} aria-label="Close">✕</button>

        {product.image && (
          <div className="psm__img-wrap">
            <img src={product.image} alt={product.name} className="psm__img" />
          </div>
        )}

        <div className="psm__body">
          <h2 className="psm__name">{product.name}</h2>
          {product.price != null && (
            <p className="psm__price">₪{Number(product.price).toFixed(2)}</p>
          )}
          {product.description && (
            <p className="psm__desc">{product.description}</p>
          )}

          <div className="psm__rest-section">
            <span className="psm__rest-label">ORDER FROM</span>

            {loadingRest && <div className="psm__rest-loading">Loading…</div>}

            {!loadingRest && restaurant && (
              <button className="psm__rest-card" onClick={handleGoToRestaurant}>
                {restaurant.image && (
                  <img src={restaurant.image} alt={restaurant.name} className="psm__rest-img" />
                )}
                <div className="psm__rest-info">
                  <span className="psm__rest-name">{restaurant.name}</span>
                  <div className="psm__rest-meta">
                    {restaurant.deliveryFee != null && (
                      <span>₪{restaurant.deliveryFee}</span>
                    )}
                    {restaurant.deliveryTime && (
                      <span className="psm__rest-meta-item">
                        <ClockIcon /> {restaurant.deliveryTime}
                      </span>
                    )}
                    {restaurant.rating != null && (
                      <span className="psm__rest-meta-item">
                        <StarIcon /> {restaurant.rating}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight />
              </button>
            )}
          </div>
        </div>

        <div className="psm__footer">
          <button className="psm__start-btn" onClick={handleStartOrdering}>
            Start ordering
          </button>
        </div>
      </div>
    </div>
  );
}
