import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '../../components/AppBar';
import FormField from '../../components/auth/FormField';
import { getRestaurant, createRestaurant, updateRestaurant } from '../../api/restaurants';
import './admin.css';

const EMPTY = {
  name: '', category: '', lat: '', lng: '', deliveryFee: '', deliveryTime: '',
  description: '', phone: '', openHours: '', rating: '', image: '', isPromoted: false,
};

export default function RestaurantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    getRestaurant(id)
      .then((r) => {
        if (cancelled) return;
        setForm({
          name: r.name || '', category: r.category || '',
          lat: r.location?.lat ?? '', lng: r.location?.lng ?? '',
          deliveryFee: r.deliveryFee ?? '', deliveryTime: r.deliveryTime || '',
          description: r.description || '', phone: r.phone || '', openHours: r.openHours || '',
          rating: r.rating ?? '', image: r.image || '', isPromoted: !!r.isPromoted,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setServerError('Failed to load restaurant.'); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [id, editing]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((er) => ({ ...er, image: 'File must be an image' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => set('image', ev.target.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.category.trim()) e.category = 'Category is required';
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (form.lat === '' || isNaN(lat) || lat < -90 || lat > 90) e.lat = 'Latitude must be between -90 and 90';
    if (form.lng === '' || isNaN(lng) || lng < -180 || lng > 180) e.lng = 'Longitude must be between -180 and 180';
    if (form.rating !== '' && (isNaN(parseFloat(form.rating)) || form.rating < 0 || form.rating > 10)) e.rating = 'Rating must be 0–10';
    if (form.deliveryFee !== '' && (isNaN(parseFloat(form.deliveryFee)) || form.deliveryFee < 0)) e.deliveryFee = 'Delivery fee must be ≥ 0';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
      description: form.description,
      phone: form.phone,
      openHours: form.openHours,
      image: form.image,
      isPromoted: form.isPromoted,
    };
    if (form.deliveryFee !== '') payload.deliveryFee = parseFloat(form.deliveryFee);
    if (form.deliveryTime !== '') payload.deliveryTime = form.deliveryTime;
    if (form.rating !== '') payload.rating = parseFloat(form.rating);

    setSaving(true);
    try {
      if (editing) {
        await updateRestaurant(id, payload);
        navigate('/admin');
      } else {
        const res = await createRestaurant(payload);
        navigate(res?.id ? `/admin/restaurants/${res.id}/menu` : '/admin');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to save restaurant.');
      setSaving(false);
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
        <h1 className="admin__title">{editing ? 'Edit restaurant' : 'New restaurant'}</h1>

        {serverError && <div className="admin__error" role="alert">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate className="admin__form">
          <FormField label="Name" htmlFor="name" error={errors.name}>
            <input id="name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </FormField>

          <FormField label="Category" htmlFor="category" hint="e.g. Pizza, Sushi, Burgers" error={errors.category}>
            <input id="category" className="input" value={form.category} onChange={(e) => set('category', e.target.value)} />
          </FormField>

          <div className="admin__form-row">
            <FormField label="Latitude" htmlFor="lat" hint="-90 to 90" error={errors.lat}>
              <input id="lat" className="input" type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} />
            </FormField>
            <FormField label="Longitude" htmlFor="lng" hint="-180 to 180" error={errors.lng}>
              <input id="lng" className="input" type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)} />
            </FormField>
          </div>

          <div className="admin__form-row">
            <FormField label="Delivery fee (₪)" htmlFor="deliveryFee" hint="base fee" error={errors.deliveryFee}>
              <input id="deliveryFee" className="input" type="number" step="any" value={form.deliveryFee} onChange={(e) => set('deliveryFee', e.target.value)} />
            </FormField>
            <FormField label="Delivery time" htmlFor="deliveryTime" hint="e.g. 25–35 min">
              <input id="deliveryTime" className="input" value={form.deliveryTime} onChange={(e) => set('deliveryTime', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="description">
            <input id="description" className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </FormField>

          <div className="admin__form-row">
            <FormField label="Phone" htmlFor="phone">
              <input id="phone" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </FormField>
            <FormField label="Open hours" htmlFor="openHours" hint="e.g. 10:00–23:00">
              <input id="openHours" className="input" value={form.openHours} onChange={(e) => set('openHours', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Rating" htmlFor="rating" hint="0–10" error={errors.rating}>
            <input id="rating" className="input" type="number" step="any" value={form.rating} onChange={(e) => set('rating', e.target.value)} />
          </FormField>

          <FormField label="Image" htmlFor="image" error={errors.image}>
            <div className="admin__image-field">
              {form.image && <img src={form.image} alt="restaurant" className="admin__image-preview" />}
              <input id="image" type="file" accept="image/*" onChange={handleImage} />
            </div>
          </FormField>

          <label className="admin__checkbox">
            <input type="checkbox" checked={form.isPromoted} onChange={(e) => set('isPromoted', e.target.checked)} />
            Promoted
          </label>

          <button type="submit" className="admin__primary admin__primary--block" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create restaurant'}
          </button>
        </form>
      </main>
    </div>
  );
}
