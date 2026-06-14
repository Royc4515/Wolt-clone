import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurant from './pages/Restaurant';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/restaurant/:id" element={<Restaurant />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
