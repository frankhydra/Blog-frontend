import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

// Landing page for the "Write" nav action. Admins get a choice between a
// blog post and a letter; everyone else only has posts, so we skip the
// choice screen entirely and send them straight to the post editor.
export default function Write() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  usePageMeta('Write', 'Start a new blog post or letter.');

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/write/post" replace />;

  return (
    <div className="write-choice">
      <h1>What are you writing today?</h1>
      <p className="write-choice-sub">Pick a form and we'll take you straight there.</p>

      <div className="write-choice-grid">
        <button
          type="button"
          className="write-choice-card"
          onClick={() => navigate('/write/post')}
        >
          <span className="write-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 38 L34 14 L38 18 L14 42 L8 44 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M30 10 L38 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 44 L8 44 L10 38 L10 42 Z" fill="currentColor" />
            </svg>
          </span>
          <span className="write-choice-title">Blog Post</span>
          <span className="write-choice-desc">
            A public post on your blog — for essays, updates, and everything
            readers browse in Community Blogs.
          </span>
          <span className="write-choice-cta">Start writing →</span>
        </button>

        <button
          type="button"
          className="write-choice-card write-choice-card-letter"
          onClick={() => navigate('/write/letter')}
        >
          <span className="write-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="12" width="36" height="26" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M6 14 L24 28 L42 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="24" cy="30" r="6" fill="currentColor" />
              <path d="M21.5 30 L23 31.5 L26.5 28" stroke="var(--card)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="write-choice-title">Letter</span>
          <span className="write-choice-desc">
            A signed, sealed letter for the Letters page — the more personal,
            long-form correspondence with readers.
          </span>
          <span className="write-choice-cta">Start writing →</span>
        </button>
      </div>
    </div>
  );
}
