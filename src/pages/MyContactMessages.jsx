import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ICON_INBOX = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12h4.2l1.3 2.5h4.5L15.3 12H20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <rect x="4" y="6" width="16" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

// A stand-in for actually emailing the sender: real outbound mail isn't
// wired up yet (MAIL_MAILER=log, same on-hold state as the newsletter
// system in EMAIL-LIST-STRATEGY.md), so a reply typed on the site stays
// on the site for now - displayed here, not delivered. This opens the
// reader's own email client instead, as a manual stand-in they can use
// today if they want the sender to actually see it before real send-side
// email exists to do that automatically.
function buildMailtoHref(msg) {
  const subject = msg.post ? `Re: your message about "${msg.post.title}"` : 'Re: your message via Nchukwi';
  const sentAt = new Date(msg.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const body = `\n\n---\nOn ${sentAt}, ${msg.sender_name} wrote:\n${msg.message}`;
  return `mailto:${msg.sender_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// A personal inbox, not an admin-only page - anyone whose profile can
// receive a "contact this author" message (admin, author, or
// contributor - every role's profile is publicly reachable, see
// AuthorController::show) sees their own messages here.
export default function MyContactMessages({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading');

  const [replyingId, setReplyingId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    setStatus('loading');
    apiClient
      .get('/my/contact-messages')
      .then((res) => {
        setMessages(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authLoading, user]);

  function startReply(id) {
    setReplyingId(id);
    setReplyBody('');
    setReplyError('');
  }

  function cancelReply() {
    setReplyingId(null);
  }

  async function submitReply(e, messageId) {
    e.preventDefault();
    setReplySubmitting(true);
    setReplyError('');

    try {
      const res = await apiClient.post(`/contact-messages/${messageId}/reply`, { body: replyBody });
      // Displayed on the browser the moment it's sent, per the brief -
      // appended straight into local state instead of a full reload, so
      // it shows up immediately without refetching the whole inbox.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, replies: [...m.replies, res.data] } : m
        )
      );
      setReplyingId(null);
      setReplyBody('');
    } catch {
      setReplyError('Something went wrong sending that reply. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p>You need to log in to see this page.</p>;

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your messages.</p>}
      {status === 'ready' && messages.length === 0 && (
        <p className="empty-state">Nothing in your inbox yet.</p>
      )}

      {messages.length > 0 && (
        <div className="queue-list">
          {messages.map((msg) => (
            <article key={msg.id} className={`settings-card queue-card ${msg.is_new ? 'queue-card-new' : ''}`}>
              <p className="queue-card-meta">
                {msg.is_new && <span className="status-pill status-pill-pending">New</span>}
                {' '}<strong>{msg.sender_name}</strong>
                {' '}&lt;{msg.sender_email}&gt;
                {' '}· {new Date(msg.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              {msg.post && (
                <p className="post-meta">
                  Re: <Link to={`/posts/${msg.post.slug}`}>{msg.post.title}</Link>
                </p>
              )}
              <p className="queue-card-body">{msg.message}</p>

              {msg.replies.length > 0 && (
                <ul className="comment-replies">
                  {msg.replies.map((reply) => (
                    <li key={reply.id} className="comment">
                      <p className="comment-meta">
                        <strong>You replied</strong>
                        {' '}· {new Date(reply.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      <p className="comment-body">{reply.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              {replyingId === msg.id ? (
                <form onSubmit={(e) => submitReply(e, msg.id)} className="comment-form comment-reply-form">
                  <label htmlFor={`reply_${msg.id}`}>Your reply</label>
                  <textarea
                    id={`reply_${msg.id}`}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    required
                    rows={3}
                  />
                  {replyError && <p className="comment-feedback">{replyError}</p>}
                  <div className="moderation-actions">
                    <button type="submit" disabled={replySubmitting}>
                      {replySubmitting ? 'Sending…' : 'Send reply'}
                    </button>
                    <button type="button" onClick={cancelReply} className="queue-secondary-button">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="moderation-actions">
                  <button type="button" onClick={() => startReply(msg.id)}>Reply</button>
                  <a href={buildMailtoHref(msg)} className="queue-secondary-button">Email them directly</a>
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
        <span className="settings-card-icon admin-page-icon">{ICON_INBOX}</span>
        <div>
          <p className="settings-card-eyebrow">Inbox</p>
          <h1>Contact messages</h1>
          <p className="post-meta">
            Messages sent through your public profile's contact form.
            Replies show here on the site - the sender isn't emailed yet,
            since that's not wired up on the platform's side. Use "Email
            them directly" if you want them to see it sooner.
          </p>
        </div>
      </section>

      {content}
    </div>
  );
}
