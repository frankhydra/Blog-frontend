import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import AdminPosts from './AdminPosts';
import AdminComments from './AdminComments';
import AdminCampaigns from './AdminCampaigns';
import AdminUsers from './AdminUsers';
import AdminCategories from './AdminCategories';
import AdminSubscribers from './AdminSubscribers';

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
const ICON_COMMENTS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.2 3.4a.5.5 0 0 1-.8-.4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
const ICON_CAMPAIGNS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M5.6 5.6l2.3 2.3M16.1 16.1l2.3 2.3M18.4 5.6l-2.3 2.3M7.9 16.1l-2.3 2.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const ICON_AUTHORS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 19c0-3 2.5-5.3 5.5-5.3S14.5 16 14.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15.5 6.2a3 3 0 0 1 0 5.8M17.8 13.6c2.3.6 4 2.6 4 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const ICON_CATEGORIES = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 4H6a2 2 0 0 0-2 2v5.5a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l5.5-5.5a2 2 0 0 0 0-2.8l-8-8A2 2 0 0 0 11.5 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="8.2" cy="8.2" r="1.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const ICON_SUBSCRIBERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6.5h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TABS = [
  { id: 'overview', label: 'Overview', icon: ICON_OVERVIEW },
  { id: 'posts', label: 'Review posts', icon: ICON_POSTS },
  { id: 'comments', label: 'Moderate comments', icon: ICON_COMMENTS },
  { id: 'campaigns', label: 'Moderate campaigns', icon: ICON_CAMPAIGNS },
  { id: 'authors', label: 'Manage authors', icon: ICON_AUTHORS },
  { id: 'categories', label: 'Manage categories', icon: ICON_CATEGORIES },
  { id: 'subscribers', label: 'Subscribers', icon: ICON_SUBSCRIBERS },
];

// Everything that used to be six separate links crammed into the account
// dropdown now lives here as tabs, the same way Settings.jsx already
// organizes Profile/Portfolio/Experience/Account - one page, one
// consistent left-hand nav, instead of a menu that only grows as the
// admin surface grows. Each tab reuses the exact same component that used
// to be its own standalone page (AdminPosts, AdminComments, etc.) via an
// `embedded` prop that just skips their own duplicate header - nothing
// about how they work changed, only where they're framed.
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'overview';

  const [summary, setSummary] = useState(null);
  const [subscriberNews, setSubscriberNews] = useState({ platform: 0 });

  // Summary drives the sidebar badges, so it loads regardless of which
  // tab is active - otherwise switching straight to a non-Overview tab
  // via a bookmarked URL would show no badges until Overview was visited
  // once.
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;

    apiClient
      .get('/admin/dashboard-summary')
      .then((res) => setSummary(res.data))
      .catch(() => {});

    // 4.9's "new since last checked" badge - deliberately the lightweight
    // /new-count endpoint, not the full Subscribers tab, which resets the
    // count as a side effect of loading it (see
    // SubscriberController::adminIndex() vs adminNewCount()). Admin's own
    // personal subscriber count/badge now lives on MyDashboard.jsx (Q10),
    // not here - this page only tracks the platform-wide number.
    apiClient
      .get('/admin/subscribers/new-count')
      .then((res) => setSubscriberNews({ platform: res.data.new_since_last_check }))
      .catch(() => {});
  }, [authLoading, user]);

  function setTab(id) {
    setSearchParams(id === 'overview' ? {} : { tab: id });
  }

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') {
    return <p className="empty-state">You don't have access to this page.</p>;
  }

  const totalPending = summary
    ? summary.pending_comments + summary.pending_campaigns + summary.pending_posts
    : 0;

  return (
    <div className="settings-page">
      <p className="kicker">Admin</p>
      <h1>Dashboard</h1>
      <p className="post-meta">
        Everything that needs your eye, in one glance. Looking for your own posts, letters, or books
        instead? <Link to="/my/dashboard">Go to your dashboard</Link>.
      </p>

      <div className="settings-layout">
        <nav className="settings-tabs" aria-label="Admin sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab ${activeTab === tab.id ? 'settings-tab-active' : ''}`}
              onClick={() => setTab(tab.id)}
            >
              <span className="settings-tab-icon">{tab.icon}</span>
              {tab.label}
              {tab.id === 'posts' && summary?.pending_posts > 0 && (
                <span className="settings-tab-badge">{summary.pending_posts}</span>
              )}
              {tab.id === 'comments' && summary?.pending_comments > 0 && (
                <span className="settings-tab-badge">{summary.pending_comments}</span>
              )}
              {tab.id === 'campaigns' && summary?.pending_campaigns > 0 && (
                <span className="settings-tab-badge">{summary.pending_campaigns}</span>
              )}
              {tab.id === 'subscribers' && subscriberNews.platform > 0 && (
                <span className="settings-tab-badge">{subscriberNews.platform}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {activeTab === 'overview' && (
            <>
              {summary && (
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h2>
                      {totalPending === 0
                        ? 'Nothing waiting for you'
                        : `${totalPending} thing${totalPending === 1 ? '' : 's'} waiting for review`}
                    </h2>
                  </div>

                  <div className="dashboard-summary-grid">
                    <button type="button" className="dashboard-summary-tile" onClick={() => setTab('posts')}>
                      <span className="dashboard-summary-count">{summary.pending_posts}</span>
                      <span>Post{summary.pending_posts === 1 ? '' : 's'} awaiting review</span>
                    </button>
                    <button type="button" className="dashboard-summary-tile" onClick={() => setTab('comments')}>
                      <span className="dashboard-summary-count">{summary.pending_comments}</span>
                      <span>Comment{summary.pending_comments === 1 ? '' : 's'} pending</span>
                    </button>
                    <button type="button" className="dashboard-summary-tile" onClick={() => setTab('campaigns')}>
                      <span className="dashboard-summary-count">{summary.pending_campaigns}</span>
                      <span>Campaign{summary.pending_campaigns === 1 ? '' : 's'} pending</span>
                    </button>
                    <button type="button" className="dashboard-summary-tile" onClick={() => setTab('subscribers')}>
                      <span className="dashboard-summary-count">
                        {summary.platform_subscribers}
                        {subscriberNews.platform > 0 && (
                          <span className="dashboard-summary-new">+{subscriberNews.platform} new</span>
                        )}
                      </span>
                      <span>Platform list subscribers</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'posts' && <AdminPosts embedded />}
          {activeTab === 'comments' && <AdminComments embedded />}
          {activeTab === 'campaigns' && <AdminCampaigns embedded />}
          {activeTab === 'authors' && <AdminUsers embedded />}
          {activeTab === 'categories' && <AdminCategories embedded />}
          {activeTab === 'subscribers' && <AdminSubscribers embedded />}
        </div>
      </div>
    </div>
  );
}
