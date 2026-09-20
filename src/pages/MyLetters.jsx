import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

// New component - didn't exist as its own page before (letters only ever
// showed up as a plain list inline inside AuthorDashboard.jsx). Mirrors
// MyBooks.jsx's shape: a letter has just draft/published, no review-queue
// status like posts do, since only author/admin can write one at all
// (contributors are blocked at LetterController::authorizeCanWrite()).
export default function MyLetters({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [letters, setLetters] = useState([]);
  const [status, setStatus] = useState('loading');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user]);

  function load() {
    apiClient
      .get('/my/letters')
      .then((res) => {
        setLetters(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function handleDelete(letter) {
    if (!confirm(`Delete "${letter.title}"? This can't be undone.`)) return;
    setDeletingId(letter.id);
    try {
      await apiClient.delete(`/letters/${letter.slug}`);
      setLetters((prev) => prev.filter((l) => l.id !== letter.id));
    } catch {
      alert("Couldn't delete that letter.");
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see your letters.</p>;

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your letters.</p>}
      {status === 'ready' && letters.length === 0 && (
        <p className="empty-state">
          Your list is waiting. <Link to="/write/letter">Write your first letter</Link>.
        </p>
      )}

      <ul className="post-list">
        {letters.map((letter) => (
          <li key={letter.id} className="post-list-item">
            <h2>
              {letter.status === 'published' ? (
                <Link to={`/letters/${letter.slug}`}>{letter.title}</Link>
              ) : (
                letter.title
              )}
            </h2>
            <p className="post-meta">
              <span className={`status-pill status-pill-${letter.status}`}>
                {letter.status === 'published' ? 'Published' : 'Draft'}
              </span>
              {' '}· <Link to={`/letters/${letter.slug}/edit`}>Edit</Link>
              {' '}· <button
                type="button"
                onClick={() => handleDelete(letter)}
                disabled={deletingId === letter.id}
                className="link-button-inline"
              >
                {deletingId === letter.id ? 'Deleting…' : 'Delete'}
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
      <h1>My letters</h1>
      <p>
        <Link to="/write/letter">Write a new letter</Link>
      </p>

      {content}
    </div>
  );
}
