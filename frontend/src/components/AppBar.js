import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import woltLogo from '../assets/wolt-wordmark.png';
import ThemeToggle from './shared/ThemeToggle';
import './AppBar.css';

function isAuthenticated() {
  const token = localStorage.getItem('jwt_token');
  return Boolean(token && token.split('.').length === 3);
}

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
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function AppBar({ search, onSearch, searchRef }) {
  const authed = isAuthenticated();
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const clearBtnRef = useRef(null);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleFocus() {
    setSearching(true);
  }

  function handleBlur(e) {
    if (clearBtnRef.current && clearBtnRef.current.contains(e.relatedTarget)) return;
    setTimeout(() => setSearching(false), 80);
  }

  function handleClear() {
    onSearch('');
    setSearching(false);
    searchRef.current?.blur();
  }

  return (
    <header className={`appbar${searching ? ' appbar--searching' : ''}${scrolled ? ' appbar--scrolled' : ''}`}>
      {/* Left: logo + location */}
      <div className="appbar__left">
        <img src={woltLogo} alt="Wolt" className="appbar__logo" />
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
            className="appbar__clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <XIcon />
          </button>
        ) : (
          <>
            {!authed && (
              <>
                <Link to="/login" className="appbar__btn-login">Log in</Link>
                <Link to="/register" className="appbar__btn-signup">Sign up</Link>
              </>
            )}
            <ThemeToggle />
          </>
        )}
      </div>
    </header>
  );
}
