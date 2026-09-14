import { createContext, useContext, useState } from 'react';

const ChromeContext = createContext(null);

// Lets an individual page hide the site header and/or footer while it's
// on screen - built for the welcome gate (see HomeGate.jsx/
// useHideFooter.js/useHideHeader.js), but deliberately general rather
// than a one-off flag, since any future full-bleed/standalone page could
// reuse the same mechanism instead of each reinventing its own way to
// reach up into Layout.
export function ChromeProvider({ children }) {
  const [hideHeader, setHideHeader] = useState(false);
  const [hideFooter, setHideFooter] = useState(false);
  return (
    <ChromeContext.Provider value={{ hideHeader, setHideHeader, hideFooter, setHideFooter }}>
      {children}
    </ChromeContext.Provider>
  );
}

export function useChrome() {
  return useContext(ChromeContext);
}
