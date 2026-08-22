import { useEffect } from 'react';

// Sets document.title and the meta description tag for whichever page uses
// it, and restores the site default when that page unmounts. This covers
// what a client-rendered SPA can reasonably do for SEO/sharing without a
// server-rendering setup - it improves the browser tab and helps if a
// crawler executes JS, but for guaranteed rich previews on social platforms
// (which often don't run JS), server-side rendering would eventually be
// needed. Flagging that honestly rather than overpromising here.
export default function usePageMeta(title, description) {
  useEffect(() => {
    const fullTitle = title ? `${title} — Franklin Nchukwi` : 'Franklin Nchukwi';
    document.title = fullTitle;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }

    return () => {
      document.title = 'Franklin Nchukwi';
    };
  }, [title, description]);
}
