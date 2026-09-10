import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

// Reads the same value the blocking inline script in index.html already
// used to set (or not set) `data-theme` on <html> before React mounted -
// so the very first render here agrees with what's already on screen
// instead of causing a flash/flip on load.
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Keep the <html data-theme> attribute and localStorage in sync with
  // state on every change - this is the single place that actually
  // flips every CSS variable defined under [data-theme="dark"].
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Privacy mode / storage disabled - theme just won't persist
      // across visits, which is a reasonable enough fallback.
    }
  }, [theme]);

  // If the visitor never explicitly chose a theme on this site, follow
  // their OS-level preference live (e.g. their system switches to dark
  // mode at sunset). Once they've tapped the toggle themselves, that
  // explicit choice is saved and this listener is skipped from then on.
  useEffect(() => {
    let hasStoredChoice = false;
    try {
      hasStoredChoice = localStorage.getItem('theme') !== null;
    } catch {
      hasStoredChoice = false;
    }
    if (hasStoredChoice) return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e) {
      setTheme(e.matches ? 'dark' : 'light');
    }
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
