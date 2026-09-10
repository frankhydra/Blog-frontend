import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ICON_INBOX = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12h4.2l1.3 2.5h4.5L15.3 12H20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <rect x="4" y="6" width="16" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

// A personal inbox, not an admin-only page - anyone whose profile can
// receive a "contact this author" message (admins and authors; a
// contributor's public profile isn't reachable in the first place) sees
// their own messages here. This used to be write-only: saved to the
// database and emailed once, with no way to ever read it back through
// the app.
export default function MyContactMessages() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading');

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

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p>You need to log in to see this page.</p>;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_INBOX}</span>
        <div>
          <p className="settings-card-eyebrow">Inbox</p>
          <h1>Contact messages</h1>
          <p className="post-meta">
            Messages sent through your public profile's contact form. Reply
            directly to the sender's email - there's no reply feature here.
          </p>
        </div>
      </section>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your messages.</p>}
      {status === 'ready' && messages.length === 0 && (
        <p className="empty-state">Nothing in your inbox yet.</p>
      )}

      {messages.length > 0 && (
        <div className="queue-list">
          {messages.map((msg) => (
            <article key={msg.id} className="settings-card queue-card">
              <p className="queue-card-meta">
                <strong>{msg.sender_name}</strong>
                {' '}&lt;<a href={`mailto:${msg.sender_email}`}>{msg.sender_email}</a>&gt;
                {' '}· {new Date(msg.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p className="queue-card-body">{msg.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
