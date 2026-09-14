import { useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import useHideFooter from '../hooks/useHideFooter';
import useHideHeader from '../hooks/useHideHeader';
import WelcomeEmblem from '../components/WelcomeEmblem';

// Three simple, tasteful motifs (a nib pen, a wax seal, an open envelope)
// rather than anything mystical - subtle background texture for the gate,
// not the main event. Pure inline SVG so no extra icon library is needed.
const MOTIF_PEN = (
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 20l7-14-3-3L5 15l-2 6 6-2Z" />
    <path d="M9.5 8.5l3 3" />
  </svg>
);
const MOTIF_SEAL = (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7v10M7 12h10" />
  </svg>
);
const MOTIF_ENVELOPE = (
  <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M3.5 6.5 12 13l8.5-6.5" />
  </svg>
);

// The platform-wide mailing list landing page. Built around the same
// persuasive structure as the reference design this was requested from
// (bold hook, one promise, two fields, one obvious button) but in the
// site's own postmark palette rather than that reference's dark/neon
// look - see EMAIL-LIST-STRATEGY.md Section 3 for why.
//
// Also reused as the first-visit gate at "/" (see HomeGate.jsx) - asGate
// swaps in slightly more "you found this" framing for that context and
// adds a way to continue without subscribing (onSkip, rendered as
// .join-skip-link below), and onContinue lets the gate move straight to
// the home page on success instead of showing the standalone page's
// inline success card.
export default function Join({ asGate = false, onContinue = null, onSkip = null }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const parallaxRef = useRef(null);

  usePageMeta('Join the list', 'Get new posts, letters, and books the moment they publish.');

  // Only while acting as the first-visit gate (see HomeGate.jsx) - the
  // standalone /join page reached from the footer keeps the normal site
  // chrome, same as every other page. Hiding the header too (not just
  // the footer) matters here specifically: leaving the nav visible would
  // let a visitor just click "Letters" or "Books" and leave without ever
  // subscribing, which defeats the point of this being a real gate
  // rather than a dismissible banner.
  useHideFooter(asGate);
  useHideHeader(asGate);

  // Direct DOM manipulation via a ref, not React state - a mousemove
  // handler firing dozens of times a second would otherwise mean dozens
  // of re-renders a second for a purely decorative effect. Only wired up
  // in gate mode, since the plain /join page doesn't get this treatment.
  useEffect(() => {
    if (!asGate) return;
    function handleMouseMove(e) {
      if (!parallaxRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * -12;
      parallaxRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [asGate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await apiClient.post('/subscribe', { name, email });
      if (onContinue) {
        onContinue();
        return;
      }
      setResult(res.data);
      setStatus('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong - try again in a moment.');
      setStatus('error');
    }
  }

  return (
    <div className="join-page">
      {asGate && (
        <div className="gate-parallax-layer" ref={parallaxRef} aria-hidden="true">
          <span className="gate-float-motif" style={{ top: '8%', left: '6%' }}>{MOTIF_PEN}</span>
          <span className="gate-float-motif gate-float-motif-2" style={{ top: '14%', right: '8%' }}>{MOTIF_SEAL}</span>
          <span className="gate-float-motif gate-float-motif-3" style={{ bottom: '10%', left: '14%' }}>{MOTIF_ENVELOPE}</span>
        </div>
      )}

      <section className={`hero join-hero ${asGate ? 'gate-fade-up' : ''}`}>
        {asGate && <WelcomeEmblem />}
        <p className="kicker">{asGate ? 'Welcome' : 'The mailing list'}</p>
        <h1>
          {asGate
            ? "Most people never find pages like this one. You just did."
            : "Most readers just scroll past. You're still here."}
        </h1>
        <p className="hero-sub">
          Join the list and get new posts, letters, and books the moment
          they're published - not whenever an algorithm decides to show you.
        </p>
      </section>

      <section className={`join-form-card ${asGate ? 'gate-fade-up gate-fade-up-delay' : ''}`}>
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
              {status === 'submitting' ? 'Joining…' : asGate ? 'Find your way in' : 'Join the list'}
              <span aria-hidden="true">&rarr;</span>
            </button>
            {error && <p className="form-error">{error}</p>}
            <p className="join-trust-line">No spam. No tracking. Unsubscribe anytime.</p>
            {asGate && onSkip && (
              <button type="button" className="join-skip-link" onClick={onSkip}>
                Not right now - take me to the site
              </button>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
