import ThemeToggle from '../shared/ThemeToggle';
import woltLogo from '../../assets/wolt-wordmark.png';
import './AuthCard.css';

export default function AuthCard({ title, footer, children, maxWidth = '440px' }) {
  return (
    <>
      <ThemeToggle />
      <div className="auth-wrap">
        <div className="auth-card card card--pad" style={{ maxWidth }}>
          <div className="auth-brand">
            <img src={woltLogo} alt="Wolt" className="auth-brand__logo" />
          </div>
          <h1 className="t-h2">{title}</h1>
          {children}
          {footer && <div className="auth-foot">{footer}</div>}
        </div>
      </div>
    </>
  );
}
