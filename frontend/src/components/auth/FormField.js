import '../../styles/forms.css';

export default function FormField({ label, htmlFor, hint, error, children }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>{label}</label>
      {children}
      {error
        ? <span className="field-error">{error}</span>
        : <span className="field__hint">{hint}</span>
      }
    </div>
  );
}
