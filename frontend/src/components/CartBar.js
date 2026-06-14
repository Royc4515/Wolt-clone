import './CartBar.css';

export default function CartBar({ count, total }) {
  return (
    <div className="cart-bar" role="region" aria-label="cart">
      <span className="cart-bar__count">{count} {count === 1 ? 'item' : 'items'}</span>
      <button type="button" className="cart-bar__btn">View cart</button>
      <span className="cart-bar__total">₪{total}</span>
    </div>
  );
}
