export const JWT_TOKEN_KEY = 'jwt_token';
export const USER_LOCATION_KEY = 'user_location';
export const USER_DISPLAYNAME_KEY = 'user_displayname';

export function getAuthState() {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token || token.split('.').length !== 3) return { authenticated: false, user: null };
  try {
    return { authenticated: true, user: JSON.parse(atob(token.split('.')[1])) };
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
