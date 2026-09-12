import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const CAMPAIGN_STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

const ICON_DASHBOARD = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="3.5" width="7" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="11" width="7" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

// ROLES-AND-DASHBOARD.md §3: "Everything a Contributor sees, plus their
// letters (same status treatment), their campaign request status, and a
// quick-write shortcut for both content types." Same card-based visual
// language as AdminDashboard.jsx's Overview tab (icon header + settings-
// card sections), rather than plain unstyled lists - the three dashboards
// are meant to read as one consistent feature, not three different eras
// of the app.
export default function AuthorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [letters, setLetters] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (authLoading || !user) return;

    setStatus('loading');
    Promise.all([
      apiClient.get('/my/posts'),
      apiClient.get('/my/letters'),
      apiClient.get('/my/campaigns'),
    ])
      .then(([postsRes, lettersRes, campaignsRes]) => {
        setPosts(postsRes.data);
        setLetters(lettersRes.data);
        setCampaigns(campaignsRes.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authLoading, user]);

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see your dashboard.</p>;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_DASHBOARD}</span>
        <div>
          <p className="settings-card-eyebrow">Author</p>
          <h1>Welcome back, {user.name}</h1>
          <p className="post-meta">
            <Link to="/write/post">Write a new post</Link>
            {' '}· <Link to="/write/letter">Write a new letter</Link>
            {' '}· <Link to="/request-campaign">Request a campaign</Link>
          </p>
        </div>
      </section>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your dashboard.</p>}

      {status === 'ready' && (
        <>
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Your posts</h2>
            </div>
            {posts.length === 0 ? (
              <p className="empty-state">
                You haven't written a post yet. <Link to="/write/post">Write your first one</Link>.
              </p>
            ) : (
              <ul className="post-list">
                {posts.slice(0, 5).map((post) => (
                  <li key={post.id} className="post-list-item">
                    <h2>
                      {post.status === 'published' ? (
                        <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                      ) : (
                        post.title
                      )}
                    </h2>
                    <p className="post-meta">
                      <span className={`status-pill status-pill-${post.status}`}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      {' '}· <Link to={`/posts/${post.slug}/edit`}>Edit</Link>
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {posts.length > 5 && <p className="post-meta"><Link to="/my-posts">See all {posts.length} posts</Link></p>}
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Your letters</h2>
            </div>
            {letters.length === 0 ? (
              <p className="empty-state">
                You haven't written a letter yet. <Link to="/write/letter">Write your first one</Link>.
              </p>
            ) : (
              <ul className="post-list">
                {letters.slice(0, 5).map((letter) => (
                  <li key={letter.id} className="post-list-item">
                    <h2>
                      {letter.status === 'published' ? (
                        <Link to={`/letters/${letter.slug}`}>{letter.title}</Link>
                      ) : (
                        letter.title
                      )}
                    </h2>
                    <p className="post-meta">
                      <span className={`status-pill status-pill-${letter.status}`}>
                        {letter.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      {' '}· <Link to={`/letters/${letter.slug}/edit`}>Edit</Link>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Your campaign requests</h2>
            </div>
            {campaigns.length === 0 ? (
              <p className="empty-state">
                No requests yet. <Link to="/request-campaign">Request a spotlight</Link>.
              </p>
            ) : (
              <ul className="moderation-list">
                {campaigns.slice(0, 5).map((c) => (
                  <li key={c.id} className="moderation-item">
                    <strong>{c.title}</strong>{' '}
                    <span className={`status-pill status-pill-${c.status}`}>
                      {CAMPAIGN_STATUS_LABEL[c.status]}
                    </span>
                    {c.status === 'rejected' && c.admin_note && (
                      <p className="post-meta">Admin note: {c.admin_note}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
