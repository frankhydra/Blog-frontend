import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ICON_DASHBOARD = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="3.5" width="7" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="11" width="7" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

// Same three-state logic as MyPosts.jsx (see 2.3).
function statusLabel(post) {
  if (post.status === 'published') return 'Published';
  if (post.submitted_at) return 'Submitted — awaiting review';
  return 'Draft (not submitted)';
}

function statusClass(post) {
  if (post.status === 'published') return 'status-pill status-pill-published';
  if (post.submitted_at) return 'status-pill status-pill-pending';
  return 'status-pill status-pill-draft';
}

// ROLES-AND-DASHBOARD.md §3: "Their own posts, with an honest status ...
// A prompt to write, front and center ... Their portfolio completion."
// Same card-based visual language as AdminDashboard.jsx's Overview tab -
// icon header + settings-card sections - rather than a plain unstyled
// list, so all three role dashboards read as one consistent feature.
export default function ContributorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (authLoading || !user) return;

    setStatus('loading');
    Promise.all([
      apiClient.get('/my/posts'),
      apiClient.get('/portfolio/mine'),
    ])
      .then(([postsRes, portfolioRes]) => {
        setPosts(postsRes.data);
        setPortfolioItems(portfolioRes.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authLoading, user]);

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see your dashboard.</p>;

  const publishedCount = portfolioItems.filter((i) => i.status === 'published').length;
  const likesTotal = portfolioItems.reduce((sum, i) => sum + (i.likes_count ?? 0), 0);

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_DASHBOARD}</span>
        <div>
          <p className="settings-card-eyebrow">Contributor</p>
          <h1>Welcome back, {user.name}</h1>
          <p className="post-meta">Got something to say? Your posts are private until you submit them for review.</p>
        </div>
      </section>

      <div className="settings-card">
        <Link to="/write/post" className="nav-cta">Write a new post</Link>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your dashboard.</p>}

      {status === 'ready' && (
        <>
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Your posts</h2>
            </div>
            {posts.length === 0 ? (
              <p className="empty-state">You haven't written anything yet.</p>
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
                      <span className={statusClass(post)}>{statusLabel(post)}</span>
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
              <h2>Your portfolio</h2>
            </div>
            <div className="portfolio-stats-grid">
              <div className="portfolio-stat-card">
                <span className="portfolio-stat-num">{portfolioItems.length}</span>
                <span className="portfolio-stat-label">Total projects</span>
              </div>
              <div className="portfolio-stat-card">
                <span className="portfolio-stat-num portfolio-stat-num-forest">{publishedCount}</span>
                <span className="portfolio-stat-label">Live published</span>
              </div>
              <div className="portfolio-stat-card">
                <span className="portfolio-stat-num portfolio-stat-num-wax">{likesTotal}</span>
                <span className="portfolio-stat-label">Public applause</span>
              </div>
            </div>
            <p className="post-meta"><Link to="/settings?tab=portfolio">Manage your portfolio</Link></p>
          </div>
        </>
      )}
    </div>
  );
}
