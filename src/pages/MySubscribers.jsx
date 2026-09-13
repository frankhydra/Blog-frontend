import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import downloadFile from '../utils/downloadFile';
import apiClient from '../api/client';

const ICON_SUBSCRIBERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6.5h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 4.8 - self-service: your own list only, never anyone else's. Anyone
// with a public profile (admin, author, or contributor - see
// SubscriberController::mine()) can reach this from their own dashboard.
export default function MySubscribers() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    setStatus('loading');
    apiClient
      .get('/my/subscribers')
      .then((res) => {
        setData(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authLoading, user]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadFile('/my/subscribers/export', 'my-subscribers.csv');
    } finally {
      setDownloading(false);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user) return <p className="empty-state">You need to log in to see this page.</p>;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_SUBSCRIBERS}</span>
        <div>
          <p className="settings-card-eyebrow">Your list</p>
          <h1>My subscribers</h1>
          <p className="post-meta">
            Everyone who chose to subscribe to you specifically from your
            public profile. Nobody else's list, and not the platform-wide
            list - just yours.
          </p>
        </div>
      </section>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load your subscribers.</p>}

      {status === 'ready' && (
        <div className="settings-card">
          <div className="subscriber-platform-row">
            <div>
              <span className="dashboard-summary-count">{data.count}</span>
              <span className="post-meta"> subscriber{data.count === 1 ? '' : 's'}</span>
              {data.new_since_last_check > 0 && (
                <span className="dashboard-summary-new">
                  {data.new_since_last_check} new since you last checked
                </span>
              )}
            </div>
            <button type="button" className="text-link" onClick={handleDownload} disabled={data.count === 0 || downloading}>
              {downloading ? 'Preparing…' : 'Download CSV'}
            </button>
          </div>

          {data.count === 0 ? (
            <p className="empty-state">
              Nobody's subscribed yet - the "Subscribe" button lives on your
              public profile page.
            </p>
          ) : (
            <ul className="moderation-list">
              {data.subscribers.map((s) => (
                <li key={s.id} className="moderation-item">
                  {s.name ? `${s.name} · ` : ''}{s.email}
                  <p className="post-meta">
                    Subscribed {new Date(s.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
