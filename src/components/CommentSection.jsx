import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CommentSection({ post }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading');

  const [body, setBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadComments();
  }, [post.slug]);

  function loadComments() {
    setStatus('loading');
    apiClient
      .get(`/posts/${post.slug}/comments`)
      .then((res) => {
        setComments(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');

    try {
      const payload = { body };
      if (!user) {
        payload.guest_name = guestName;
        payload.guest_email = guestEmail || undefined;
      }

      const res = await apiClient.post(`/posts/${post.slug}/comments`, payload);
      setFeedback(res.data.message);
      setBody('');
      setGuestName('');
      setGuestEmail('');
      // Not reloading the list here on purpose - the new comment is
      // 'pending' and won't show up until an admin approves it, so
      // reloading would look like nothing happened.
    } catch {
      setFeedback('Something went wrong submitting your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Build a simple two-level tree: top-level comments, each with their replies nested under them
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesFor = (id) => comments.filter((c) => c.parent_id === id);

  return (
    <section className="comments">
      <h2>Comments</h2>

      {status === 'loading' && <p>Loading comments…</p>}
      {status === 'error' && <p>Couldn't load comments.</p>}
      {status === 'ready' && topLevel.length === 0 && <p>No comments yet — be the first.</p>}

      <ul className="comment-list">
        {topLevel.map((comment) => (
          <li key={comment.id} className="comment">
            <p className="comment-meta">
              <strong>{comment.display_name}</strong> ·{' '}
              {new Date(comment.created_at).toLocaleDateString()}
            </p>
            <p className="comment-body">{comment.body}</p>

            {repliesFor(comment.id).length > 0 && (
              <ul className="comment-replies">
                {repliesFor(comment.id).map((reply) => (
                  <li key={reply.id} className="comment">
                    <p className="comment-meta">
                      <strong>{reply.display_name}</strong> ·{' '}
                      {new Date(reply.created_at).toLocaleDateString()}
                    </p>
                    <p className="comment-body">{reply.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="comment-form">
        <h3>Leave a comment</h3>

        {!user && (
          <>
            <label htmlFor="guest_name">Name</label>
            <input
              id="guest_name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />

            <label htmlFor="guest_email">Email (optional, not shown publicly)</label>
            <input
              id="guest_email"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </>
        )}

        <label htmlFor="body">Comment</label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
        />

        {feedback && <p className="comment-feedback">{feedback}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit comment'}
        </button>
      </form>
    </section>
  );
}
