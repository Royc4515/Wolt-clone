import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import AnimatedLogo from './AnimatedLogo';
import ThemeToggle from './shared/ThemeToggle';
import OrdersDrawer from './OrdersDrawer';
import { XIcon } from './icons';
import { getAuthState, USER_LOCATION_KEY, USER_DISPLAYNAME_KEY } from '../utils/auth';
import { getUser } from '../api/users';
import { logout, updateUserProfile } from '../api/auth';
import useOutsideClick from '../hooks/useOutsideClick';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import SearchDropdown from './SearchDropdown';
import ProductSearchModal from './ProductSearchModal';
import './AppBar.css';

function getCachedLocation() {
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);


const SmallXIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const BagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

function getLocalCartCount() {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('cart_')) n++;
  }
  return n;
}

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export default function AppBar({ cartCount = 0, cartTotal = 0, onShowCart, transparent = false, logoLinkDisabled = false, hideGlobalSearch = false }) {
  const { authenticated: authed, user } = getAuthState();
  const displayName = localStorage.getItem(USER_DISPLAYNAME_KEY) || user?.displayName;
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const isHome = routerLocation.pathname === '/';
  const cachedLoc = getCachedLocation() || user?.location || null;
  const [profilePicture, setProfilePicture] = useState(null);
  const [location, setLocation] = useState(cachedLoc);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(getLocalCartCount);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [locationLat, setLocationLat] = useState(cachedLoc?.lat ?? '');
  const [locationLng, setLocationLng] = useState(cachedLoc?.lng ?? '');
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState('');
  const searchRef = useRef(null);
  const clearBtnRef = useRef(null);
  const avatarRef = useRef(null);
  const locationRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useBodyScrollLock(searching);

  useEffect(() => {
    if (!user?.id) return;
    getUser(user.id).then(data => {
      if (data?.profilePicture) setProfilePicture(data.profilePicture);
    }).catch(() => {});
  }, [user?.id]);

  useOutsideClick(
    avatarRef,
    menuOpen,
    () => setMenuOpen(false),
    () => { setMenuOpen(false); avatarRef.current?.focus(); }
  );

  useOutsideClick(
    locationRef,
    locationMenuOpen,
    () => { setLocationMenuOpen(false); setLocationError(''); }
  );

  useOutsideClick(
    searchContainerRef,
    searching,
    () => { setSearching(false); setSearch(''); }
  );

  async function handleLocationSave() {
    const lat = parseFloat(locationLat);
    const lng = parseFloat(locationLng);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      setLocationError('Invalid coordinates');
      return;
    }
    setLocationSaving(true);
    setLocationError('');
    try {
      await updateUserProfile(user.id, { location: { lat, lng } });
      setLocation({ lat, lng });
      // TODO(dana): once PATCH /api/users/:id re-issues the JWT, store the new token here
      // via localStorage.setItem('jwt_token', response.token) and remove this localStorage cache line.
      localStorage.setItem(USER_LOCATION_KEY, JSON.stringify({ lat, lng }));
      setLocationMenuOpen(false);
    } catch {
      setLocationError('Failed to save location');
    } finally {
      setLocationSaving(false);
    }
  }

  function handleFocus() {
    setSearching(true);
  }

  function handleSearchChange(value) {
    setSearch(value);
  }

  function handleClear() {
    setSearch('');
    setSearching(false);
    searchRef.current?.blur();
  }

  function handleCloseDropdown() {
    setSearch('');
    setSearching(false);
  }

  function handleLogout() {
    localStorage.removeItem(USER_LOCATION_KEY);
    localStorage.removeItem(USER_DISPLAYNAME_KEY);
    logout();
    navigate('/login');
  }

  return (
    <>
    <header className={`appbar${searching ? ' appbar--searching' : ''}${scrolled ? ' appbar--scrolled' : ''}${transparent && !scrolled ? ' appbar--transparent' : ''}${hideGlobalSearch && !searching ? ' appbar--restaurant-search' : ''}`}>
      {/* Left: logo + location */}
      <div className="appbar__left">
        {logoLinkDisabled && !searching ? (
          <AnimatedLogo className="appbar__logo appbar__logo--disabled" animate={isHome} />
        ) : (
          <Link to="/" className="appbar__logo-link">
            <AnimatedLogo className="appbar__logo" animate={isHome} />
          </Link>
        )}
        {!searching && (
          <div className="appbar__location-wrapper" ref={locationRef}>
            <button
              className="appbar__location"
              aria-label="Change location"
              onClick={() => authed && setLocationMenuOpen(o => !o)}
            >
              <span className="appbar__location-pin"><PinIcon /></span>
              <span className="appbar__location-text">
                {location ? `${location.lat}, ${location.lng}` : 'Tel Aviv'}
              </span>
              {authed && (
                <span className={`appbar__location-chevron${locationMenuOpen ? ' appbar__location-chevron--up' : ''}`}>
                  <ChevronDown />
                </span>
              )}
            </button>
            {locationMenuOpen && (
              <div className="appbar__location-menu">
                <span className="appbar__location-menu-title">Set your location</span>
                <div className="appbar__location-menu-fields">
                  <div className="appbar__location-menu-field">
                    <label htmlFor="loc-lat">Lat</label>
                    <input
                      id="loc-lat"
                      type="number"
                      step="any"
                      placeholder="32.08"
                      value={locationLat}
                      onChange={e => setLocationLat(e.target.value)}
                    />
                  </div>
                  <div className="appbar__location-menu-field">
                    <label htmlFor="loc-lng">Lng</label>
                    <input
                      id="loc-lng"
                      type="number"
                      step="any"
                      placeholder="34.78"
                      value={locationLng}
                      onChange={e => setLocationLng(e.target.value)}
                    />
                  </div>
                </div>
                {locationError && <span className="appbar__location-menu-error">{locationError}</span>}
                <button
                  className="appbar__location-menu-save"
                  onClick={handleLocationSave}
                  disabled={locationSaving}
                >
                  {locationSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: search pill */}
      <div className="appbar__center" ref={searchContainerRef}>
        <div className="appbar__search-pill">
          <SearchIcon />
          <input
            ref={searchRef}
            className="appbar__search-input"
            type="search"
            placeholder="Search in Wolt..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim()) {
                navigate(`/search?q=${encodeURIComponent(search.trim())}&type=restaurants`);
                handleCloseDropdown();
              }
            }}
            aria-label="Search restaurants and items"
          />
          {search && (
            <button
              type="button"
              className="appbar__search-clear"
              tabIndex={-1}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              aria-label="Clear search text"
            >
              <SmallXIcon />
            </button>
          )}
        </div>
      </div>

      {/* Right: auth + toggle OR clear button */}
      <div className="appbar__right">
        {searching ? (
          <button
            ref={clearBtnRef}
            type="button"
            className="appbar__clear-btn"
            onMouseDown={e => e.preventDefault()}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <XIcon size={16} />
          </button>
        ) : (
          <>
            {!authed && (
              <>
                {/* Full auth buttons — hidden on small screens */}
                <div className="appbar__auth-full">
                  <Link to="/login" className="appbar__btn-login">Log in</Link>
                  <Link to="/register" className="appbar__btn-signup">Sign up</Link>
                </div>

                {/* Compact avatar — shown on small screens */}
                <div className="appbar__auth-compact" ref={avatarRef}>
                  <button
                    className="appbar__avatar-btn"
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label="Account menu"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    <PersonIcon />
                  </button>
                  {menuOpen && (
                    <div className="appbar__avatar-menu" role="menu">
                      <Link
                        to="/login"
                        className="appbar__avatar-menu-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        to="/register"
                        className="appbar__avatar-menu-item appbar__avatar-menu-item--accent"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {authed && user && (
              <div className="appbar__user" ref={avatarRef}>
                <button
                  className="appbar__user-pill"
                  onClick={() => setMenuOpen(o => !o)}
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  {profilePicture ? (
                    <img src={profilePicture} alt={displayName} className="appbar__user-avatar" />
                  ) : (
                    <span className="appbar__user-avatar appbar__user-avatar--initials">
                      {displayName?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className={`appbar__user-chevron${menuOpen ? ' appbar__user-chevron--up' : ''}`}>
                    <ChevronDown />
                  </span>
                </button>
                {menuOpen && (
                  <div className="appbar__avatar-menu" role="menu">
                    <Link
                      to="/profile"
                      className="appbar__avatar-menu-profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      {profilePicture ? (
                        <img src={profilePicture} alt={displayName} className="appbar__avatar-menu-profile-avatar" />
                      ) : (
                        <span className="appbar__avatar-menu-profile-avatar appbar__user-avatar--initials">
                          {displayName?.[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className="appbar__avatar-menu-profile-info">
                        <span className="appbar__avatar-menu-profile-name">{displayName}</span>
                        <span className="appbar__avatar-menu-profile-sub">Profile</span>
                      </div>
                      <ChevronRight />
                    </Link>
                    <Link
                      to="/orders"
                      className="appbar__avatar-menu-item"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      className="appbar__avatar-menu-item appbar__avatar-menu-item--danger"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}

            {authed && (
              <button
                type="button"
                className="appbar__orders-btn"
                onClick={() => { setBadgeCount(getLocalCartCount()); setOrdersOpen(true); }}
                aria-label="Your orders"
              >
                <BagIcon />
                {badgeCount > 0 && (
                  <span className="appbar__orders-badge">{badgeCount}</span>
                )}
              </button>
            )}

            {cartCount > 0 && (
              <button type="button" className="appbar__cart-pill" onClick={onShowCart}>
                <span className="appbar__cart-pill-count">{cartCount}</span>
                <span className="appbar__cart-pill-label">Show items</span>
                <span className="appbar__cart-pill-price">₪{cartTotal}</span>
              </button>
            )}

            <ThemeToggle />
          </>
        )}
      </div>

      {ordersOpen && (
        <OrdersDrawer onClose={() => { setOrdersOpen(false); setBadgeCount(getLocalCartCount()); }} />
      )}
    </header>

    {/* Overlay is a sibling of <header> so it's in the root stacking context
        (z-index 99 < AppBar z-index 100) — the AppBar stays fully visible on top */}
    {searching && search.trim().length > 0 && (
      <SearchDropdown
        query={search}
        onProductClick={p => { setSelectedProduct(p); }}
        onClose={handleCloseDropdown}
        onQueryChange={value => { setSearch(value); }}
      />
    )}

    {selectedProduct && (
      <ProductSearchModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    )}
  </>
  );
}
