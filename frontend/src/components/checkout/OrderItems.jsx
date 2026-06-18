import { PlusIcon, MinusIcon } from '../icons';
import { money } from '../../utils/checkout';

function CheckoutItem({ entry, onInc, onDec }) {
  const { item, qty } = entry;
  const atMax = qty >= (item.maxQty ?? Infinity);

  return (
    <li className="checkout-item">
      <div className="checkout-item__img">
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <span className="checkout-item__emoji" aria-hidden="true">🍽</span>
        )}
      </div>
      <div className="checkout-item__info">
        <p className="checkout-item__name">{item.name}</p>
        <p className="checkout-item__price">{money(item.price)}</p>
      </div>
      <div className="checkout-item__stepper">
        <button type="button" onClick={onDec} aria-label={`Decrease ${item.name}`}>
          <MinusIcon size={16} />
        </button>
        <span className="checkout-item__qty">{qty}</span>
        <button
          type="button"
          onClick={onInc}
          disabled={atMax}
          aria-label={`Increase ${item.name}`}
        >
          <PlusIcon size={16} />
        </button>
      </div>
    </li>
  );
}

export default function OrderItems({ items, onInc, onDec, onAddMore }) {
  return (
    <section className="checkout-section">
      <div className="checkout-section__head">
        <h2 className="checkout-section__title">Order items</h2>
        <button type="button" className="checkout-addmore" onClick={onAddMore}>
          <PlusIcon size={16} /> Add more
        </button>
      </div>
      <ul className="checkout-items">
        {items.map((e) => (
          <CheckoutItem
            key={e.item.id}
            entry={e}
            onInc={() => onInc(e.item.id)}
            onDec={() => onDec(e.item.id)}
          />
        ))}
      </ul>
    </section>
  );
}
