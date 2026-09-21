import { useEffect, useState } from 'react';

// Q3 - "build this search bar for all the pages that need it" - one
// shared component instead of three copies of the same input+debounce
// logic, dropped into Books.jsx/CommunityBlogs.jsx/Letters.jsx. Debounces
// locally (400ms) so it doesn't fire a request on every keystroke, then
// hands the trimmed term up to the page via onSearch - the page owns the
// actual fetch (it already knows its own endpoint/query shape).
export default function SearchBar({ placeholder = 'Search…', onSearch }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="content-search-bar">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
