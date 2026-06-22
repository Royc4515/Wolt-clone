import { money } from '../../utils/checkout';
import { formatDate } from '../../utils/orders';
import OrderStatusControl from './OrderStatusControl';

// One restaurant order in the admin orders list: placed time, fulfilment mode,
// item lines (name × qty), total, and the status control. Item names are
// resolved from `menuMap` (productId → product); unknown ids fall back to the id.
export default function AdminOrderCard({ order, menuMap, onStatusChange, updating }) {
  const items = order.items || [];
  const total = typeof order.pricing?.total === 'number' ? money(order.pricing.total) : '—';
  const isDelivery = order.mode === 'delivery';

  return (
    <li className="admin-order">
      <div className="admin-order__head">
        <span className="admin-order__time">{formatDate(order.createdAt)}</span>
        <span className={`admin-order__mode admin-order__mode--${isDelivery ? 'delivery' : 'pickup'}`}>
          {isDelivery ? 'Delivery' : 'Pickup'}
        </span>
      </div>

      <ul className="admin-order__items">
        {items.map(({ productId, quantity }) => (
          <li key={productId} className="admin-order__item">
            <span className="admin-order__item-name">{menuMap?.get(productId)?.name ?? productId}</span>
            <span className="admin-order__item-qty">×{quantity}</span>
          </li>
        ))}
      </ul>

      <div className="admin-order__foot">
        <span className="admin-order__total">{total}</span>
        <OrderStatusControl
          status={order.status}
          onChange={(status) => onStatusChange(order.id, status)}
          updating={updating}
        />
      </div>
    </li>
  );
}
