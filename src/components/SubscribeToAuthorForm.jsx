import { useState } from 'react';
import apiClient from '../api/client';

// "Subscribe to [Author]" - a smaller, single-field commitment than the
// platform-wide /join list, tied to one specific person's own list.
// Available on any public profile regardless of role (author, contributor,
// or admin) - not gated, since a contributor can already have a public
// profile and publish books immediately. See EMAIL-LIST-STRATEGY.md
// Section 4 for the reasoning, and SubscriberController::subscribeToAuthor
// for the backend side this posts to.
export default function SubscribeToAuthorForm({ authorId, authorName }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await apiClient.post(`/authors/${authorId}/subscribe`, { email });
      setResult(res.data);
      setStatus('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong - try again in a moment.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="subscribe-author subscribe-author-done">
        <p className="subscribe-author-message">{result.message}</p>
        <p className="subscribe-author-unsubscribe">
          <a href={result.unsubscribe_url}>Unsubscribe anytime</a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="subscribe-author">
      <div className="subscribe-author-text">
        <p className="subscribe-author-title">Subscribe to {authorName}</p>
        <p className="subscribe-author-sub">Get their new posts, letters, and books by email.</p>
      </div>
      <div className="subscribe-author-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          maxLength={255}
          aria-label={`Email address to subscribe to ${authorName}`}
        />
        <button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Subscribing…' : 'Follow their list'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <p className="subscribe-author-trust">No spam. Unsubscribe anytime with one click.</p>
    </form>
  );
}
