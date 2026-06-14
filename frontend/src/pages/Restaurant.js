import { useParams } from 'react-router-dom';
import { useRef } from 'react';
import AppBar from '../components/AppBar';
import MenuItemCard from '../components/MenuItemCard';
import CartBar from '../components/CartBar';
import useCart from '../hooks/useCart';
import { getRestaurantById } from '../mocks/restaurants';
import { getMenu } from '../mocks/menu';
import './Restaurant.css';

const PLACEHOLDER_COLORS = [
  '#0a1a2e','#1a0a2e','#0a2e1a','#2e0a0a',
  '#0a2e2e','#2e1a0a','#1a2e0a','#2e2e0a',
];

function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_COLORS[h % PLACEHOLDER_COLORS.length];
}

const BikeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h-4l-2 6 3.5 3.5"/>
    <path d="M5.5 17.5l2.5-7h6l2.5 7"/>
  </svg>
);

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
  </svg>
);

export default function Restaurant() {
  const { id } = useParams();
  const { items, addItem, count, total } = useCart();
  const sectionRefs = useRef({});

  const restaurant = getRestaurantById(id);
  if (!restaurant) {
    return (
      <div className="restaurant">
        <AppBar search="" onSearch={() => {}} searchRef={{ current: null }} />
        <main className="restaurant__not-found">
          <h1>Restaurant not found</h1>
        </main>
      </div>
    );
  }

  const menu = getMenu(id);
  const bgColor = hashColor(restaurant.name);

  function getQty(itemId) {
    const entry = items.find(e => e.item.id === itemId);
    return entry ? entry.qty : 0;
  }

  function scrollToSection(sectionId) {
    const el = sectionRefs.current[sectionId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="restaurant">
      <AppBar search="" onSearch={() => {}} searchRef={{ current: null }} />

      {/* ── Hero ── */}
      <div className="restaurant__hero" style={{ background: bgColor }}>
        <span className="restaurant__hero-emoji" aria-hidden="true">🍽</span>
      </div>

      {/* ── Info header ── */}
      <div className="restaurant__header">
        <div className="restaurant__header-inner">
          <h1 className="restaurant__name">{restaurant.name}</h1>
          <div className="restaurant__meta">
            <span className="restaurant__rating">
              <StarIcon />
              {restaurant.rating}
            </span>
            <span className="restaurant__dot" aria-hidden="true">·</span>
            <span className="restaurant__category">{restaurant.category}</span>
            <span className="restaurant__dot" aria-hidden="true">·</span>
            <span className="restaurant__time">{restaurant.deliveryTime}</span>
            <span className="restaurant__dot" aria-hidden="true">·</span>
            <span className="restaurant__fee">
              <BikeIcon />
              {restaurant.deliveryFee === 0 ? 'Free delivery' : `₪${restaurant.deliveryFee}`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Sticky category nav ── */}
      {menu.length > 0 && (
        <nav className="restaurant__cat-nav" aria-label="Menu categories">
          {menu.map(section => (
            <button
              type="button"
              key={section.id}
              className="restaurant__cat-btn"
              onClick={() => scrollToSection(section.id)}
            >
              {section.title}
            </button>
          ))}
        </nav>
      )}

      {/* ── Menu ── */}
      <main className="restaurant__menu">
        {menu.map(section => (
          <section
            key={section.id}
            className="restaurant__section"
            ref={el => { sectionRefs.current[section.id] = el; }}
          >
            <h2 className="restaurant__section-title">{section.title}</h2>
            <div className="restaurant__grid">
              {section.items.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  qty={getQty(item.id)}
                  onAdd={() => addItem(item)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {count > 0 && <CartBar count={count} total={total} />}
    </div>
  );
}
