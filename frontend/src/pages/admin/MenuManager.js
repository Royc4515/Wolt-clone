import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '../../components/AppBar';
import FormField from '../../components/auth/FormField';
import { getRestaurant } from '../../api/restaurants';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products';
import './admin.css';

const EMPTY_ITEM = { name: '', price: '', section: '', description: '', isAvailable: true };

export default function MenuManager() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null); // null | item being added/edited
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = useCallback(() => {
    return getProducts(id).then(setProducts);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getRestaurant(id), getProducts(id)])
      .then(([rest, prods]) => {
        if (cancelled) return;
        setRestaurant(rest);
        setProducts(prods);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError('Failed to load menu.'); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [id]);

  function startAdd() { setErrors({}); setDraft({ ...EMPTY_ITEM }); }
  function startEdit(p) {
    setErrors({});
    setDraft({ id: p.id, name: p.name || '', price: p.price ?? '', section: p.section || '', description: p.description || '', isAvailable: p.isAvailable !== false });
  }
  function setField(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!draft.name.trim()) e.name = 'Name is required';
    if (draft.price === '' || isNaN(parseFloat(draft.price)) || draft.price < 0) e.price = 'Price must be ≥ 0';
    if (!draft.section.trim()) e.section = 'Section is required';
    return e;
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      name: draft.name.trim(),
      price: parseFloat(draft.price),
      section: draft.section.trim(),
      description: draft.description,
      isAvailable: draft.isAvailable,
    };
    setSaving(true);
    try {
      if (draft.id) await updateProduct(id, draft.id, payload);
      else await createProduct(id, payload);
      await loadProducts();
      setDraft(null);
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(pid) {
    setDeletingId(pid);
    setError('');
    try {
      await deleteProduct(id, pid);
      setProducts((prev) => prev.filter((p) => p.id !== pid));
    } catch (err) {
      setError(err.message || 'Failed to delete item.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <AppBar />
        <main className="admin__loading"><div className="admin__spinner" /></main>
      </div>
    );
  }

  return (
    <div className="admin">
      <AppBar />
      <main className="admin__main admin__main--narrow">
        <button type="button" className="admin__link" onClick={() => navigate('/admin')}>← Back to admin</button>
        <div className="admin__head">
          <div>
            <h1 className="admin__title">Menu</h1>
            <p className="admin__sub">{restaurant?.name}</p>
          </div>
          {!draft && (
            <button type="button" className="admin__primary" onClick={startAdd}>+ Add item</button>
          )}
        </div>

        {error && <div className="admin__error" role="alert">{error}</div>}

        {draft && (
          <form onSubmit={handleSave} noValidate className="admin__form admin__item-form">
            <h2 className="admin__form-title">{draft.id ? 'Edit item' : 'New item'}</h2>
            <FormField label="Name" htmlFor="item-name" error={errors.name}>
              <input id="item-name" className="input" value={draft.name} onChange={(e) => setField('name', e.target.value)} />
            </FormField>
            <div className="admin__form-row">
              <FormField label="Price (₪)" htmlFor="item-price" error={errors.price}>
                <input id="item-price" className="input" type="number" step="any" value={draft.price} onChange={(e) => setField('price', e.target.value)} />
              </FormField>
              <FormField label="Section" htmlFor="item-section" hint="e.g. Starters, Mains, Drinks" error={errors.section}>
                <input id="item-section" className="input" value={draft.section} onChange={(e) => setField('section', e.target.value)} />
              </FormField>
            </div>
            <FormField label="Description" htmlFor="item-desc">
              <input id="item-desc" className="input" value={draft.description} onChange={(e) => setField('description', e.target.value)} />
            </FormField>
            <label className="admin__checkbox">
              <input type="checkbox" checked={draft.isAvailable} onChange={(e) => setField('isAvailable', e.target.checked)} />
              Available
            </label>
            <div className="admin__form-actions">
              <button type="submit" className="admin__primary" disabled={saving}>
                {saving ? 'Saving…' : draft.id ? 'Save item' : 'Add item'}
              </button>
              <button type="button" className="admin__btn" onClick={() => setDraft(null)}>Cancel</button>
            </div>
          </form>
        )}

        {products.length === 0 ? (
          <p className="admin__empty">No menu items yet — add your first one.</p>
        ) : (
          <ul className="admin__list">
            {products.map((p) => (
              <li key={p.id} className="admin__card">
                <div className="admin__card-info">
                  <p className="admin__card-name">
                    {p.name}
                    {p.isAvailable === false && <span className="admin__tag">Unavailable</span>}
                  </p>
                  <p className="admin__card-meta">{p.section} · ₪{p.price}</p>
                </div>
                <div className="admin__card-actions">
                  <button type="button" className="admin__btn" onClick={() => startEdit(p)}>Edit</button>
                  <button
                    type="button"
                    className="admin__btn admin__btn--danger"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? 'Deleting…' : 'Delete'}
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
