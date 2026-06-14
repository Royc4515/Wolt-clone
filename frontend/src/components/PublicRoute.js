import { Navigate } from 'react-router-dom';

function isAuthenticated() {
  const token = localStorage.getItem('jwt_token');
  return typeof token === 'string' && token.split('.').length === 3;
}

export default function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/" replace /> : children;
}
