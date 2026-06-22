import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurant from './pages/Restaurant';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import SearchResults from './pages/SearchResults';
import AdminDashboard from './pages/admin/AdminDashboard';
import RestaurantForm from './pages/admin/RestaurantForm';
import MenuManager from './pages/admin/MenuManager';
import RestaurantOrders from './pages/admin/RestaurantOrders';
import PublicRoute from './components/PublicRoute';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/restaurant/:id" element={<Restaurant />} />
        <Route path="/checkout/:restaurantId" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />

        {/* ── Admin ── */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/restaurants/new" element={<AdminRoute><RestaurantForm /></AdminRoute>} />
        <Route path="/admin/restaurants/:id/edit" element={<AdminRoute><RestaurantForm /></AdminRoute>} />
        <Route path="/admin/restaurants/:id/menu" element={<AdminRoute><MenuManager /></AdminRoute>} />
        <Route path="/admin/restaurants/:id/orders" element={<AdminRoute><RestaurantOrders /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
