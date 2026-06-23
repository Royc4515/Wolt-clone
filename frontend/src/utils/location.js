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

// Broadcast that the saved location changed so same-tab listeners (e.g. the Home
// feed and recommendations) can re-read it without a manual refresh. The native
// `storage` event only fires across tabs, so we use a custom event for same-tab
// updates.
export const LOCATION_CHANGED_EVENT = 'user-location-changed';

export function notifyLocationChanged() {
  window.dispatchEvent(new Event(LOCATION_CHANGED_EVENT));
}
