import { useState, useMemo } from 'react';

const OPTIONS = [
  { id: 'standard', label: 'Standard' },
  { id: 'schedule', label: 'Schedule' },
];

// Build a handful of upcoming 15-minute slots starting from "now".
function buildSlots() {
  const start = new Date();
  start.setMinutes(Math.ceil((start.getMinutes() + 1) / 15) * 15, 0, 0);
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(start.getTime() + i * 15 * 60000);
    return t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  });
}

export default function WhenSection({ when, onChange, deliveryTime }) {
  const slots = useMemo(buildSlots, []);
  const [slot, setSlot] = useState(slots[0]);

  const subFor = (id) => {
    if (id === 'standard') return deliveryTime || '10–15 min';
    return when === 'schedule' && slot ? `Today, ${slot}` : 'Choose a time';
  };

  return (
    <section className="checkout-section">
      <h2 className="checkout-section__title">When?</h2>
      <div className="checkout-radios">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={when === o.id}
            className={`checkout-radio${when === o.id ? ' checkout-radio--active' : ''}`}
            onClick={() => onChange(o.id)}
          >
            <span className="checkout-radio__dot" aria-hidden="true" />
            <span className="checkout-radio__main">
              <span className="checkout-radio__label">{o.label}</span>
              <span className="checkout-radio__sub">{subFor(o.id)}</span>
            </span>
          </button>
        ))}
      </div>

      {when === 'schedule' && (
        <select
          className="checkout-schedule"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          aria-label="Pick a delivery time"
        >
          {slots.map((s) => (
            <option key={s} value={s}>Today, {s}</option>
          ))}
        </select>
      )}
    </section>
  );
}
