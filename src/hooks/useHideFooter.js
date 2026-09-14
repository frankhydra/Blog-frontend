import { useEffect } from 'react';
import { useChrome } from '../context/ChromeContext';

// Call with `true` while a page wants the site footer hidden. Restores it
// automatically on unmount or as soon as the condition flips back to
// false, so leaving the page (by any route - submitting, navigating away,
// closing the tab) can never leave the footer stuck hidden elsewhere.
export default function useHideFooter(shouldHide) {
  const { setHideFooter } = useChrome();

  useEffect(() => {
    if (!shouldHide) return;
    setHideFooter(true);
    return () => setHideFooter(false);
  }, [shouldHide, setHideFooter]);
}
