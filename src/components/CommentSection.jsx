import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

// Fields for a guest identifying themselves - shared between the
// top-level comment form and any open reply form, since both follow the
// exact same rule (name required, email optional) for whoever isn't
// logged in.
function GuestFields({ idPrefix, name, onNameChange, email, onEmailChange }) {
  return (
    <>
      <label htmlFor={`${idPrefix}_name`}>Name</label>
      <input
        id={`${idPrefix}_name`}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        required
      />

      <label htmlFor={`${idPrefix}_email`}>Email (optional, not shown publicly)</label>
      <input
        id={`${idPrefix}_email`}
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
      />
    </>
  );
}

// Nesting is capped at 3 levels on purpose (top-level, reply, reply-to-
// reply) - the backend itself doesn't enforce a depth limit (parent_id
// just has to point at an existing comment), so this is a UI decision:
// past level 3, a comment still displays, it just stops offering its own
// Reply button, so a thread can't spiral into arbitrarily deep nesting.
const MAX_REPLY_DEPTH = 3;

function CommentNode({ comment, depth, repliesFor, authorId, replyState, onStartReply, onCancelReply, onSubmitReply, user }) {
  const isReplying = replyState.parentId === comment.id;
  const replies = repliesFor(comment.id);

  return (
    <li className="comment">
      <p className="comment-meta">
        <strong>{comment.display_name}</strong>
        {authorId && comment.user_id === authorId && (
          <span className="comment-author-badge">Author</span>
        )}
        {' '}· {new Date(comment.created_at).toLocaleDateString()}
      </p>
      <p className="comment-body">{comment.body}</p>

      {depth < MAX_REPLY_DEPTH && (
        <button type="button" className="comment-reply-toggle" onClick={() => (isReplying ? onCancelReply() : onStartReply(comment.id))}>
          {isReplying ? 'Cancel' : 'Reply'}
        </button>
      )}

      {isReplying && (
        <form
          onSubmit={(e) => onSubmitReply(e, comment.id)}
          className="comment-form comment-reply-form"
        >
          {!user && (
            <GuestFields
              idPrefix={`reply_${comment.id}`}
              name={replyState.guestName}
              onNameChange={replyState.setGuestName}
              email={replyState.guestEmail}
              onEmailChange={replyState.setGuestEmail}
            />
          )}

          <label htmlFor={`reply_body_${comment.id}`}>Reply to {comment.display_name}</label>
          <textarea
            id={`reply_body_${comment.id}`}
            value={replyState.body}
            onChange={(e) => replyState.setBody(e.target.value)}
            required
            rows={3}
          />

          {replyState.feedback && <p className="comment-feedback">{replyState.feedback}</p>}

          <button type="submit" disabled={replyState.submitting}>
            {replyState.submitting ? 'Submitting…' : 'Submit reply'}
          </button>
        </form>
      )}

      {replies.length > 0 && (
        <ul className="comment-replies">
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              repliesFor={repliesFor}
              authorId={authorId}
              replyState={replyState}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              user={user}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Q6 - was post-only (props: { post }, hardcoded /posts/{slug}/comments).
// Comments now work on letters and books too, so this takes contentType
// ('posts'|'letters'|'books') plus the content object instead.
export default function CommentSection({ contentType, content }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading');

  const [body, setBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Reply state is shared across every open reply form via CommentNode,
  // but only one can be open at a time (parentId tracks which) - keeps
  // this simple rather than tracking a body/guestName/etc. per comment.
  const [replyParentId, setReplyParentId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyGuestName, setReplyGuestName] = useState('');
  const [replyGuestEmail, setReplyGuestEmail] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState('');

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, content.slug]);

  function loadComments() {
    setStatus('loading');
    apiClient
      .get(`/${contentType}/${content.slug}/comments`)
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

      const res = await apiClient.post(`/${contentType}/${content.slug}/comments`, payload);
      setFeedback(res.data.message);
      setBody('');
      setGuestName('');
      setGuestEmail('');
      // Not reloading the list here on purpose - the new comment is
      // 'pending' and won't show up until an admin approves it, so
      // reloading would look like nothing happened. (An owner's own
      // comment auto-approves server-side, but keeping this simple and
      // consistent rather than branching on who's posting.)
    } catch {
      setFeedback('Something went wrong submitting your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function startReply(commentId) {
    setReplyParentId(commentId);
    setReplyBody('');
    setReplyGuestName('');
    setReplyGuestEmail('');
    setReplyFeedback('');
  }

  function cancelReply() {
    setReplyParentId(null);
  }

  async function submitReply(e, parentId) {
    e.preventDefault();
    setReplySubmitting(true);
    setReplyFeedback('');

    try {
      const payload = { body: replyBody, parent_id: parentId };
      if (!user) {
        payload.guest_name = replyGuestName;
        payload.guest_email = replyGuestEmail || undefined;
      }

      const res = await apiClient.post(`/${contentType}/${content.slug}/comments`, payload);
      setReplyFeedback(res.data.message);
      setReplyBody('');
      // Same as the top-level form - a reply starts 'pending' too, so the
      // thread doesn't reload/close on submit; the feedback message is
      // the only confirmation until an admin approves it.
    } catch {
      setReplyFeedback('Something went wrong submitting your reply. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesFor = (id) => comments.filter((c) => c.parent_id === id);
  const authorId = content.author?.id ?? content.owner?.id ?? null;

  const replyState = {
    parentId: replyParentId,
    body: replyBody,
    setBody: setReplyBody,
    guestName: replyGuestName,
    setGuestName: setReplyGuestName,
    guestEmail: replyGuestEmail,
    setGuestEmail: setReplyGuestEmail,
    submitting: replySubmitting,
    feedback: replyFeedback,
  };

  return (
    <section className="comments">
      <h2>Comments</h2>

      {status === 'loading' && <p>Loading comments…</p>}
      {status === 'error' && <p>Couldn't load comments.</p>}
      {status === 'ready' && topLevel.length === 0 && <p>No comments yet — be the first.</p>}

      <ul className="comment-list">
        {topLevel.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            depth={1}
            repliesFor={repliesFor}
            authorId={authorId}
            replyState={replyState}
            onStartReply={startReply}
            onCancelReply={cancelReply}
            onSubmitReply={submitReply}
            user={user}
          />
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="comment-form">
        <h3>Leave a comment</h3>

        {!user && (
          <GuestFields
            idPrefix="comment"
            name={guestName}
            onNameChange={setGuestName}
            email={guestEmail}
            onEmailChange={setGuestEmail}
          />
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
