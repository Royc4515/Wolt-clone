import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer';
import MenuItemModal from '../components/MenuItemModal';
import ScrollSection from '../components/shared/ScrollSection';
import useCart from '../hooks/useCart';
import { getRestaurant, getMenu } from '../api/restaurants';
import { hashColor } from '../utils/colorHash';
import useTheme from '../hooks/useTheme';
import woltIcon from '../assets/wolt-logo.png';
import './Restaurant.css';

const FEATURED_SECTION_TITLE = 'Most Ordered';

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
  const navigate = useNavigate();
  const { items, addItem, updateQty, count, total } = useCart();
  const sectionRefs = useRef({});
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const isLight = useTheme() === 'light';

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    Promise.all([getRestaurant(id), getMenu(id)])
      .then(([rest, menuData]) => {
        if (!cancelled) {
          setRestaurant(rest);
          setMenu(menuData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [id]);

  const cartMap = useMemo(() => new Map(items.map(e => [e.item.id, e.qty])), [items]);
  function getQty(itemId) { return cartMap.get(itemId) ?? 0; }

  function handleRemove(item) {
    updateQty(item.id, getQty(item.id) - 1);
  }

  function handleAdd(item) {
    addItem(item);
  }

  function handleCheckout() {
    const token = localStorage.getItem('jwt_token');
    if (!token || token.split('.').length !== 3) {
      setCartOpen(false);
      navigate('/login');
      return;
    }
    // TODO: navigate to checkout page
  }

  function scrollToSection(sectionId) {
    const el = sectionRefs.current[sectionId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <div className="restaurant">
        <AppBar />
        <main className="restaurant__loading">
          <img src={woltIcon} alt="Loading" className="restaurant__loading-logo" />
        </main>
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="restaurant">
        <AppBar />
        <main className="restaurant__not-found">
          <h1>Restaurant not found</h1>
        </main>
      </div>
    );
  }

  const bgColor = hashColor(restaurant.name);

  return (
    <div className="restaurant">
      <AppBar
        cartCount={count}
        cartTotal={total}
        onShowCart={() => setCartOpen(true)}
        transparent
      />

      {/* ── Hero (extends behind AppBar) ── */}
      <div className="restaurant__hero" style={!restaurant.image && !isLight ? { background: bgColor } : undefined}>
        {restaurant.image
          ? <img src={restaurant.image} alt={restaurant.name} className="restaurant__hero-img" />
          : <span className="restaurant__hero-emoji" aria-hidden="true">🍽</span>
        }
        <div className="restaurant__hero-overlay" aria-hidden="true" />
        <div className="restaurant__hero-info">
          <h1 className="restaurant__hero-name">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="restaurant__hero-desc">{restaurant.description}</p>
          )}
        </div>
      </div>

      {/* ── Info bar ── */}
      <div className="restaurant__header">
        <div className="restaurant__header-inner">
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
        {menu.map(section => {
          const cards = section.items.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              qty={getQty(item.id)}
              onAdd={() => handleAdd(item)}
              onRemove={() => handleRemove(item)}
              onCardClick={() => setSelectedItem(item)}
            />
          ));

          if (section.title === FEATURED_SECTION_TITLE) {
            return (
              <ScrollSection
                key={section.id}
                classPrefix="restaurant"
                title={section.title}
                sectionRef={el => { sectionRefs.current[section.id] = el; }}
              >
                {cards}
              </ScrollSection>
            );
          }

          return (
            <section
              key={section.id}
              className="restaurant__section"
              ref={el => { sectionRefs.current[section.id] = el; }}
            >
              <h2 className="restaurant__section-title">{section.title}</h2>
              <div className="restaurant__grid">{cards}</div>
            </section>
          );
        })}
      </main>

      {/* ── Cart drawer ── */}
      {cartOpen && (
        <CartDrawer
          items={items}
          total={total}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          onUpdateQty={updateQty}
          onItemClick={item => setSelectedItem(item)}
        />
      )}

      {/* ── Item detail modal (rendered after drawer so it sits on top) ── */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          qty={getQty(selectedItem.id)}
          onAdd={() => addItem(selectedItem)}
          onRemove={() => handleRemove(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
