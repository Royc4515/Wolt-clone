import { CutleryIcon, PlusIcon } from '../icons';

export default function CutleryRow({ value, onToggle }) {
  return (
    <section className="checkout-section">
      <div className="checkout-card">
        <div className="checkout-row">
          <CutleryIcon size={20} />
          <div className="checkout-row__main">
            <p className="checkout-row__label">Add cutlery (+₪0.00)</p>
            <p className="checkout-row__sub">
              Let's reduce waste — request cutlery only if you really need them.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={value}
            aria-label="Add cutlery"
            className={`checkout-pluschip${value ? ' checkout-pluschip--on' : ''}`}
            onClick={onToggle}
          >
            <PlusIcon size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
