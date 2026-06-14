import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurant from './pages/Restaurant';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/restaurant/:id" element={<ProtectedRoute><Restaurant /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
