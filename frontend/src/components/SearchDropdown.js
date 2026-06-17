import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAll } from '../api/search';
import ItemCard from './ItemCard';
import SearchRestaurantCard from './SearchRestaurantCard';
import './SearchDropdown.css';

const DEBOUNCE_MS = 300;
const RECENT_KEY = 'wolt_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

function saveRecentSearch(query) {
  const q = query.trim();
  if (!q) return;
  const next = [q, ...getRecentSearches().filter(s => s !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function SearchDropdown({ query, onProductClick, onClose, onQueryChange }) {
  const [results, setResults] = useState({ restaurants: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (!query || !query.trim()) {
      setResults({ restaurants: [], products: [] });
      setLoading(false);
      setSearched(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchAll(query);
        setResults(data || { restaurants: [], products: [] });
        saveRecentSearch(query);
        setRecentSearches(getRecentSearches());
      } catch (err) {
        console.error('Search failed:', err);
        setResults({ restaurants: [], products: [] });
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { restaurants = [], products = [] } = results;
  const hasResults = restaurants.length > 0 || products.length > 0;
  const isEmptyQuery = !query || !query.trim();
  const q = encodeURIComponent((query || '').trim());

  function handleRestaurantClick(r) {
    onClose();
    navigate(`/restaurant/${r.id}`);
  }

  function handleSeeAllRestaurants() {
    onClose();
    navigate(`/search?q=${q}&type=restaurants`);
  }

  function handleSeeAllItems() {
    onClose();
    navigate(`/search?q=${q}&type=items`);
  }

  return (
    // stopPropagation prevents the AppBar's useOutsideClick (document mousedown)
    // from firing when clicking inside the overlay — only X button / Escape / clicks
    // outside the overlay+AppBar close the search.
    <div className="search-dd" onMouseDown={e => e.stopPropagation()}>
      <div className="search-dd__body">

        {/* Empty query: recent searches */}
        {isEmptyQuery && recentSearches.length > 0 && (
          <div className="search-dd__recent">
            <div className="search-dd__recent-title">You recently searched</div>
            <div className="search-dd__recent-list">
              {recentSearches.map(s => (
                <button
                  key={s}
                  className="search-dd__recent-item"
                  onClick={() => onQueryChange && onQueryChange(s)}
                >
                  <span className="search-dd__recent-icon"><ClockIcon /></span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {!isEmptyQuery && loading && (
          <div className="search-dd__loading">Searching…</div>
        )}

        {/* No results */}
        {!isEmptyQuery && !loading && searched && !hasResults && (
          <div className="search-dd__empty">
            {/* Replace .search-dd__no-results-anim content with a Lottie or <img> */}
            <div className="search-dd__no-results-anim" aria-hidden="true">🗺️</div>
            <span className="search-dd__empty-title">No results found</span>
            <span className="search-dd__empty-sub">Try a different search — check the spelling or use more general terms.</span>
          </div>
        )}

        {/* Restaurants section */}
        {!loading && restaurants.length > 0 && (
          <section className="search-dd__section">
            <div className="search-dd__section-header">
              <h3 className="search-dd__section-title">Restaurants and stores</h3>
              <button className="search-dd__see-all" onClick={handleSeeAllRestaurants}>See all</button>
            </div>
            <div className="search-dd__rest-grid">
              {restaurants.slice(0, 4).map(r => (
                <SearchRestaurantCard
                  key={r.id}
                  restaurant={r}
                  variant="compact"
                  onClick={handleRestaurantClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* Items section */}
        {!loading && products.length > 0 && (
          <section className="search-dd__section">
            <div className="search-dd__section-header">
              <h3 className="search-dd__section-title">Related items</h3>
              <button className="search-dd__see-all" onClick={handleSeeAllItems}>See all</button>
            </div>
            <div className="search-dd__item-grid">
              {products.slice(0, 4).map(p => (
                <ItemCard key={p.id} product={p} onClick={onProductClick} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
