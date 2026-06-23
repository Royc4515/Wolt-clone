import { useState, useEffect, useMemo } from 'react';
import AppBar from '../components/AppBar';
import RestaurantCard from '../components/RestaurantCard';
import CategoryFilter from '../components/CategoryFilter';
import ScrollSection from '../components/shared/ScrollSection';
import { getRestaurants, getRecommendedRestaurants } from '../api/restaurants';
import { realDeliveryFee, calcAerialDistance, MAX_DELIVERY_RADIUS_KM } from '../utils/checkout';
import { getUserLocation, LOCATION_CHANGED_EVENT } from '../utils/location';
import { isAuthenticated } from '../utils/auth';
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

  // The logged-in user's saved location (null for guests / no saved location).
  // Drives both the distance-based delivery fee and the radius-filtered feed.
  // Re-read on the location-changed event so editing it in the top bar updates
  // the feed + recommendations live, without a manual refresh.
  const [userLocation, setUserLocation] = useState(getUserLocation);
  useEffect(() => {
    const onChange = () => setUserLocation(getUserLocation());
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  // Personalized restaurant recommendations (logged-in users only). Stays []
  // for guests and on empty/failed fetch, so the section is simply hidden —
  // recommendations are additive and must never surface an error.
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    // Pass coords so the server returns only restaurants within delivery range;
    // without a location we ask for the full list.
    getRestaurants(userLocation ?? undefined)
      .then(setAllRestaurants)
      .catch(err => console.error('Failed to load restaurants', err));
  }, [userLocation]);

  useEffect(() => {
    // Guests must not hit the auth-only endpoint: apiFetch force-logs-out on 401.
    if (!isAuthenticated()) return;
    let cancelled = false;
    // Forward coords so recommendations honour the same 15 km radius as the feed.
    getRecommendedRestaurants(userLocation ?? undefined)
      .then(list => { if (!cancelled) setRecommended(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRecommended([]); });
    return () => { cancelled = true; };
  }, [userLocation]);

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

  // Belt-and-suspenders: the server already filters recommendations by the 15 km
  // radius when coords are sent, but guard on the client too so an out-of-range
  // restaurant can never appear. With no saved location we can't measure distance,
  // so we show whatever the server returned.
  const recommendedInRange = useMemo(() => {
    if (!userLocation) return recommended;
    return recommended.filter(r =>
      r.location &&
      calcAerialDistance(r.location.lat, r.location.lng, userLocation.lat, userLocation.lng) <= MAX_DELIVERY_RADIUS_KM
    );
  }, [recommended, userLocation]);

  return (
    <div className="home">
      <AppBar logoLinkDisabled />

      <main className="home__content">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
        />

        {!activeCategory && recommendedInRange.length > 0 && (
          <ScrollSection classPrefix="home" title="Recommended for you">
            {recommendedInRange.map(r => (
              <RestaurantCard key={r.id} {...r} deliveryFee={realDeliveryFee(r, userLocation)} />
            ))}
          </ScrollSection>
        )}

        {!activeCategory && promoted.length > 0 && (
          <ScrollSection classPrefix="home" title="Promoted">
            {promoted.map(r => (
              <RestaurantCard key={r.id} {...r} deliveryFee={realDeliveryFee(r, userLocation)} />
            ))}
          </ScrollSection>
        )}

        <ScrollSection classPrefix="home" title={activeCategory || 'All Restaurants'}>
          {restaurants.map(r => (
            <RestaurantCard key={r.id} {...r} deliveryFee={realDeliveryFee(r, userLocation)} />
          ))}
        </ScrollSection>
      </main>
    </div>
  );
}
