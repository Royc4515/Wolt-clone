import { useState, useRef } from 'react';
import AppBar from '../components/AppBar';
import RestaurantCard from '../components/RestaurantCard';
import CategoryFilter from '../components/CategoryFilter';
import { getRestaurants, CATEGORIES } from '../mocks/restaurants';
import './Home.css';

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function ScrollSection({ title, children }) {
  const rowRef = useRef(null);

  function scroll(dir) {
    rowRef.current?.scrollBy({ left: dir * 560, behavior: 'smooth' });
  }

  return (
    <section className="home__section">
      <div className="home__section-header">
        <h2 className="home__section-title">{title}</h2>
        <div className="home__section-nav">
          <button className="home__scroll-btn" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft />
          </button>
          <button className="home__scroll-btn" onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="home__scroll-row" ref={rowRef}>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const searchRef = useRef(null);

  const restaurants = getRestaurants({ search, category: activeCategory });
  const promoted = restaurants.filter(r => r.isPromoted);
  const isSearching = search.trim().length > 0;

  function handleCategorySelect(cat) {
    setActiveCategory(cat);
    setSearch('');
  }

  return (
    <div className="home">
      <AppBar search={search} onSearch={setSearch} searchRef={searchRef} />

      <main className="home__content">
        <CategoryFilter
          categories={CATEGORIES}
          active={activeCategory}
          onSelect={handleCategorySelect}
        />

        {isSearching ? (
          restaurants.length > 0 ? (
            <ScrollSection title={`Results for "${search}"`}>
              {restaurants.map(r => <RestaurantCard key={r.id} {...r} />)}
            </ScrollSection>
          ) : (
            <section className="home__section">
              <h2 className="home__section-title home__empty">No results for "{search}"</h2>
            </section>
          )
        ) : (
          <>
            {!activeCategory && promoted.length > 0 && (
              <ScrollSection title="Promoted">
                {promoted.map(r => <RestaurantCard key={r.id} {...r} />)}
              </ScrollSection>
            )}

            <ScrollSection title={activeCategory || 'All Restaurants'}>
              {restaurants.map(r => <RestaurantCard key={r.id} {...r} />)}
            </ScrollSection>
          </>
        )}
      </main>
    </div>
  );
}
