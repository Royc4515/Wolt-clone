import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { validatePassword } from '../utils/validation';
import '../styles/Login.css';

function validateUsername(username) {
    if (!username || username.trim() === '') return 'Username is required';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (username.trim().length > 20) return 'Username must be at most 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return 'Letters, numbers and underscores only';
    return null;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const usernameRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  function clearFieldError(field) {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    const usernameErr = validateUsername(username);
    const passErr = validatePassword(password);
    if (usernameErr) newErrors.username = usernameErr;
    if (passErr) newErrors.password = passErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Incorrect username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card card--pad login-card">

        <div className="login-brand">
          <span className="dot">W</span> Wolt
        </div>

        <h1 className="t-h2">Log in to your account</h1>

        <form className="login-form" onSubmit={handleSubmit} noValidate>

          <div className="field">
            <label className="field__label" htmlFor="username">Username</label>
            <input
              ref={usernameRef}
              className={`input${errors.username ? ' is-invalid' : ''}`}
              id="username"
              type="text"
              autoComplete="username"
              placeholder="your_username"
              value={username}
              onChange={e => { setUsername(e.target.value); clearFieldError('username'); }}
            />
            {errors.username
              ? <span className="field-error">{errors.username}</span>
              : <span className="field__hint">3–20 characters · letters, numbers, underscores</span>
            }
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">Password</label>
            <input
              className={`input${errors.password ? ' is-invalid' : ''}`}
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
            />
            {errors.password
              ? <span className="field-error">{errors.password}</span>
              : <span className="field__hint">At least 8 characters · mix of letters and numbers</span>
            }
          </div>

          <button
            className="btn btn--primary btn--block btn--lg"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>

          <div
            className={`form-error${serverError ? ' is-visible' : ''}`}
            role="alert"
            aria-live="polite"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <path d="M12 16.5v.5" />
            </svg>
            <span>{serverError}</span>
          </div>

        </form>

        <div className="login-foot">
          Don't have an account? <Link to="/register">Register</Link>
        </div>

      </div>
    </div>
  );
}
