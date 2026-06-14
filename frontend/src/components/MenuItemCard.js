import './MenuItemCard.css';

const PLACEHOLDER_COLORS = [
  '#0a1a2e','#1a0a2e','#0a2e1a','#2e0a0a',
  '#0a2e2e','#2e1a0a','#1a2e0a','#2e2e0a',
];

function colorIndex(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % PLACEHOLDER_COLORS.length;
}

export default function MenuItemCard({ item, qty, onAdd }) {
  const { id, name, description, price, image, maxQty } = item;
  const atMax = qty >= maxQty;
  const bgColor = PLACEHOLDER_COLORS[colorIndex(id)];

  return (
    <article className="menu-item-card">
      <div className="menu-item-card__image" style={!image ? { background: bgColor } : undefined}>
        {image
          ? <img src={image} alt={name} />
          : <span className="menu-item-card__emoji" aria-hidden="true">🍽</span>
        }
        <button
          type="button"
          className="menu-item-card__add"
          onClick={onAdd}
          disabled={atMax}
          aria-label={`Add ${name}`}
        >
          {qty > 0 ? qty : '+'}
        </button>
      </div>
      <div className="menu-item-card__body">
        <h3 className="menu-item-card__name">{name}</h3>
        {description && <p className="menu-item-card__desc">{description}</p>}
        <span className="menu-item-card__price">₪{price}</span>
      </div>
    </article>
  );
}
