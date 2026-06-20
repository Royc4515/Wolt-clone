import { useState } from 'react';
import { money } from '../../utils/checkout';

function Row({ label, value, testid, strike }) {
  return (
    <div className={`checkout-summary__row${strike ? ' checkout-summary__row--muted' : ''}`}>
      <span>{label}</span>
      <span data-testid={testid}>{value}</span>
    </div>
  );
}

export default function OrderSummary({
  totals,
  mode,
  orderLabel,
  onPlaceOrder,
  placing,
  canPlace,
}) {
  const isDelivery = mode === 'delivery';
  const [feesOpen, setFeesOpen] = useState(false);

  return (
    <aside className="checkout-summary" aria-label="Order summary">
      <h2 className="checkout-summary__title">Summary</h2>
      <p className="checkout-summary__sub">incl. taxes (if applicable)</p>
      <button
        type="button"
        className="checkout-summary__fees"
        aria-expanded={feesOpen}
        onClick={() => setFeesOpen((o) => !o)}
      >
        How fees work
      </button>
      {feesOpen && (
        <p className="checkout-summary__fees-note">
          The service fee helps us run the platform; the delivery fee depends on the
          distance to you. Pickup orders have no delivery fee.
        </p>
      )}

      <div className="checkout-summary__rows">
        <Row label="Item subtotal" value={money(totals.subtotal)} testid="checkout-subtotal" />
        <Row label="Service fee" value={money(totals.serviceFee)} testid="checkout-service-fee" />
        {isDelivery && (
          <Row
            label="Delivery"
            value={totals.deliveryFee === 0 ? 'Free' : money(totals.deliveryFee)}
            testid="checkout-delivery-fee"
          />
        )}
        {totals.tip > 0 && (
          <Row label="Courier tip" value={money(totals.tip)} testid="checkout-tip" />
        )}
      </div>

      <div className="checkout-summary__total">
        <span>Total</span>
        <span data-testid="checkout-total">{money(totals.total)}</span>
      </div>

      {/* Wolt+ promo — decorative */}
      <div className="checkout-woltplus" aria-hidden="true">
        <span className="checkout-woltplus__badge">Wolt+</span>
        <p className="checkout-woltplus__text">Get ₪0 delivery fee and more with Wolt+.</p>
      </div>

      <button
        type="button"
        data-testid="place-order-btn"
        className="checkout-summary__order"
        onClick={onPlaceOrder}
        disabled={!canPlace}
      >
        {placing ? 'Placing order…' : orderLabel}
      </button>
    </aside>
  );
}
