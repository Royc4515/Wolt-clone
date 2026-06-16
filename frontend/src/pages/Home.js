import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import RestaurantCard from '../components/RestaurantCard';
import CategoryFilter from '../components/CategoryFilter';
import ScrollSection from '../components/shared/ScrollSection';
import { fetchRestaurants } from '../api/restaurants';
import './Home.css';

const CATEGORY_META = {
  'Pizza':    { emoji: '🍕', image: '/images/categories/pizza.jpg' },
  'Sushi':    { emoji: '🍣', image: '/images/categories/sushi.jpg' },
  'Burgers':  { emoji: '🍔', image: '/images/categories/burgers.jpg' },
  'Asian':    { emoji: '🥡', image: '/images/categories/asian.jpg' },
  'Salads':   { emoji: '🥗', image: '/images/categories/salads.jpg' },
  'Pasta':    { emoji: '🍝', image: '/images/categories/pasta.jpg' },
  'Desserts': { emoji: '🍰', image: '/images/categories/desserts.jpg' },
  'Mexican':  { emoji: '🌮', image: '/images/categories/mexican.jpg' },
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(null);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchRestaurants().then(setAllRestaurants).catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const seen = new Set();
    return allRestaurants
      .filter(r => r.category && !seen.has(r.category) && seen.add(r.category))
      .map(r => ({
        name: r.category,
        emoji: CATEGORY_META[r.category]?.emoji || '🍽️',
        image: CATEGORY_META[r.category]?.image || '',
      }));
  }, [allRestaurants]);

  const restaurants = useMemo(() => {
    return allRestaurants.filter(r => {
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = !activeCategory || r.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allRestaurants, search, activeCategory]);

  const promoted = useMemo(() => restaurants.filter(r => r.isPromoted), [restaurants]);
  const isSearching = search.trim().length > 0;

  function handleCategorySelect(cat) {
    setActiveCategory(cat);
    setSearch('');
  }

  return (
    <div className="home">
      <AppBar search={search} onSearch={setSearch} searchRef={searchRef} logoLinkDisabled />

      <main className="home__content">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onSelect={handleCategorySelect}
        />

        {isSearching ? (
          restaurants.length > 0 ? (
            <ScrollSection classPrefix="home" title={`Results for "${search}"`}>
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
              <ScrollSection classPrefix="home" title="Promoted">
                {promoted.map(r => <RestaurantCard key={r.id} {...r} />)}
              </ScrollSection>
            )}

            <ScrollSection classPrefix="home" title={activeCategory || 'All Restaurants'}>
              {restaurants.map(r => <RestaurantCard key={r.id} {...r} />)}
            </ScrollSection>
          </>
        )}
      </main>
    </div>
  );
}
