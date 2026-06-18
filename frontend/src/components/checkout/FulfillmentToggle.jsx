import { BikeIcon, WalkIcon } from '../icons';

export default function FulfillmentToggle({ mode, onChange }) {
  return (
    <div className="checkout-toggle" role="tablist" aria-label="Fulfillment method">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'delivery'}
        className={`checkout-toggle__btn${mode === 'delivery' ? ' checkout-toggle__btn--active' : ''}`}
        onClick={() => onChange('delivery')}
      >
        <BikeIcon size={18} />
        <span>Delivery</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'pickup'}
        className={`checkout-toggle__btn${mode === 'pickup' ? ' checkout-toggle__btn--active' : ''}`}
        onClick={() => onChange('pickup')}
      >
        <WalkIcon size={18} />
        <span>Pickup</span>
      </button>
    </div>
  );
}
