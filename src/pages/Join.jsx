import { useState } from 'react';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';

// The platform-wide mailing list landing page. Built around the same
// persuasive structure as the reference design this was requested from
// (bold hook, one promise, two fields, one obvious button) but in the
// site's own postmark palette rather than that reference's dark/neon
// look - see EMAIL-LIST-STRATEGY.md Section 3 for why.
export default function Join() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  usePageMeta('Join the list', 'Get new posts, letters, and books the moment they publish.');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await apiClient.post('/subscribe', { name, email });
      setResult(res.data);
      setStatus('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong - try again in a moment.');
      setStatus('error');
    }
  }

  return (
    <div className="join-page">
      <section className="hero join-hero">
        <p className="kicker">The mailing list</p>
        <h1>Most readers just scroll past. You're still here.</h1>
        <p className="hero-sub">
          Join the list and get new posts, letters, and books the moment
          they're published - not whenever an algorithm decides to show you.
        </p>
      </section>

      <section className="join-form-card">
        {status === 'done' ? (
          <div className="join-success">
            <p className="join-success-title">{result.message}</p>
            <p className="post-meta">
              Bookmark this link if you ever want to unsubscribe - it works
              anytime, no questions asked:
            </p>
            <p className="join-unsubscribe-url">
              <a href={result.unsubscribe_url}>{result.unsubscribe_url}</a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="join-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              maxLength={255}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              maxLength={255}
            />
            <button type="submit" className="join-submit-button" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Joining…' : 'Join the list'}
              <span aria-hidden="true">&rarr;</span>
            </button>
            {error && <p className="form-error">{error}</p>}
            <p className="join-trust-line">No spam. Unsubscribe anytime with one click.</p>
          </form>
        )}
      </section>
    </div>
  );
}
