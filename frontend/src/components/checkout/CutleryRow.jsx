import { CutleryIcon, PlusIcon, MinusIcon } from '../icons';

// Cutlery is a quantity (number of sets), not a yes/no — the server accepts any count.
export default function CutleryRow({ value, onChange }) {
  return (
    <section className="checkout-section">
      <div className="checkout-card">
        <div className="checkout-row">
          <CutleryIcon size={20} />
          <div className="checkout-row__main">
            <p className="checkout-row__label">Add cutlery (+₪0.00)</p>
            <p className="checkout-row__sub">
              Let's reduce waste — request only as many sets as you need.
            </p>
          </div>
          <div className="checkout-item__stepper">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, value - 1))}
              disabled={value <= 0}
              aria-label="Fewer cutlery sets"
            >
              <MinusIcon size={16} />
            </button>
            <span className="checkout-item__qty">{value}</span>
            <button
              type="button"
              onClick={() => onChange(value + 1)}
              aria-label="More cutlery sets"
            >
              <PlusIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
