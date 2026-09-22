import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import MyPosts from './MyPosts';
import MyLetters from './MyLetters';
import MyBooks from './MyBooks';
import MySubscribers from './MySubscribers';
import MyContactMessages from './MyContactMessages';

// Icons reused verbatim from AuthorDashboard.jsx/ContributorDashboard.jsx's
// set - same visual family across every dashboard in the app.
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

// Deliberately NO Spotlight requests tab - admin is blocked from
// requesting a campaign at all (CampaignController::store()), so there's
// nothing to show there, unlike Author/Contributor. Also deliberately NO
// Moderate comments tab - that's still a moderation tool, not personal
// content, and it already lives on /admin/dashboard, already scoped to
// admin's own posts by 3.1/3.2's ownership-based query. Duplicating it
// here would split the same tool across two pages instead of separating
// "my content" from "platform tools", which is the whole point of this
// page existing.
const TABS = [
  { id: 'overview', label: 'Overview', icon: ICON_OVERVIEW },
  { id: 'posts', label: 'My posts', icon: ICON_POSTS },
  { id: 'letters', label: 'My letters', icon: ICON_LETTERS },
  { id: 'books', label: 'My books', icon: ICON_BOOKS },
  { id: 'subscribers', label: 'Subscribers', icon: ICON_SUBSCRIBERS },
  { id: 'messages', label: 'Messages', icon: ICON_MESSAGES },
];

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

// Q10 - admin had no place to manage their own posts/letters/books the
// way author/contributor do, and Kali's own call was NOT to fold that
// into AdminDashboard.jsx (that's what made it feel cluttered) but to
// give admin a second page instead - this one - mirroring Author's
// dashboard shape, reached via its own link, entirely separate from
// /admin/dashboard's moderation tools. Also closes the real gap Q10
// surfaced alongside the design question: before this, admin had zero UI
// path to /my-books or /my-letters at all.
export default function MyDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'overview';

  const [posts, setPosts] = useState([]);
  const [letters, setLetters] = useState([]);
  const [extras, setExtras] = useState({ unread_messages: 0, subscribers: 0, subscribers_new: 0 });
  const [activity, setActivity] = useState({ total_views: 0, total_likes: 0, total_comments: 0 });
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;

    setStatus('loading');
    Promise.all([
      apiClient.get('/my/posts'),
      apiClient.get('/my/letters'),
    ])
      .then(([postsRes, lettersRes]) => {
        setPosts(postsRes.data);
        setLetters(lettersRes.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));

    Promise.all([
      apiClient.get('/my/contact-messages/unread-count'),
      apiClient.get('/my/subscribers/new-count'),
      // Q6 - "your content activity": total likes/comments/views across
      // everything this admin owns (posts+letters+books), same aggregate
      // call Author/Contributor dashboards already use - this page just
      // didn't exist yet when Q6 was originally built.
      apiClient.get('/my/activity-summary'),
    ])
      .then(([unreadRes, subsRes, activityRes]) => {
        setExtras({
          unread_messages: unreadRes.data.unread_messages,
          subscribers: subsRes.data.count,
          subscribers_new: subsRes.data.new_since_last_check,
        });
        setActivity(activityRes.data);
      })
      .catch(() => {});
  }, [authLoading, user]);

  function setTab(id) {
    setSearchParams(id === 'overview' ? {} : { tab: id });
  }

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') {
    return <p className="empty-state">You don't have access to this page.</p>;
  }

  return (
    <div className="settings-page">
      <p className="settings-card-eyebrow">Your content</p>
      <h1>Welcome back, {user.name}</h1>
      <p className="post-meta">
        Your own posts, letters, books and numbers — separate from your Admin dashboard's moderation
        tools. Looking for those instead? <Link to="/admin/dashboard">Go to the Admin dashboard</Link>.
      </p>

      <div className="settings-layout">
        <nav className="settings-tabs" aria-label="Your content sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab ${activeTab === tab.id ? 'settings-tab-active' : ''}`}
              onClick={() => setTab(tab.id)}
            >
              <span className="settings-tab-icon">{tab.icon}</span>
              {tab.label}
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
                  {' '}· <Link to="/add-book">Add a book</Link>
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
                </div>
              </div>

              {status === 'loading' && <Loading />}
              {status === 'error' && <p className="empty-state">Couldn't load your content.</p>}

              {status === 'ready' && (
                <>
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <h2>Your posts</h2>
                    </div>
                    {posts.length === 0 ? (
                      <p className="empty-state">
                        Nothing published yet. <Link to="/write/post">Write your first one</Link>.
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
          {activeTab === 'letters' && <MyLetters embedded />}
          {activeTab === 'books' && <MyBooks embedded />}
          {activeTab === 'subscribers' && <MySubscribers embedded />}
          {activeTab === 'messages' && <MyContactMessages embedded />}
        </div>
      </div>
    </div>
  );
}
