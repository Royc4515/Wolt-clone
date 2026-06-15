import { useState, useEffect } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'dark'
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.theme || 'dark');
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  return theme;
}
