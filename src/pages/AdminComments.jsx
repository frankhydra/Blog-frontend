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

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'all', label: 'All' },
];

function snippet(body, max = 60) {
  if (!body) return '';
  return body.length > max ? `${body.slice(0, max).trim()}…` : body;
}

// Phase 3 (Issues Log 5.4) - self-service moderation: CommentController::
// moderationQueue() scopes to comments on the requesting user's OWN posts,
// so this works identically for admin/author/contributor. Grew past the
// original pending-only queue once real use surfaced the actual gap: an
// approved comment was only ever repliable from the live post page, so a
// blog owner could easily miss one. Now the filter has three states
// (Pending/Approved/All) and every comment - not just pending ones - gets
// a Reply action right here. A reply from this view is always posted by
// the post's owner (or admin), which CommentController::store() now
// auto-approves, so it shows up immediately instead of landing back in
// this same queue waiting on its own author to approve it.
export default function AdminComments({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [status, setStatus] = useState('loading');
  const [actioningId, setActioningId] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    loadQueue();
  }, [authLoading, user, filter]);

  function loadQueue() {
    setStatus('loading');
    apiClient
      .get('/admin/comments', { params: { status: filter } })
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
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch {
      // If it fails, leave it in the list so they can try again
    } finally {
      setActioningId(null);
    }
  }

  function startReply(comment) {
    setReplyingId(comment.id);
    setReplyBody('');
    setReplyError(null);
  }

  async function submitReply(comment) {
    if (!replyBody.trim()) return;
    setActioningId(comment.id);
    setReplyError(null);
    try {
      await apiClient.post(`/posts/${comment.post.slug}/comments`, {
        body: replyBody.trim(),
        parent_id: comment.id,
      });
      setReplyingId(null);
      setReplyBody('');
      // The reply auto-approves (it's posted by the post's owner/admin),
      // so a re-fetch is the simplest way to reflect it - whether it
      // belongs in the current filter or not.
      loadQueue();
    } catch {
      setReplyError("Couldn't post that reply - try again.");
    } finally {
      setActioningId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see this.</p>;

  const content = (
    <>
      <div className="queue-filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`queue-filter-tab ${filter === f.id ? 'queue-filter-tab-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load comments.</p>}
      {status === 'ready' && comments.length === 0 && (
        <p className="empty-state">
          {filter === 'pending' ? 'Nothing waiting for review.' : 'Nothing here yet.'}
        </p>
      )}

      {comments.length > 0 && (
        <div className="queue-list">
          {comments.map((comment) => (
            <article key={comment.id} className="settings-card queue-card">
              <p className="queue-card-meta">
                <strong>{comment.display_name}</strong> on{' '}
                <Link to={`/posts/${comment.post.slug}`}>{comment.post.title}</Link>
                {' '}
                <span className={`status-pill status-pill-${comment.status}`}>{comment.status}</span>
              </p>
              {comment.parent && (
                <p className="queue-card-reply-context">
                  ↳ Replying to <strong>{comment.parent.display_name}</strong>: "{snippet(comment.parent.body)}"
                </p>
              )}
              <p className="queue-card-body">{comment.body}</p>
              <div className="queue-card-actions">
                {comment.status === 'pending' && (
                  <>
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
                  </>
                )}
                <button
                  onClick={() => startReply(comment)}
                  disabled={actioningId === comment.id}
                  className="queue-secondary-button"
                >
                  Reply
                </button>
                <button
                  onClick={() => act(comment, 'delete')}
                  disabled={actioningId === comment.id}
                  className="queue-secondary-button"
                >
                  Delete
                </button>
              </div>

              {replyingId === comment.id && (
                <div className="queue-reply-form">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write your reply…"
                    rows={3}
                  />
                  {replyError && <p className="form-error">{replyError}</p>}
                  <div className="queue-card-actions">
                    <button
                      type="button"
                      onClick={() => submitReply(comment)}
                      disabled={actioningId === comment.id || !replyBody.trim()}
                      className="queue-approve-button"
                    >
                      Send reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingId(null)}
                      className="queue-secondary-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
            Reply to any comment directly from here - your reply posts immediately.
          </p>
        </div>
      </section>

      {content}
    </div>
  );
}
