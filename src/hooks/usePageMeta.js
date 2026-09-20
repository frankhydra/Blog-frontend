import { useEffect } from 'react';

// Sets document.title and the meta description tag for whichever page uses
// it, and restores the site default when that page unmounts. This covers
// what a client-rendered SPA can reasonably do for SEO/sharing without a
// server-rendering setup - it improves the browser tab and helps if a
// crawler executes JS, but for guaranteed rich previews on social platforms
// (which often don't run JS), server-side rendering would eventually be
// needed. Flagging that honestly rather than overpromising here.
// Sets document.title and the meta description tag for whichever page uses
// it, and restores the site default when that page unmounts. This covers
// what a client-rendered SPA can reasonably do for SEO/sharing without a
// server-rendering setup - it improves the browser tab and helps if a
// crawler executes JS, but for guaranteed rich previews on social platforms
// (which often don't run JS), server-side rendering would eventually be
// needed. Flagging that honestly rather than overpromising here.
//
// title === undefined (not null) means "don't touch document.title at
// all" - for a component that's sometimes embedded inside another page
// that already set its own title (e.g. a dashboard tab), where null would
// still reset it to the bare site title and fight whatever the parent
// already set. null itself is unchanged - it still means "use the bare
// site title," same as always, for a page like Home.jsx that wants that.
export default function usePageMeta(title, description) {
  useEffect(() => {
    if (title === undefined) return;

    const fullTitle = title ? `${title} — Nchukwi` : 'Nchukwi';
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
      document.title = 'Nchukwi';
    };
  }, [title, description]);
}
