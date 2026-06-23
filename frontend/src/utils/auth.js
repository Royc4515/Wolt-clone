export const JWT_TOKEN_KEY = 'jwt_token';
export const USER_LOCATION_KEY = 'user_location';
export const USER_DISPLAYNAME_KEY = 'user_displayname';

// Decode a JWT payload. JWTs are base64url-encoded (`-`/`_` instead of `+`/`/`,
// padding stripped), but atob expects standard base64 — normalise before decoding
// so real server tokens (not just test tokens) parse reliably.
function decodeJwtPayload(token) {
  const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = segment.padEnd(segment.length + ((4 - (segment.length % 4)) % 4), '=');
  return JSON.parse(atob(padded));
}

export function getAuthState() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token || token.split('.').length !== 3) return { authenticated: false, user: null };
  try {
    return { authenticated: true, user: decodeJwtPayload(token) };
  } catch {
    return { authenticated: false, user: null };
  }
}

export function isAuthenticated() {
  return getAuthState().authenticated;
}

export function getCurrentUser() {
  return getAuthState().user;
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin';
}
