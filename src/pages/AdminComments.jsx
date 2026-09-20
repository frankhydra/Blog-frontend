import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ICON_COMMENT = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.2 3.4a.5.5 0 0 1-.8-.4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

// Phase 3 (Issues Log 5.4) - this used to be an admin-only page. It's now
// self-service moderation: CommentController::moderationQueue() scopes
// itself to comments on the requesting user's OWN posts, so this
// component works identically for admin, author, and contributor alike -
// each just sees comments on what they personally wrote. No role check
// needed here anymore; a reader with no posts simply gets an empty queue.
// Still embeddable (AdminDashboard.jsx's "Moderate comments" tab, and now
// also ContributorDashboard.jsx/AuthorDashboard.jsx's).
export default function AdminComments({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    loadQueue();
  }, [authLoading, user]);

  function loadQueue() {
    setStatus('loading');
    apiClient
      .get('/admin/comments', { params: { status: 'pending' } })
      .then((res) => {
        setComments(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function act(comment, action) {
    setActioningId(comment.id);
    try {
      if (action === 'delete') {
        if (!confirm('Delete this comment? This can\'t be undone.')) {
          setActioningId(null);
          return;
        }
        await apiClient.delete(`/comments/${comment.id}`);
      } else {
        await apiClient.post(`/comments/${comment.id}/${action}`);
      }
      // Remove it from the local list immediately - it's no longer pending
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch {
      // If it fails, leave it in the list so they can try again
    } finally {
      setActioningId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see this.</p>;

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load the moderation queue.</p>}
      {status === 'ready' && comments.length === 0 && (
        <p className="empty-state">Nothing waiting for review.</p>
      )}

      {comments.length > 0 && (
        <div className="queue-list">
          {comments.map((comment) => (
            <article key={comment.id} className="settings-card queue-card">
              <p className="queue-card-meta">
                <strong>{comment.display_name}</strong> on{' '}
                <Link to={`/posts/${comment.post.slug}`}>{comment.post.title}</Link>
              </p>
              <p className="queue-card-body">{comment.body}</p>
              <div className="queue-card-actions">
                <button
                  onClick={() => act(comment, 'approve')}
                  disabled={actioningId === comment.id}
                  className="queue-approve-button"
                >
                  Approve
                </button>
                <button
                  onClick={() => act(comment, 'reject')}
                  disabled={actioningId === comment.id}
                  className="queue-reject-button"
                >
                  Reject
                </button>
                <button
                  onClick={() => act(comment, 'delete')}
                  disabled={actioningId === comment.id}
                  className="queue-secondary-button"
                >
                  Delete
                </button>
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
        <span className="settings-card-icon admin-page-icon">{ICON_COMMENT}</span>
        <div>
          <p className="settings-card-eyebrow">Moderation queue</p>
          <h1>Comments on your posts</h1>
          <p className="post-meta">
            Approved comments appear publicly under their post right away.
            Rejecting one is final - the commenter can always post again.
          </p>
        </div>
      </section>

      {content}
    </div>
  );
}
