import '../../styles/forms.css';

export default function FormError({ message }) {
  return (
    <div
      className={`form-error${message ? ' is-visible' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16.5v.5" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
