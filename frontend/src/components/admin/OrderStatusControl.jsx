import { ADMIN_STATUS_FLOW, adminStatusLabel } from '../../utils/orders';

// Segmented pill group letting a restaurant admin advance an order through the
// Pending → Preparing → Delivered lifecycle. The current step is marked
// (aria-pressed) and disabled; every other step is selectable. While an update
// is in flight the whole group is disabled.
export default function OrderStatusControl({ status, onChange, updating }) {
  return (
    <div className="admin-order__status" role="group" aria-label="Order status">
      {ADMIN_STATUS_FLOW.map((step) => {
        const isCurrent = step === status;
        return (
          <button
            key={step}
            type="button"
            className={`admin-order__status-btn${isCurrent ? ' admin-order__status-btn--active' : ''}`}
            aria-pressed={isCurrent}
            disabled={updating || isCurrent}
            onClick={() => onChange(step)}
          >
            {adminStatusLabel(step)}
          </button>
        );
      })}
    </div>
  );
}
