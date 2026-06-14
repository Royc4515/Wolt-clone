import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { validatePassword } from '../utils/validation';
import useFormErrors from '../hooks/useFormErrors';
import AuthCard from '../components/auth/AuthCard';
import FormField from '../components/auth/FormField';
import FormError from '../components/auth/FormError';
import PasswordInput from '../components/auth/PasswordInput';

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
  const [isLoading, setIsLoading] = useState(false);
  const { errors, serverError, setErrors, setServerError, clearFieldError } = useFormErrors();

  const usernameRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

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
    <AuthCard
      title="Log in to your account"
      footer={<>Don't have an account? <Link to="/register">Register</Link></>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Username" htmlFor="username" hint="3–20 characters · letters, numbers, underscores" error={errors.username}>
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
        </FormField>

        <FormField label="Password" htmlFor="password" hint="At least 8 characters · mix of letters and numbers" error={errors.password}>
          <PasswordInput
            id="password"
            className={`input${errors.password ? ' is-invalid' : ''}`}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
          />
        </FormField>

        <button
          className="btn btn--soft btn--pill btn--block btn--lg"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>

        <FormError message={serverError} />
      </form>
    </AuthCard>
  );
}
