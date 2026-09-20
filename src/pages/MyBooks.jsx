import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

// Mirrors MyPosts.jsx's shape, but simpler - a book has no draft/
// published distinction to label (BookController::store has never gated
// books behind a review step, unlike posts), so this is just a plain
// list: title, edit, delete.
export default function MyBooks({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user]);

  function load() {
    apiClient
      .get('/my/books')
      .then((res) => {
        setBooks(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function handleDelete(book) {
    if (!confirm(`Delete "${book.title}"? This can't be undone.`)) return;
    setDeletingId(book.id);
    try {
      await apiClient.delete(`/books/${book.slug}`);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch {
      alert("Couldn't delete that book.");
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see your books.</p>;

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your books.</p>}
      {status === 'ready' && books.length === 0 && (
        <p className="empty-state">
          Nothing here yet. <Link to="/add-book">Launch your first book</Link>.
        </p>
      )}

      <ul className="post-list">
        {books.map((book) => (
          <li key={book.id} className="post-list-item">
            <h2>
              <Link to={`/books/${book.slug}`}>{book.title}</Link>
            </h2>
            <p className="post-meta">
              <Link to={`/books/${book.slug}/edit`}>Edit</Link>
              {' '}· <button
                type="button"
                onClick={() => handleDelete(book)}
                disabled={deletingId === book.id}
                className="link-button-inline"
              >
                {deletingId === book.id ? 'Deleting…' : 'Delete'}
              </button>
            </p>
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) return content;

  return (
    <div>
      <h1>My books</h1>
      <p>
        <Link to="/add-book">Launch a new book</Link>
      </p>

      {content}
    </div>
  );
}
