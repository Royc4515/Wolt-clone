import { useState } from 'react';
import { TagIcon } from '../icons';

// Promo / gift-card field. There are no live codes, so any submission is
// reported as invalid — but the field behaves like the real thing.
export default function PromoField() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(`"${trimmed}" isn't a valid or active code.`);
  }

  return (
    <form className="checkout-row checkout-row--divider checkout-row--promo" onSubmit={handleSubmit}>
      <TagIcon size={20} />
      <div className="checkout-promo__field">
        <input
          className="checkout-note"
          placeholder="Enter gift card or promo code"
          aria-label="Gift card or promo code"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
        />
        {error && <p className="checkout-promo__error" role="alert">{error}</p>}
      </div>
      <button type="submit" className="checkout-promo-btn" disabled={!code.trim()}>
        Submit
      </button>
    </form>
  );
}
