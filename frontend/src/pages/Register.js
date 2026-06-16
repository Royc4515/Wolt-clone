import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { validateRegistration } from '../utils/validation';
import useFormErrors from '../hooks/useFormErrors';
import AuthCard from '../components/auth/AuthCard';
import FormField from '../components/auth/FormField';
import FormError from '../components/auth/FormError';
import PasswordInput from '../components/auth/PasswordInput';
import '../styles/Register.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { errors, serverError, setErrors, setServerError, clearFieldError } = useFormErrors();

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, profilePicture: 'File must be an image' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profilePicture: 'Image must be under 2 MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePicture(ev.target.result);
      clearFieldError('profilePicture');
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateRegistration({
      username,
      password,
      confirmPassword,
      displayName,
      profilePicture,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register({ username, password, confirmPassword, displayName, profilePicture, location: { lat: 0, lng: 0 } });
      navigate('/login');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      maxWidth="460px"
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Username" htmlFor="username" hint="At least 3 characters · letters, numbers, underscores" error={errors.username}>
          <input
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
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
          />
        </FormField>

        <FormField label="Confirm Password" htmlFor="confirmPassword" hint="Must match your password" error={errors.confirmPassword}>
          <PasswordInput
            id="confirmPassword"
            className={`input${errors.confirmPassword ? ' is-invalid' : ''}`}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
          />
        </FormField>

        <FormField label="Display Name" htmlFor="displayName" hint="Your public name shown to other users" error={errors.displayName}>
          <input
            className={`input${errors.displayName ? ' is-invalid' : ''}`}
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Full Name"
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); clearFieldError('displayName'); }}
          />
        </FormField>

        <FormField label="Profile Picture" htmlFor="profilePicture" hint="JPG, PNG or GIF · shown next to your orders" error={errors.profilePicture}>
          <div className="avatar-picker">
            <div
              className="avatar-preview"
              data-testid="avatar-circle"
              onClick={handleAvatarClick}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleAvatarClick()}
              aria-label="Choose profile picture"
            >
              {profilePicture
                ? <img src={profilePicture} alt="profile preview" />
                : <span>Click to<br />upload</span>
              }
            </div>
            <input
              ref={fileInputRef}
              id="profilePicture"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-label="Profile picture file input"
            />
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={handleAvatarClick}
            >
              Choose photo
            </button>
          </div>
        </FormField>

        <button
          className="btn btn--soft btn--pill btn--block btn--lg"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account…' : 'Create Account'}
        </button>

        <FormError message={serverError} />
      </form>
    </AuthCard>
  );
}
