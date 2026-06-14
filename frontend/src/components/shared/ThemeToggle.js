import { useState, useEffect } from 'react';
import './ThemeToggle.css';

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('wolt-theme', t);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('wolt-theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []); // intentional: sync DOM attribute once on mount; handleToggle handles subsequent changes

  function handleToggle(t) {
    setTheme(t);
    applyTheme(t);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button aria-pressed={theme === 'dark'} onClick={() => handleToggle('dark')}>Dark</button>
      <button aria-pressed={theme === 'light'} onClick={() => handleToggle('light')}>Light</button>
    </div>
  );
}
