import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ICON_REVIEW = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 4.5h9l5 5V19.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M14 4.5V9h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M8 13.5l2.2 2.2L16 10.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The queue this app was missing entirely (see ROLES-AND-DASHBOARD.md §1):
// a contributor's post always saves as draft pending review, but there was
// no page for an admin to ever find it. Wired to GET /admin/posts, which
// defaults to exactly that set (status=draft, role=contributor).
//
// There's no "rejected" status on posts the way there is on comments/
// campaigns - only draft/published - so "reject" here means what it
// practically means for a piece of writing: send the admin to actually
// read and edit it before deciding, rather than accept/deny a short blurb
// inline. Approve publishes immediately from the queue for the common
// case (the post's fine as-is); the edit link covers everything else,
// including quietly deleting it from there if it doesn't belong on the
// site at all.
export default function AdminPosts({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;
    loadQueue();
  }, [authLoading, user]);

  function loadQueue() {
    setStatus('loading');
    setError('');
    apiClient
      .get('/admin/posts', { params: { status: 'draft', role: 'contributor' } })
      .then((res) => {
        setPosts(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function handlePublish(post) {
    setActioningId(post.id);
    setError('');
    try {
      await apiClient.put(`/posts/${post.slug}`, { status: 'published' });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish that post.');
    } finally {
      setActioningId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') {
    return <p className="empty-state">You don't have access to this page.</p>;
  }

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load the review queue.</p>}
      {error && <p className="form-error">{error}</p>}
      {status === 'ready' && posts.length === 0 && (
        <p className="empty-state">Nothing waiting for review.</p>
      )}

      {posts.length > 0 && (
        <div className="queue-list">
          {posts.map((post) => (
            <article key={post.id} className="settings-card queue-card">
              <div className="queue-card-layout">
                {post.cover_image && (
                  <img src={post.cover_image} alt="" loading="lazy" className="queue-card-image" />
                )}
                <div className="queue-card-main">
                  <p className="queue-card-meta">
                    <strong>{post.title}</strong> by {post.author?.name}
                    {post.category && <> · {post.category.name}</>}
                    {' '}· submitted {new Date(post.submitted_at).toLocaleDateString()}
                  </p>
                  {post.excerpt && <p className="queue-card-body">{post.excerpt}</p>}

                  <div className="queue-card-actions">
                    <Link to={`/posts/${post.slug}/edit`} className="queue-secondary-button">
                      Read &amp; edit
                    </Link>
                    <button
                      onClick={() => handlePublish(post)}
                      disabled={actioningId === post.id}
                      className="queue-approve-button"
                    >
                      {actioningId === post.id ? 'Publishing…' : 'Publish as-is'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_REVIEW}</span>
        <div>
          <p className="settings-card-eyebrow">Review queue</p>
          <h1>Posts awaiting review</h1>
          <p className="post-meta">
            A contributor's post saves as a draft and stays invisible to
            everyone but them until you publish it here. Read the full post
            before deciding - the title and excerpt alone aren't enough to
            judge it on.
          </p>
        </div>
      </section>

      {content}
    </div>
  );
}
