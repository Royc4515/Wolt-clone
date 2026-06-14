import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/design-system.css';
import App from './App';

// Apply saved theme before first render to avoid flash
const savedTheme = localStorage.getItem('wolt-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
