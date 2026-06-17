import { useState, useEffect, useMemo } from 'react';
import AppBar from '../components/AppBar';
import RestaurantCard from '../components/RestaurantCard';
import CategoryFilter from '../components/CategoryFilter';
import ScrollSection from '../components/shared/ScrollSection';
import { getRestaurants } from '../api/restaurants';
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
  const [activeCategory, setActiveCategory] = useState(null);
  const [allRestaurants, setAllRestaurants] = useState([]);

  useEffect(() => {
    getRestaurants().then(setAllRestaurants).catch(err => console.error('Failed to load restaurants', err));
  }, []);

  const categories = useMemo(() => {
    const seen = new Map();
    for (const r of allRestaurants) {
      if (r.category && !seen.has(r.category)) {
        seen.set(r.category, {
          name: r.category,
          emoji: CATEGORY_META[r.category]?.emoji || '🍽️',
          image: CATEGORY_META[r.category]?.image || '',
        });
      }
    }
    return [...seen.values()];
  }, [allRestaurants]);

  const restaurants = useMemo(() => {
    return allRestaurants.filter(r =>
      !activeCategory || r.category === activeCategory
    );
  }, [allRestaurants, activeCategory]);

  const promoted = useMemo(() => restaurants.filter(r => r.isPromoted), [restaurants]);

  return (
    <div className="home">
      <AppBar logoLinkDisabled />

      <main className="home__content">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
        />

        {!activeCategory && promoted.length > 0 && (
          <ScrollSection classPrefix="home" title="Promoted">
            {promoted.map(r => <RestaurantCard key={r.id} {...r} />)}
          </ScrollSection>
        )}

        <ScrollSection classPrefix="home" title={activeCategory || 'All Restaurants'}>
          {restaurants.map(r => <RestaurantCard key={r.id} {...r} />)}
        </ScrollSection>
      </main>
    </div>
  );
}
