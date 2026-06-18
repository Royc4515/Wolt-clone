import { PAYMENT_METHODS } from '../../utils/checkout';
import { CardIcon } from '../icons';
import PromoField from './PromoField';

export default function PaymentSection({ method, onChange }) {
  return (
    <section className="checkout-section">
      <h2 className="checkout-section__title">Payment</h2>
      <div className="checkout-card">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={method === m.id}
            className={`checkout-row checkout-row--divider checkout-pay${method === m.id ? ' checkout-pay--selected' : ''}`}
            onClick={() => onChange(m.id)}
          >
            <CardIcon size={20} />
            <span className="checkout-row__label">{m.label}</span>
            <span className={`checkout-radio__dot${method === m.id ? ' checkout-radio__dot--active' : ''}`} aria-hidden="true" />
          </button>
        ))}

        <PromoField />
      </div>
    </section>
  );
}
