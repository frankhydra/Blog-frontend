import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import MyPosts from './MyPosts';
import MyBooks from './MyBooks';
import RequestCampaign from './RequestCampaign';
import MySubscribers from './MySubscribers';
import MyContactMessages from './MyContactMessages';
import AdminComments from './AdminComments';

// Icons reused verbatim from AdminDashboard.jsx's tab set where the same
// concept applies (Overview/Posts/Campaigns/Subscribers), so a
// contributor's dashboard and admin's read as the same visual family
// rather than a different icon language per role. ICON_BOOKS and
// ICON_MESSAGES are new - AdminDashboard has no equivalent for either.
const ICON_OVERVIEW = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="3.5" width="7" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="11" width="7" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const ICON_POSTS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 4.5h9l5 5V19.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8 13.5l2.2 2.2L16 10.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICON_BOOKS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5.5c2.2-1 5-1 8 .5V19c-3-1.5-5.8-1.5-8-.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M20 5.5c-2.2-1-5-1-8 .5V19c3-1.5 5.8-1.5 8-.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);
const ICON_CAMPAIGNS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M5.6 5.6l2.3 2.3M16.1 16.1l2.3 2.3M18.4 5.6l-2.3 2.3M7.9 16.1l-2.3 2.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const ICON_COMMENTS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.2 3.4a.5.5 0 0 1-.8-.4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
const ICON_SUBSCRIBERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6.5h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICON_MESSAGES = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12h4.2l1.3 2.5h4.5L15.3 12H20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <rect x="4" y="6" width="16" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

const TABS = [
  { id: 'overview', label: 'Overview', icon: ICON_OVERVIEW },
  { id: 'posts', label: 'My posts', icon: ICON_POSTS },
  { id: 'books', label: 'My books', icon: ICON_BOOKS },
  { id: 'campaigns', label: 'Spotlight requests', icon: ICON_CAMPAIGNS },
  { id: 'comments', label: 'Moderate comments', icon: ICON_COMMENTS },
  { id: 'subscribers', label: 'Subscribers', icon: ICON_SUBSCRIBERS },
  { id: 'messages', label: 'Messages', icon: ICON_MESSAGES },
];

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

