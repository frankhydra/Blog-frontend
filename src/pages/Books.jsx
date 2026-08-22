import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading');

  usePageMeta('Books', 'Self-published books - mine and other writers on this platform.');

  useEffect(() => {
    apiClient
      .get('/books')
      .then((res) => {
        setBooks(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      <p className="kicker">Books</p>
      <h1>Self-published, mine and others'</h1>
      <p className="post-meta">A shelf for books by me and other writers on this platform.</p>

      {user && (
        <p>
          <Link to="/add-book">Add a book</Link>
        </p>
      )}

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Couldn't load books.</p>}
      {status === 'ready' && books.length === 0 && <p>No books listed yet.</p>}

      <div className="book-grid">
        {books.map((book) => (
          <Link to={`/books/${book.slug}`} key={book.id} className="book-card">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="book-cover" />
            ) : (
              <div className="book-cover book-cover-placeholder">{book.title}</div>
            )}
            <h3>{book.title}</h3>
            <p className="post-meta">{book.author_name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
