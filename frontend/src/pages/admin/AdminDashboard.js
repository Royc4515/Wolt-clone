import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '../../components/AppBar';
import { getRestaurants, deleteRestaurant } from '../../api/restaurants';
import { getCurrentUser } from '../../utils/auth';
import './admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const me = getCurrentUser();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRestaurants()
      .then((all) => {
        if (cancelled) return;
        setRestaurants(all.filter((r) => r.ownerId === me?.id));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load restaurants. Please try again.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id) {
    setDeletingId(id);
    setError('');
    try {
      await deleteRestaurant(id);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete restaurant.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin">
      <AppBar />
      <main className="admin__main">
        <div className="admin__head">
          <div>
            <h1 className="admin__title">Restaurant admin</h1>
            <p className="admin__sub">Manage your restaurants and their menus.</p>
          </div>
          <button
            type="button"
            className="admin__primary"
            onClick={() => navigate('/admin/restaurants/new')}
          >
            + New restaurant
          </button>
        </div>

        {error && <div className="admin__error" role="alert">{error}</div>}

        {loading ? (
          <div className="admin__loading"><div className="admin__spinner" /></div>
        ) : restaurants.length === 0 ? (
          <p className="admin__empty">
            You don't manage any restaurants yet — create your first one.
          </p>
        ) : (
          <ul className="admin__list">
            {restaurants.map((r) => (
              <li key={r.id} className="admin__card">
                <div className="admin__card-img">
                  {r.image
                    ? <img src={r.image} alt={r.name} />
                    : <span className="admin__card-emoji" aria-hidden="true">🍽</span>}
                </div>
                <div className="admin__card-info">
                  <p className="admin__card-name">{r.name}</p>
                  <p className="admin__card-meta">
                    {r.category}{r.deliveryTime ? ` · ${r.deliveryTime}` : ''}
                  </p>
                </div>
                <div className="admin__card-actions">
                  <button type="button" className="admin__btn" onClick={() => navigate(`/admin/restaurants/${r.id}/menu`)}>Menu</button>
                  <button type="button" className="admin__btn" onClick={() => navigate(`/admin/restaurants/${r.id}/edit`)}>Edit</button>
                  <button
                    type="button"
                    className="admin__btn admin__btn--danger"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
