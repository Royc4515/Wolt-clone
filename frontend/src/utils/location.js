import { getCurrentUser, USER_LOCATION_KEY } from './auth';

const isValidLoc = (loc) =>
  loc && typeof loc.lat === 'number' && typeof loc.lng === 'number';

// The user's saved location lives in the JWT (set at login, refreshed by the
// server on profile update). Fall back to the local cache for older sessions.
export function getUserLocation() {
  const fromToken = getCurrentUser()?.location;
  if (isValidLoc(fromToken)) return fromToken;
  try {
    const saved = localStorage.getItem(USER_LOCATION_KEY);
    const loc = saved ? JSON.parse(saved) : null;
    return isValidLoc(loc) ? loc : null;
  } catch {
    return null;
  }
}
