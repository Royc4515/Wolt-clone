export function isAuthenticated() {
  const token = localStorage.getItem('jwt_token');
  return Boolean(token && token.split('.').length === 3);
}

export function getCurrentUser() {
  const token = localStorage.getItem('jwt_token');
  if (!token || token.split('.').length !== 3) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}
