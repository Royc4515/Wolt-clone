import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { searchAll } from '../api/search';
import ItemCard from '../components/ItemCard';
import SearchRestaurantCard from '../components/SearchRestaurantCard';
import ProductSearchModal from '../components/ProductSearchModal';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'restaurants';

  const [results, setResults] = useState({ restaurants: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!query.trim()) { setLoading(false); return; }
    setLoading(true);
    searchAll(query)
      .then(data => setResults(data || { restaurants: [], products: [] }))
      .catch(() => setResults({ restaurants: [], products: [] }))
      .finally(() => setLoading(false));
  }, [query]);

  const { restaurants = [], products = [] } = results;
  const isRestaurants = type === 'restaurants';
  const items = isRestaurants ? restaurants : products;

  function switchType(t) {
    navigate(`/search?q=${encodeURIComponent(query)}&type=${t}`, { replace: true });
  }

  return (
    <div className="sr">
      <AppBar />
      <main className="sr__main">
        <div className="sr__header">
          <h1 className="sr__title">
            {isRestaurants ? 'Restaurants' : 'Items'} for "{query}"
          </h1>
          <div className="sr__tabs">
            <button
              className={`sr__tab${isRestaurants ? ' sr__tab--active' : ''}`}
              onClick={() => switchType('restaurants')}
            >
              Restaurants {!loading && `(${restaurants.length})`}
            </button>
            <button
              className={`sr__tab${!isRestaurants ? ' sr__tab--active' : ''}`}
              onClick={() => switchType('items')}
            >
              Items {!loading && `(${products.length})`}
            </button>
          </div>
        </div>

        {loading && <div className="sr__loading">Searching…</div>}

        {!loading && items.length === 0 && (
          <div className="sr__empty">No {isRestaurants ? 'restaurants' : 'items'} found for "{query}"</div>
        )}

        {!loading && isRestaurants && restaurants.length > 0 && (
          <div className="sr__rest-grid">
            {restaurants.map(r => (
              <SearchRestaurantCard key={r.id} restaurant={r} variant="full" />
            ))}
          </div>
        )}

        {!loading && !isRestaurants && products.length > 0 && (
          <div className="sr__item-grid">
            {products.map(p => (
              <ItemCard key={p.id} product={p} onClick={setSelectedProduct} />
            ))}
          </div>
        )}
      </main>

      {selectedProduct && (
        <ProductSearchModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
