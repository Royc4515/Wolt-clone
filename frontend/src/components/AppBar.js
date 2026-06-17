import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedLogo from './AnimatedLogo';
import ThemeToggle from './shared/ThemeToggle';
import { isAuthenticated, getCurrentUser } from '../utils/auth';
import { getUser } from '../api/users';
import { logout } from '../api/auth';
import './AppBar.css';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

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

export default function AppBar({ search = '', onSearch = () => {}, searchRef = { current: null }, cartCount = 0, cartTotal = 0, onShowCart, transparent = false, logoLinkDisabled = false }) {
  const authed = isAuthenticated();
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState(null);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const clearBtnRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authed || !user) return;
    getUser(user.id).then(data => {
      if (data?.profilePicture) setProfilePicture(data.profilePicture);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutsideClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        avatarRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function handleFocus() { setSearching(true); }

  function handleBlur(e) {
    if (clearBtnRef.current && clearBtnRef.current.contains(e.relatedTarget)) return;
    setSearching(false);
  }

  function handleClear() {
    onSearch('');
    setSearching(false);
    searchRef.current?.blur();
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className={`appbar${searching ? ' appbar--searching' : ''}${scrolled ? ' appbar--scrolled' : ''}${transparent && !scrolled ? ' appbar--transparent' : ''}`}>
      {/* Left: logo + location */}
      <div className="appbar__left">
        {logoLinkDisabled ? (
          <AnimatedLogo className="appbar__logo appbar__logo--disabled" />
        ) : (
          <Link to="/" className="appbar__logo-link">
            <AnimatedLogo className="appbar__logo" />
          </Link>
        )}
        {!searching && (
          <button className="appbar__location" aria-label="Change location">
            <span className="appbar__location-pin"><PinIcon /></span>
            <span className="appbar__location-text">Tel Aviv</span>
            <ChevronDown />
          </button>
        )}
      </div>

      {/* Center: search pill */}
      <div className="appbar__center">
        <div className="appbar__search-pill">
          <SearchIcon />
          <input
            ref={searchRef}
            className="appbar__search-input"
            type="search"
            placeholder="Search in Wolt..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-label="Search restaurants"
          />
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
            <XIcon />
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
                    <img src={profilePicture} alt={user.displayName} className="appbar__user-avatar" />
                  ) : (
                    <span className="appbar__user-avatar appbar__user-avatar--initials">
                      {user.displayName?.[0]?.toUpperCase()}
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
                        <img src={profilePicture} alt={user.displayName} className="appbar__avatar-menu-profile-avatar" />
                      ) : (
                        <span className="appbar__avatar-menu-profile-avatar appbar__user-avatar--initials">
                          {user.displayName?.[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className="appbar__avatar-menu-profile-info">
                        <span className="appbar__avatar-menu-profile-name">{user.displayName}</span>
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
    </header>
  );
}
