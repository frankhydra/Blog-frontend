import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

// The status distinction this page was missing (UI-UX-FLAWS-AND-FIXES.md
// §5.2 / ROLES-AND-DASHBOARD.md §3): a contributor's "draft" used to mean
// three different, unlabeled things - still private, waiting on review,
// or already reviewed and left alone. Now that posts carry a real
// submitted_at (see PostController), draft splits into two honest states.
function statusLabel(post) {
  if (post.status === 'published') return 'Published';
  if (post.submitted_at) return 'Submitted — awaiting review';
  return 'Draft (not submitted)';
}

function statusClass(post) {
  if (post.status === 'published') return 'status-pill status-pill-published';
  if (post.submitted_at) return 'status-pill status-pill-pending';
  return 'status-pill status-pill-draft';
}

export default function MyPosts() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user]);

  function load() {
    apiClient
      .get('/my/posts')
      .then((res) => {
        setPosts(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function handleDelete(post) {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setDeletingId(post.id);
    try {
      await apiClient.delete(`/posts/${post.slug}`);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      alert("Couldn't delete that post.");
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see your posts.</p>;

  return (
    <div>
      <h1>My posts</h1>
      <p>
        <Link to="/write/post">Write a new post</Link>
      </p>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your posts.</p>}
      {status === 'ready' && posts.length === 0 && (
        <p className="empty-state">
          You haven't written anything yet. <Link to="/write/post">Write your first post</Link>.
        </p>
      )}

      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id} className="post-list-item">
            <h2>
              {post.status === 'published' ? (
                <Link to={`/posts/${post.slug}`}>{post.title}</Link>
              ) : (
                post.title
              )}
            </h2>
            <p className="post-meta">
              <span className={statusClass(post)}>{statusLabel(post)}</span>
              {post.status !== 'published' && post.submitted_at && (
                <> · submitted {new Date(post.submitted_at).toLocaleDateString()}</>
              )}
              {' '}· <Link to={`/posts/${post.slug}/edit`}>Edit</Link>
              {' '}· <button
                type="button"
                onClick={() => handleDelete(post)}
                disabled={deletingId === post.id}
                className="link-button-inline"
              >
                {deletingId === post.id ? 'Deleting…' : 'Delete'}
              </button>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