// Rebuilt on the same sidebar-tab pattern as AdminDashboard.jsx (see that
// file's own comment for the reasoning) - posts, books, spotlight
// requests, subscribers, and messages all live here as tabs now instead
// of being scattered across separate pages only reachable from the nav
// dropdown. Each tab reuses the exact same component that used to be (or
// still is, at its own standalone route) its own page, via the `embedded`
// prop - nothing about how any of them work changed, only where they're
// framed.
//
// No Letters tab - contributors can't write letters at all (3.6).
// Campaigns is included though, since only admin is blocked from
// requesting one (RequestCampaign.jsx), not contributors. Moderate
// comments (Phase 3, Issues Log 5.4) IS included - AdminComments.jsx is
// no longer admin-only, it self-scopes to comments on whatever posts the
// logged-in user actually wrote, which for a contributor is their own.
export default function ContributorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'overview';

  const [posts, setPosts] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [extras, setExtras] = useState({ unread_messages: 0, subscribers: 0, subscribers_new: 0 });
  const [pendingComments, setPendingComments] = useState(0);
  const [activity, setActivity] = useState({ total_views: 0, total_likes: 0, total_comments: 0 });
  const [status, setStatus] = useState('loading');

  // Loads regardless of which tab is active, same reasoning as
  // AdminDashboard.jsx - otherwise switching straight to a non-Overview
  // tab via a bookmarked URL would show no badges until Overview was
  // visited once.
  useEffect(() => {
    if (authLoading || !user) return;

    setStatus('loading');
    Promise.all([
      apiClient.get('/my/posts'),
      apiClient.get('/portfolio/mine'),
      apiClient.get('/my/campaigns'),
    ])
      .then(([postsRes, portfolioRes, campaignsRes]) => {
        setPosts(postsRes.data);
        setPortfolioItems(portfolioRes.data);
        setCampaigns(campaignsRes.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));

    // Best-effort, separate from the load above so a hiccup here can't
    // block the rest of the dashboard. Deliberately the lightweight
    // /new-count endpoints rather than the full inbox/My Subscribers
    // pages, which mark things read/checked as a side effect of loading
    // them - hitting those from the dashboard would silently clear the
    // badge before it's ever seen (4.9).
    Promise.all([
      apiClient.get('/my/contact-messages/unread-count'),
      apiClient.get('/my/subscribers/new-count'),
      // No lightweight /new-count endpoint exists for comments - the
      // moderation queue itself is already small (pending comments on
      // just this user's own posts), so its length doubles as the badge
      // count, same as how pendingCampaigns is derived below from the
      // full campaigns array rather than a separate count endpoint.
      apiClient.get('/admin/comments', { params: { status: 'pending' } }),
      // Q6 - "your content activity": total likes/comments/views across
      // everything this user owns (posts+letters+books), one aggregate
      // call rather than summing three separate lists client-side.
      apiClient.get('/my/activity-summary'),
    ])
      .then(([unreadRes, subsRes, commentsRes, activityRes]) => {
        setExtras({
          unread_messages: unreadRes.data.unread_messages,
          subscribers: subsRes.data.count,
          subscribers_new: subsRes.data.new_since_last_check,
        });
        setPendingComments(commentsRes.data.length);
        setActivity(activityRes.data);
      })
      .catch(() => {});
  }, [authLoading, user]);

  function setTab(id) {
    setSearchParams(id === 'overview' ? {} : { tab: id });
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see your dashboard.</p>;

  const publishedCount = portfolioItems.filter((i) => i.status === 'published').length;
  const likesTotal = portfolioItems.reduce((sum, i) => sum + (i.likes_count ?? 0), 0);
  const pendingCampaigns = campaigns.filter((c) => c.status === 'pending').length;

  return (
    <div className="settings-page">
      <p className="settings-card-eyebrow">Contributor</p>
      <h1>Welcome back, {user.name}</h1>
      <p className="post-meta">You're building something. Every post you submit gets a real review — not a black hole.</p>

      <div className="settings-layout">
        <nav className="settings-tabs" aria-label="Dashboard sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab ${activeTab === tab.id ? 'settings-tab-active' : ''}`}
              onClick={() => setTab(tab.id)}
            >
              <span className="settings-tab-icon">{tab.icon}</span>
              {tab.label}
              {tab.id === 'comments' && pendingComments > 0 && (
                <span className="settings-tab-badge">{pendingComments}</span>
              )}
              {tab.id === 'subscribers' && extras.subscribers_new > 0 && (
                <span className="settings-tab-badge">{extras.subscribers_new}</span>
              )}
              {tab.id === 'messages' && extras.unread_messages > 0 && (
                <span className="settings-tab-badge">{extras.unread_messages}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {activeTab === 'overview' && (
            <>
              <div className="settings-card">
                <Link to="/write/post" className="nav-cta">Write a new post</Link>
              </div>

              <div className="settings-card">
                <div className="dashboard-summary-grid">
                  <button type="button" className="dashboard-summary-tile" onClick={() => setTab('messages')}>
                    <span className="dashboard-summary-count">{extras.unread_messages}</span>
                    <span>Unread message{extras.unread_messages === 1 ? '' : 's'}</span>
                  </button>
                  <button type="button" className="dashboard-summary-tile" onClick={() => setTab('subscribers')}>
                    <span className="dashboard-summary-count">
                      {extras.subscribers}
                      {extras.subscribers_new > 0 && (
                        <span className="dashboard-summary-new">+{extras.subscribers_new} new</span>
                      )}
                    </span>
                    <span>Subscriber{extras.subscribers === 1 ? '' : 's'}</span>
                  </button>
                  <button type="button" className="dashboard-summary-tile" onClick={() => setTab('campaigns')}>
                    <span className="dashboard-summary-count">{pendingCampaigns}</span>
                    <span>Spotlight request{pendingCampaigns === 1 ? '' : 's'} pending</span>
                  </button>
                  <button type="button" className="dashboard-summary-tile" onClick={() => setTab('comments')}>
                    <span className="dashboard-summary-count">{pendingComments}</span>
                    <span>Comment{pendingComments === 1 ? '' : 's'} awaiting your review</span>
                  </button>
                </div>
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
                      <p className="empty-state">Nothing here yet. Write your first post and see it through review.</p>
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
                    {posts.length > 5 && (
                      <p className="post-meta">
                        <button type="button" className="text-link" onClick={() => setTab('posts')}>
                          See all {posts.length} posts
                        </button>
                      </p>
                    )}
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

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h2>Your content activity</h2>
                    </div>
                    <p className="post-meta">
                      Across every post, letter, and book you've published.
                    </p>
                    <div className="portfolio-stats-grid">
                      <div className="portfolio-stat-card">
                        <span className="portfolio-stat-num">{activity.total_views}</span>
                        <span className="portfolio-stat-label">Views</span>
                      </div>
                      <div className="portfolio-stat-card">
                        <span className="portfolio-stat-num portfolio-stat-num-wax">{activity.total_likes}</span>
                        <span className="portfolio-stat-label">Likes</span>
                      </div>
                      <div className="portfolio-stat-card">
                        <span className="portfolio-stat-num portfolio-stat-num-forest">{activity.total_comments}</span>
                        <span className="portfolio-stat-label">Comments</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'posts' && <MyPosts embedded />}
          {activeTab === 'books' && <MyBooks embedded />}
          {activeTab === 'campaigns' && <RequestCampaign embedded />}
          {activeTab === 'comments' && <AdminComments embedded />}
          {activeTab === 'subscribers' && <MySubscribers embedded />}
          {activeTab === 'messages' && <MyContactMessages embedded />}
        </div>
      </div>
    </div>
  );
}
