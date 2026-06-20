import FormField from '../auth/FormField';
import ImageUpload from './ImageUpload';

const SECTIONS = ['Starters', 'Mains', 'Burgers', 'Side Dishes', 'Sauces', 'Sweets', 'Drinks', 'Beers'];

// Add / edit form for a single menu item. Rendered at the top when adding a new
// item, or inline in the list (in the item's own row) when editing.
export default function ItemForm({ draft, errors, saving, onField, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} noValidate className="admin__form admin__item-form">
      <h2 className="admin__form-title">{draft.id ? 'Edit item' : 'New item'}</h2>

      <FormField label="Name" htmlFor="item-name" error={errors.name}>
        <input id="item-name" className="input" value={draft.name} onChange={(e) => onField('name', e.target.value)} />
      </FormField>

      <div className="admin__form-row">
        <FormField label="Price (₪)" htmlFor="item-price" error={errors.price}>
          <input id="item-price" className="input" type="number" step="any" value={draft.price} onChange={(e) => onField('price', e.target.value)} />
        </FormField>
        <FormField label="Section" htmlFor="item-section" hint="pick or type your own" error={errors.section}>
          <input id="item-section" className="input" list="admin-sections" value={draft.section} onChange={(e) => onField('section', e.target.value)} />
          <datalist id="admin-sections">
            {SECTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </FormField>
      </div>

      <FormField label="Description" htmlFor="item-desc">
        <input id="item-desc" className="input" value={draft.description} onChange={(e) => onField('description', e.target.value)} />
      </FormField>

      <FormField label="Image">
        <ImageUpload value={draft.image} onChange={(v) => onField('image', v)} label="item image" />
      </FormField>

      <button
        type="button"
        role="switch"
        aria-checked={draft.isAvailable}
        className="admin__toggle"
        onClick={() => onField('isAvailable', !draft.isAvailable)}
      >
        <span>Available</span>
        <span className={`admin__toggle-switch${draft.isAvailable ? ' admin__toggle-switch--on' : ''}`}>
          <span className="admin__toggle-knob" />
        </span>
      </button>

      <div className="admin__form-actions">
        <button type="submit" className="admin__primary" disabled={saving}>
          {saving ? 'Saving…' : draft.id ? 'Save item' : 'Add item'}
        </button>
        <button type="button" className="admin__btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
