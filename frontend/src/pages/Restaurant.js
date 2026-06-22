import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '../components/AppBar';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer';
import MenuItemModal from '../components/MenuItemModal';
import ScrollSection from '../components/shared/ScrollSection';
import useCart from '../hooks/useCart';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { getRestaurant, getMenu } from '../api/restaurants';
import { getRecommendedProducts } from '../api/products';
import { getOrders } from '../api/orders';
import { isAuthenticated } from '../utils/auth';
import { readCart, writeCart } from '../utils/cartStorage';
import { hashColor } from '../utils/colorHash';
import { realDeliveryFee } from '../utils/checkout';
import { getUserLocation } from '../utils/location';
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

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, addItem, updateQty, restoreItems, count, total } = useCart();
  const sectionRefs = useRef({});
  const heroRef = useRef(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [heroScrolledPast, setHeroScrolledPast] = useState(false);
  const isLight = useTheme() === 'light';

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Personalized product suggestions for this restaurant (logged-in users only).
  // Stays [] for guests and on empty/failed fetch, so the row is just hidden —
  // suggestions are additive and must never surface an error.
  const [recommended, setRecommended] = useState([]);

  // Prevents the initial items=[] from wiping localStorage before the cart is restored.
  const cartSaveReady = useRef(false);

  useBodyScrollLock(cartOpen);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    cartSaveReady.current = false;

    // Restore saved shopping cart for this restaurant immediately (before async fetch).
    restoreItems(readCart(id));

    Promise.all([getRestaurant(id), getMenu(id)])
      .then(async ([rest, menuData]) => {
        if (cancelled) return;
        setRestaurant(rest);
        setMenu(menuData);
        setLoading(false);

        // If navigated via "Order again", pre-populate cart from that order's items.
        const reorderItems = location.state?.reorderItems;
        if (reorderItems?.length) {
          const allItems = menuData.flatMap(s => s.items);
          const menuById = new Map(allItems.map(item => [item.id, item]));
          const cartItems = reorderItems
            .map(({ productId, quantity }) => {
              const menuItem = menuById.get(productId);
              return menuItem ? { item: menuItem, qty: quantity } : null;
            })
            .filter(Boolean);
          if (cartItems.length) {
            restoreItems(cartItems);
            window.history.replaceState({}, '');
            return;
          }
        }

        if (!isAuthenticated()) return;

        // Check whether the user already has a pending order at this restaurant.
        const orders = await getOrders().catch(() => []);
        if (cancelled) return;

        const activeOrder = orders.find(o => o.restaurantId === id && o.status === 'pending');
        if (!activeOrder) return;

        // Restore the order items into the cart so the user can see what they ordered.
        const allItems = menuData.flatMap(s => s.items);
        const menuById = new Map(allItems.map(item => [item.id, item]));
        const cartItems = activeOrder.items
          .map(({ productId, quantity }) => {
            const menuItem = menuById.get(productId);
            return menuItem ? { item: menuItem, qty: quantity } : null;
          })
          .filter(Boolean);

        restoreItems(cartItems);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist the shopping cart to localStorage on every change.
  useEffect(() => {
    if (!cartSaveReady.current) {
      cartSaveReady.current = true;
      return;
    }
    writeCart(id, items);
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load product suggestions for this restaurant. Guests skip the auth-only
  // endpoint (apiFetch force-logs-out on 401); reset on restaurant change so
  // stale suggestions never leak between restaurants.
  useEffect(() => {
    setRecommended([]);
    if (!isAuthenticated()) return;
    let cancelled = false;
    getRecommendedProducts(id)
      .then(list => { if (!cancelled) setRecommended(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRecommended([]); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroScrolledPast(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  const filteredMenu = useMemo(() => {
    if (!menuSearch.trim()) return menu;
    const q = menuSearch.toLowerCase();
    return menu
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        ),
      }))
      .filter(section => section.items.length > 0);
  }, [menu, menuSearch]);

  const cartMap = useMemo(() => new Map(items.map(e => [e.item.id, e.qty])), [items]);
  const getQty = useCallback((itemId) => cartMap.get(itemId) ?? 0, [cartMap]);

  // Drawer add-ons: suggested products the user hasn't already put in the cart.
  const cartSuggestions = useMemo(
    () => recommended.filter(p => !cartMap.has(p.id)),
    [recommended, cartMap]
  );

  const handleCheckout = useCallback(() => {
    setCartOpen(false);
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/${id}`);
  }, [id, navigate]);

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
  const deliveryFee = realDeliveryFee(restaurant, getUserLocation());

  return (
    <div className="restaurant">
      <AppBar
        cartCount={count}
        cartTotal={total}
        onShowCart={() => setCartOpen(true)}
        transparent
        hideGlobalSearch={heroScrolledPast}
      />

      {/* ── Hero (extends behind AppBar) ── */}
      <div ref={heroRef} className="restaurant__hero" style={!restaurant.image && !isLight ? { background: bgColor } : undefined}>
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
              {deliveryFee === 0 ? 'Free delivery' : `₪${deliveryFee}`}
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
          <div className="restaurant__nav-search">
            <SearchIcon />
            <input
              className="restaurant__nav-search-input"
              type="search"
              placeholder="Search menu…"
              value={menuSearch}
              onChange={e => setMenuSearch(e.target.value)}
              aria-label="Search menu items"
            />
          </div>
        </nav>
      )}

      {/* ── Menu ── */}
      <main className="restaurant__menu">
        {/* Personalized suggestions — hidden while searching to keep results clean */}
        {!menuSearch.trim() && recommended.length > 0 && (
          <ScrollSection classPrefix="restaurant" title="You might also like">
            {recommended.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={getQty(item.id)}
                onAdd={() => addItem(item)}
                onRemove={() => updateQty(item.id, getQty(item.id) - 1)}
                onCardClick={() => setSelectedItem(item)}
              />
            ))}
          </ScrollSection>
        )}

        {filteredMenu.length === 0 && menuSearch.trim() && (
          <p className="restaurant__search-empty">No items found for "{menuSearch}"</p>
        )}
        {filteredMenu.map(section => {
          const cards = section.items.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              qty={getQty(item.id)}
              onAdd={() => addItem(item)}
              onRemove={() => updateQty(item.id, getQty(item.id) - 1)}
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
          count={count}
          total={total}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          onUpdateQty={updateQty}
          onItemClick={item => setSelectedItem(item)}
          checkoutLabel="Go to checkout"
          suggestions={cartSuggestions}
          onAddSuggestion={addItem}
        />
      )}

      {/* ── Item detail modal (rendered after drawer so it sits on top) ── */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          qty={getQty(selectedItem.id)}
          onAdd={() => addItem(selectedItem)}
          onRemove={() => updateQty(selectedItem.id, getQty(selectedItem.id) - 1)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
