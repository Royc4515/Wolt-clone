import { useState } from 'react';

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('wolt-theme', t);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('wolt-theme') || 'dark'
  );

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
