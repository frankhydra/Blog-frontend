import { useEffect } from 'react';
import { useChrome } from '../context/ChromeContext';

// Call with `true` while a page wants the site header (brand, nav,
// hamburger, account menu, theme toggle - all of it) hidden. Restores it
// automatically on unmount or as soon as the condition flips back to
// false, same reasoning as useHideFooter: leaving the page by any route
// can never leave the header stuck hidden elsewhere.
export default function useHideHeader(shouldHide) {
  const { setHideHeader } = useChrome();

  useEffect(() => {
    if (!shouldHide) return;
    setHideHeader(true);
    return () => setHideHeader(false);
  }, [shouldHide, setHideHeader]);
}
