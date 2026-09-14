import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

// The six themes the site supports, in the order they should list in the
// picker. `key` is the exact value written to <html data-theme> (and to
// index.html's blocking inline script, which must be kept in sync with
// this list by hand since it can't import from here). `swatch` is just
// the two colors the picker UI uses to draw each option's preview dot -
// paper first, accent second - not read by any CSS in index.css itself.
export const THEMES = [
  { key: 'postmark', label: 'Postmark', swatch: ['#F7F3EC', '#2B3A67'] },
  { key: 'midnight', label: 'Midnight', swatch: ['#17130F', '#8AA0E8'] },
  { key: 'harbor', label: 'Harbor', swatch: ['#EEF2F6', '#2F5FA8'] },
  { key: 'indigo', label: 'Indigo Night', swatch: ['#0E1420', '#7B93D9'] },
  { key: 'meadow', label: 'Meadow', swatch: ['#F3F5EC', '#3F6B3A'] },
  { key: 'ash', label: 'Ash', swatch: ['#161617', '#8697AD'] },
];

const THEME_KEYS = THEMES.map((t) => t.key);
const DARK_KEYS = ['midnight', 'indigo', 'ash']; // which themes count as "dark" for the OS-preference fallback

// Reads the same value the blocking inline script in index.html already
// used to set `data-theme` on <html> before React mounted - so the very
// first render here agrees with what's already on screen instead of
// causing a flash/flip on load. Keep this in sync with that script (and
// with THEMES above) if the theme list ever changes.
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (THEME_KEYS.includes(stored)) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'postmark';
  } catch {
    return 'postmark';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Keep the <html data-theme> attribute and localStorage in sync with
  // state on every change - this is the single place that actually
  // flips every CSS variable defined under each [data-theme="..."] block.
  // Always set the attribute explicitly (including for the default
  // "postmark" theme) rather than only setting it for non-default themes -
  // simpler to reason about than "no attribute means postmark" once there
  // are six options instead of two.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Privacy mode / storage disabled - theme just won't persist
      // across visits, which is a reasonable enough fallback.
    }
  }, [theme]);

  // If the visitor never explicitly chose a theme on this site, follow
  // their OS-level light/dark preference live (e.g. their system
  // switches to dark mode at sunset). This only ever moves them between
  // the two original brand themes (postmark/midnight) - there's no way
  // to guess that an OS "prefers dark" means specifically Ash over
  // Indigo Night, so the four extra themes are opt-in only, via the
  // picker. Once the visitor picks anything themselves (including
  // picking postmark or midnight directly), that explicit choice is
  // saved and this listener is skipped from then on.
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
      setThemeState(e.matches ? 'midnight' : 'postmark');
    }
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  function setTheme(key) {
    if (THEME_KEYS.includes(key)) setThemeState(key);
  }

  const isDark = DARK_KEYS.includes(theme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
