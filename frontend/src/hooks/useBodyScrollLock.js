import { useEffect } from 'react';

/**
 * Locks document body scroll while active. Pass no argument (or true) to lock
 * unconditionally (e.g. inside a modal that is always open when rendered).
 * Pass a boolean state value to toggle with component state (e.g. cartOpen).
 */
export default function useBodyScrollLock(isActive = true) {
  useEffect(() => {
    if (!isActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isActive]);
}
