import ThemeToggle from '../shared/ThemeToggle';
import AnimatedLogo from '../AnimatedLogo';
import './AuthCard.css';

export default function AuthCard({ title, footer, children, maxWidth = '440px' }) {
  return (
    <>
      <div className="auth-toggle-wrap">
        <ThemeToggle />
      </div>
      <div className="auth-wrap">
        <div className="auth-card card card--pad" style={{ '--auth-card-max-width': maxWidth }}>
          <div className="auth-brand">
            <AnimatedLogo className="auth-brand__logo" />
          </div>
          <h1 className="t-h2">{title}</h1>
          {children}
          {footer && <div className="auth-foot">{footer}</div>}
        </div>
      </div>
    </>
  );
}
