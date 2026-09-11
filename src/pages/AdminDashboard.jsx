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

// The piece ROLES-AND-DASHBOARD.md §3 called out as most valuable on its
// own: before this, a pending contributor post, comment, or campaign
// request only ever surfaced if an admin happened to remember to check
// that specific queue page. This puts all three in one place, first thing
// an admin sees, each linking straight into its queue.
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;

    setStatus('loading');
    Promise.all([
      apiClient.get('/admin/dashboard-summary'),
      apiClient.get('/my/posts'),
    ])
      .then(([summaryRes, postsRes]) => {
        setSummary(summaryRes.data);
        setMyPosts(postsRes.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authLoading, user]);

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') {
    return <p className="empty-state">You don't have access to this page.</p>;
  }

  const totalPending = summary
    ? summary.pending_comments + summary.pending_campaigns + summary.pending_posts
    : 0;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_DASHBOARD}</span>
        <div>
          <p className="settings-card-eyebrow">Admin</p>
          <h1>Dashboard</h1>
          <p className="post-meta">Welcome back, {user.name}.</p>
        </div>
      </section>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load the dashboard.</p>}

      {status === 'ready' && (
        <>
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>
                {totalPending === 0
                  ? 'Nothing waiting for you'
                  : `${totalPending} thing${totalPending === 1 ? '' : 's'} waiting for review`}
              </h2>
            </div>

            <div className="dashboard-summary-grid">
              <Link to="/admin/posts" className="dashboard-summary-tile">
                <span className="dashboard-summary-count">{summary.pending_posts}</span>
                <span>Post{summary.pending_posts === 1 ? '' : 's'} awaiting review</span>
              </Link>
              <Link to="/admin/comments" className="dashboard-summary-tile">
                <span className="dashboard-summary-count">{summary.pending_comments}</span>
                <span>Comment{summary.pending_comments === 1 ? '' : 's'} pending</span>
              </Link>
              <Link to="/admin/campaigns" className="dashboard-summary-tile">
                <span className="dashboard-summary-count">{summary.pending_campaigns}</span>
                <span>Campaign{summary.pending_campaigns === 1 ? '' : 's'} pending</span>
              </Link>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Your posts</h2>
            </div>
            <p className="post-meta">
              <Link to="/write/post">Write a new post</Link>
              {' '}· <Link to="/my-posts">See all your posts</Link>
            </p>
            {myPosts.length === 0 ? (
              <p className="empty-state">You haven't written anything yet.</p>
            ) : (
              <ul className="post-list">
                {myPosts.slice(0, 5).map((post) => (
                  <li key={post.id} className="post-list-item">
                    <h2>
                      {post.status === 'published' ? (
                        <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                      ) : (
                        post.title
                      )}
                    </h2>
                    <p className="post-meta">
                      <span className={post.status === 'published' ? 'status-pill status-pill-published' : 'status-pill status-pill-draft'}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      {' '}· <Link to={`/posts/${post.slug}/edit`}>Edit</Link>
                    </p>
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
