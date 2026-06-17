import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppBar from '../components/AppBar';
import PasswordInput from '../components/auth/PasswordInput';
import { getCurrentUser } from '../utils/auth';
import { getUser } from '../api/users';
import { updateUserProfile, logout } from '../api/auth';
import '../styles/Profile.css';

const TABS = [
  { id: 'personal', label: 'Personal info' },
  { id: 'orders',   label: 'Order history', to: '/orders' },
];

export default function Profile() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab] = useState('personal');

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    getUser(user.id).then(data => {
      setDisplayName(data.displayName || '');
      setProfilePicture(data.profilePicture || '');
      setLat(data.location?.lat ?? '');
      setLng(data.location?.lng ?? '');
    }).catch(() => {});
  }, []);

  function handleAvatarClick() { fileInputRef.current?.click(); }

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
      localStorage.setItem('user_location', JSON.stringify({ lat: parseFloat(lat), lng: parseFloat(lng) }));
      localStorage.setItem('user_displayname', displayName);
    } catch (err) {
      setServerError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('user_location');
    localStorage.removeItem('user_displayname');
    logout();
    navigate('/login');
  }

  return (
    <div className="profile-page">
      <AppBar />

      <div className="profile-content">
        {/* Page heading */}
        <div className="profile-header">
          <h1 className="profile-heading">Profile</h1>
        </div>

        {/* Tab bar */}
        <nav className="profile-tabs">
          {TABS.map(tab =>
            tab.to ? (
              <Link
                key={tab.id}
                to={tab.to}
                className={`profile-tab${activeTab === tab.id ? ' profile-tab--active' : ''}`}
              >
                {tab.label}
              </Link>
            ) : (
              <span
                key={tab.id}
                className={`profile-tab${activeTab === tab.id ? ' profile-tab--active' : ''}`}
              >
                {tab.label}
              </span>
            )
          )}
        </nav>

        {/* Personal info rows */}
        <form onSubmit={handleSave} noValidate>
          {/* Avatar row */}
          <div className="profile-row">
            <span className="profile-row-label">Photo</span>
            <div className="profile-row-control profile-avatar-control">
              <div
                className="profile-avatar"
                onClick={handleAvatarClick}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleAvatarClick()}
              >
                {profilePicture
                  ? <img src={profilePicture} alt="profile" />
                  : <span className="profile-avatar-initials">{user?.displayName?.[0]?.toUpperCase()}</span>
                }
              </div>
              <button type="button" className="profile-change-link" onClick={handleAvatarClick}>
                Change photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              {errors.profilePicture && <span className="profile-row-error">{errors.profilePicture}</span>}
            </div>
          </div>

          {/* Display name row */}
          <div className="profile-row">
            <label className="profile-row-label" htmlFor="displayName">Display name</label>
            <div className="profile-row-control">
              <input
                id="displayName"
                className={`profile-input${errors.displayName ? ' profile-input--error' : ''}`}
                type="text"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setErrors(prev => ({ ...prev, displayName: undefined })); }}
              />
              {errors.displayName && <span className="profile-row-error">{errors.displayName}</span>}
            </div>
          </div>

          {/* Username row — read only */}
          <div className="profile-row">
            <span className="profile-row-label">Username</span>
            <div className="profile-row-control">
              <span className="profile-row-readonly">{user?.username}</span>
            </div>
          </div>

          {/* Location row */}
          <div className="profile-row">
            <span className="profile-row-label">Location</span>
            <div className="profile-row-control profile-location-row">
              <div className="profile-location-pair">
                <div className="profile-location-field">
                  <label className="profile-sublabel" htmlFor="lat">Latitude <span className="profile-hint">(-90 to 90)</span></label>
                  <input
                    id="lat"
                    className={`profile-input${errors.lat ? ' profile-input--error' : ''}`}
                    type="number"
                    step="any"
                    placeholder="32.08"
                    value={lat}
                    onChange={e => { setLat(e.target.value); setErrors(prev => ({ ...prev, lat: undefined })); }}
                  />
                  {errors.lat && <span className="profile-row-error">{errors.lat}</span>}
                </div>
                <div className="profile-location-field">
                  <label className="profile-sublabel" htmlFor="lng">Longitude <span className="profile-hint">(-180 to 180)</span></label>
                  <input
                    id="lng"
                    className={`profile-input${errors.lng ? ' profile-input--error' : ''}`}
                    type="number"
                    step="any"
                    placeholder="34.78"
                    value={lng}
                    onChange={e => { setLng(e.target.value); setErrors(prev => ({ ...prev, lng: undefined })); }}
                  />
                  {errors.lng && <span className="profile-row-error">{errors.lng}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Password row */}
          <div className="profile-row">
            <label className="profile-row-label" htmlFor="password">New password <span className="profile-hint">(leave blank to keep)</span></label>
            <div className="profile-row-control">
              <PasswordInput
                id="password"
                className={`profile-input${errors.password ? ' profile-input--error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
              />
              {errors.password && <span className="profile-row-error">{errors.password}</span>}
            </div>
          </div>

          {/* Confirm password row */}
          <div className="profile-row">
            <label className="profile-row-label" htmlFor="confirmPassword">Confirm password</label>
            <div className="profile-row-control">
              <PasswordInput
                id="confirmPassword"
                className={`profile-input${errors.confirmPassword ? ' profile-input--error' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
              />
              {errors.confirmPassword && <span className="profile-row-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          {/* Actions */}
          {saveSuccess && <div className="profile-success">Changes saved successfully.</div>}
          {serverError && <div className="profile-error-banner">{serverError}</div>}

          <div className="profile-actions">
            <button className="profile-save-btn" type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save changes'}
            </button>
            <button className="profile-logout-btn" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
