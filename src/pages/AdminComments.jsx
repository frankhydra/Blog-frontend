import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminComments() {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;
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
      await apiClient.post(`/comments/${comment.id}/${action}`);
      // Remove it from the local list immediately - it's no longer pending
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch {
      // If it fails, leave it in the list so the admin can try again
    } finally {
      setActioningId(null);
    }
  }

  if (authLoading) return <p>Loading…</p>;

  if (!user || user.role !== 'admin') {
    return <p>You don't have access to this page.</p>;
  }

  return (
    <div className="admin-comments">
      <h1>Pending comments</h1>

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Couldn't load the moderation queue.</p>}
      {status === 'ready' && comments.length === 0 && <p>Nothing waiting for review.</p>}

      <ul className="moderation-list">
        {comments.map((comment) => (
          <li key={comment.id} className="moderation-item">
            <p className="comment-meta">
              <strong>{comment.display_name}</strong> on{' '}
              <Link to={`/posts/${comment.post.slug}`}>{comment.post.title}</Link>
            </p>
            <p className="comment-body">{comment.body}</p>
            <div className="moderation-actions">
              <button
                onClick={() => act(comment, 'approve')}
                disabled={actioningId === comment.id}
              >
                Approve
              </button>
              <button
                onClick={() => act(comment, 'reject')}
                disabled={actioningId === comment.id}
                className="reject-button"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
