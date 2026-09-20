import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import MyPosts from './MyPosts';
import MyLetters from './MyLetters';
import MyBooks from './MyBooks';
import RequestCampaign from './RequestCampaign';
import MySubscribers from './MySubscribers';
import MyContactMessages from './MyContactMessages';
import AdminComments from './AdminComments';

// Icons reused verbatim from ContributorDashboard.jsx's set (same visual
// family across all three dashboards). ICON_LETTERS is the one new icon
// Author needs that Contributor doesn't - contributors can't write
// letters at all (LetterController::authorizeCanWrite()).
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
const ICON_LETTERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M4 6.5l8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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
const ICON_COMMENTS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.2 3.4a.5.5 0 0 1-.8-.4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const TABS = [
  { id: 'overview', label: 'Overview', icon: ICON_OVERVIEW },
  { id: 'posts', label: 'My posts', icon: ICON_POSTS },
  { id: 'letters', label: 'My letters', icon: ICON_LETTERS },
  { id: 'books', label: 'My books', icon: ICON_BOOKS },
  { id: 'campaigns', label: 'Spotlight requests', icon: ICON_CAMPAIGNS },
  { id: 'comments', label: 'Moderate comments', icon: ICON_COMMENTS },
  { id: 'subscribers', label: 'Subscribers', icon: ICON_SUBSCRIBERS },
  { id: 'messages', label: 'Messages', icon: ICON_MESSAGES },
];

const CAMPAIGN_STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', withdrawn: 'Withdrawn' };

// Same three-state logic as MyPosts.jsx/ContributorDashboard.jsx (2.3) -
// author posts publish immediately with no review gate, but the fields
// still exist on the model, so this stays accurate either way.
function postStatusLabel(post) {
  if (post.status === 'published') return 'Published';
  if (post.submitted_at) return 'Submitted — awaiting review';
  return 'Draft';
}

function postStatusClass(post) {
  if (post.status === 'published') return 'status-pill status-pill-published';
  if (post.submitted_at) return 'status-pill status-pill-pending';
  return 'status-pill status-pill-draft';
}

// Implementation Checklist 2.1 (Author half) - rebuilt on the exact same
// sidebar-tab pattern as ContributorDashboard.jsx (Gate A/Q1: "okay
// begin"), so all three dashboards read as one consistent feature. Author
// gets everything Contributor has (posts/books/campaigns/subscribers/
// messages) plus a Letters tab, since - unlike a contributor - an author
// can write and publish letters directly (LetterController::
// authorizeCanWrite() blocks contributors specifically, not authors).
// Moderate comments (Phase 3, Issues Log 5.4) is included too -
// AdminComments.jsx is no longer admin-only, it self-scopes to comments
// on whatever posts the logged-in user actually wrote.
export default function AuthorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'overview';

  const [posts, setPosts] = useState([]);
  const [letters, setLetters] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [extras, setExtras] = useState({ unread_messages: 0, subscribers: 0, subscribers_new: 0 });
  const [pendingComments, setPendingComments] = useState(0);
  const [status, setStatus] = useState('loading');

  // Loads regardless of which tab is active - same reasoning as
  // ContributorDashboard.jsx - so a bookmarked ?tab= link doesn't show
  // stale/empty badges until Overview is visited once.
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

    // Best-effort, separate from the load above - a hiccup here shouldn't
    // block the rest of the dashboard. Deliberately the lightweight
    // /new-count endpoints rather than the full inbox/My Subscribers
    // pages, which mark things read/checked as a side effect of loading
    // them (4.9).
    Promise.all([
      apiClient.get('/my/contact-messages/unread-count'),
      apiClient.get('/my/subscribers/new-count'),
      // No lightweight /new-count endpoint exists for comments - the
      // moderation queue is already small (pending comments on just this
      // user's own posts), so its length doubles as the badge count, same
      // as pendingCampaigns being derived from the full campaigns array
      // below rather than a separate count endpoint.
      apiClient.get('/admin/comments', { params: { status: 'pending' } }),
    ])
      .then(([unreadRes, subsRes, commentsRes]) => {
        setExtras({
          unread_messages: unreadRes.data.unread_messages,
          subscribers: subsRes.data.count,
          subscribers_new: subsRes.data.new_since_last_check,
        });
        setPendingComments(commentsRes.data.length);
      })
      .catch(() => {});
  }, [authLoading, user]);

  function setTab(id) {
    setSearchParams(id === 'overview' ? {} : { tab: id });
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see your dashboard.</p>;

  const pendingCampaigns = campaigns.filter((c) => c.status === 'pending').length;

  return (
    <div className="settings-page">
      <p className="settings-card-eyebrow">Author</p>
      <h1>Welcome back, {user.name}</h1>
      <p className="post-meta">Your desk. Your posts, your letters, your numbers — all in one place.</p>

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
                <p className="post-meta">
                  <Link to="/write/post" className="nav-cta">Write a new post</Link>
                  {' '}· <Link to="/write/letter">Write a new letter</Link>
                </p>
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
                      <p className="empty-state">
                        Nothing published yet. Your next post is one click away. <Link to="/write/post">Write your first one</Link>.
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
                              <span className={postStatusClass(post)}>{postStatusLabel(post)}</span>
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
                      <h2>Your letters</h2>
                    </div>
                    {letters.length === 0 ? (
                      <p className="empty-state">
                        Your list is waiting. <Link to="/write/letter">Write your first letter</Link>.
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
                    {letters.length > 5 && (
                      <p className="post-meta">
                        <button type="button" className="text-link" onClick={() => setTab('letters')}>
                          See all {letters.length} letters
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h2>Your campaign requests</h2>
                    </div>
                    {campaigns.length === 0 ? (
                      <p className="empty-state">
                        No requests yet. Ready to get featured? <button type="button" className="text-link" onClick={() => setTab('campaigns')}>Request a spotlight</button>.
                      </p>
                    ) : (
                      <ul className="moderation-list">
                        {campaigns.slice(0, 5).map((c) => (
                          <li key={c.id} className="moderation-item">
                            <strong>{c.title}</strong>{' '}
                            <span className={`status-pill status-pill-${c.status}`}>
                              {CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}
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
            </>
          )}

          {activeTab === 'posts' && <MyPosts embedded />}
          {activeTab === 'letters' && <MyLetters embedded />}
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
