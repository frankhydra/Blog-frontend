import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import SkeletonGrid from '../components/SkeletonGrid';
import SearchBar from '../components/SearchBar';

// Q3 - search added, resolving the placement question in favor of "per
// content-type page" (matched the original instinct in the issues log):
// BookController::index() now accepts ?q=, matched against
// title/author_name/description.
export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [query, setQuery] = useState('');

  usePageMeta('Books', 'Books launched and sold directly by the people who wrote them.');

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get('/books', { params: query ? { q: query } : {} })
      .then((res) => {
        setBooks(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [query]);

  return (
    <div>
      <p className="kicker">Books</p>
      <h1>Launched here, sold directly — no publisher in the middle</h1>
      <p className="post-meta">A shelf for books by writers on this platform.</p>

      {user && (
        <p>
          <Link to="/add-book">Add a book</Link>
        </p>
      )}

      <SearchBar placeholder="Search books by title or author…" onSearch={setQuery} />

      {status === 'loading' && <SkeletonGrid variant="book" count={6} />}
      {status === 'error' && <p>Couldn't load books.</p>}
      {status === 'ready' && books.length === 0 && (
        <p>{query ? `No books match "${query}".` : 'No books listed yet.'}</p>
      )}

      {status === 'ready' && (
        <div className="book-grid">
          {books.map((book) => (
            <Link to={`/books/${book.slug}`} key={book.id} className="book-card">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="book-cover" loading="lazy" />
              ) : (
                <div className="book-cover book-cover-placeholder">{book.title}</div>
              )}
              <h3>{book.title}</h3>
              <p className="post-meta">{book.author_name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
