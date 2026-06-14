import { Navigate } from 'react-router-dom';

export default function PublicRoute({ children }) {
    const token = localStorage.getItem('jwt_token');
    if (token) return <Navigate to="/" replace />;
    return children;
}
