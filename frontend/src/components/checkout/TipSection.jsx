import { useState } from 'react';
import { TIP_OPTIONS } from '../../utils/checkout';

export default function TipSection({ tip, onChange }) {
  const [customOpen, setCustomOpen] = useState(false);

  const isPreset = TIP_OPTIONS.includes(tip) && !customOpen;

  function selectPreset(value) {
    setCustomOpen(false);
    onChange(value);
  }

  return (
    <section className="checkout-section">
      <h2 className="checkout-section__title">Add courier tip</h2>
      <p className="checkout-tip__hint">
        Your tip will be shown to the courier within an hour. Wolt is not deducting
        anything from the tip other than VAT required by law.
      </p>
      <div className="checkout-tip__pills" role="group" aria-label="Courier tip">
        {TIP_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={isPreset && tip === value}
            className={`checkout-pill${isPreset && tip === value ? ' checkout-pill--active' : ''}`}
            onClick={() => selectPreset(value)}
          >
            ₪{value}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={customOpen}
          className={`checkout-pill${customOpen ? ' checkout-pill--active' : ''}`}
          onClick={() => setCustomOpen(true)}
        >
          Other
        </button>
      </div>
      {customOpen && (
        <input
          type="number"
          min="0"
          className="checkout-tip__custom"
          placeholder="Enter tip amount (₪)"
          aria-label="Custom tip amount"
          value={Number.isFinite(tip) ? tip : ''}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        />
      )}
    </section>
  );
}
