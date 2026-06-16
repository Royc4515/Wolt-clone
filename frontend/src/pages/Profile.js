import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import FormField from '../components/auth/FormField';
import FormError from '../components/auth/FormError';
import PasswordInput from '../components/auth/PasswordInput';
import { getCurrentUser } from '../utils/auth';
import { getUser } from '../api/users';
import { updateUserProfile, logout } from '../api/auth';
import '../styles/Profile.css';

export default function Profile() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    getUser(user.id).then(data => {
      setDisplayName(data.displayName || '');
      setProfilePicture(data.profilePicture || '');
      setLat(data.location?.lat ?? '');
      setLng(data.location?.lng ?? '');
    }).catch(() => {});
  }, []);

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
    reader.onload = ev => {
      setProfilePicture(ev.target.result);
      setErrors(prev => ({ ...prev, profilePicture: undefined }));
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    const newErrors = {};
    if (!displayName.trim()) newErrors.displayName = 'Display name is required';
    if (password && password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password && password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (lat === '' || isNaN(latNum) || latNum < -90 || latNum > 90) newErrors.lat = 'Latitude must be between -90 and 90';
    if (lng === '' || isNaN(lngNum) || lngNum < -180 || lngNum > 180) newErrors.lng = 'Longitude must be between -180 and 180';
    return newErrors;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveSuccess(false);
    setServerError('');
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const updateData = {
      displayName,
      profilePicture,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
    };
    if (password) updateData.password = password;

    setIsLoading(true);
    try {
      await updateUserProfile(user.id, updateData);
      setSaveSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setServerError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="profile-page">
      <AppBar />
      <div className="profile-container">
        <h1 className="profile-title">My Profile</h1>

        <form className="profile-form" onSubmit={handleSave} noValidate>

          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar" onClick={handleAvatarClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleAvatarClick()}>
              {profilePicture
                ? <img src={profilePicture} alt="profile" />
                : <span className="profile-avatar-initials">{user?.displayName?.[0]?.toUpperCase()}</span>
              }
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleAvatarClick}>Change photo</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {errors.profilePicture && <span className="profile-field-error">{errors.profilePicture}</span>}
          </div>

          {/* Username — read only */}
          <div className="profile-readonly">
            <span className="profile-readonly-label">Username</span>
            <span className="profile-readonly-value">{user?.username}</span>
          </div>

          <FormField label="Display Name" htmlFor="displayName" error={errors.displayName}>
            <input
              className={`input${errors.displayName ? ' is-invalid' : ''}`}
              id="displayName"
              type="text"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setErrors(prev => ({ ...prev, displayName: undefined })); }}
            />
          </FormField>

          <div className="profile-section-label">Location</div>
          <div className="profile-location-fields">
            <FormField label="Latitude" htmlFor="lat" hint="-90 to 90" error={errors.lat}>
              <input
                className={`input${errors.lat ? ' is-invalid' : ''}`}
                id="lat" type="number" step="any"
                value={lat}
                onChange={e => { setLat(e.target.value); setErrors(prev => ({ ...prev, lat: undefined })); }}
              />
            </FormField>
            <FormField label="Longitude" htmlFor="lng" hint="-180 to 180" error={errors.lng}>
              <input
                className={`input${errors.lng ? ' is-invalid' : ''}`}
                id="lng" type="number" step="any"
                value={lng}
                onChange={e => { setLng(e.target.value); setErrors(prev => ({ ...prev, lng: undefined })); }}
              />
            </FormField>
          </div>

          <div className="profile-section-label">Change Password <span className="profile-section-hint">(leave blank to keep current)</span></div>
          <FormField label="New Password" htmlFor="password" error={errors.password}>
            <PasswordInput
              id="password"
              className={`input${errors.password ? ' is-invalid' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
            />
          </FormField>
          <FormField label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <PasswordInput
              id="confirmPassword"
              className={`input${errors.confirmPassword ? ' is-invalid' : ''}`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
            />
          </FormField>

          {saveSuccess && <div className="profile-success">Changes saved successfully.</div>}
          <FormError message={serverError} />

          <button className="btn btn--soft btn--pill btn--block btn--lg" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        <button className="btn btn--danger btn--pill btn--block profile-logout" type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}
