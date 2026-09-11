import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ICON_SPOTLIGHT = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M5.6 5.6l2.3 2.3M16.1 16.1l2.3 2.3M18.4 5.6l-2.3 2.3M7.9 16.1l-2.3 2.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

// Card-based to match the design system already defined for this page in
// index.css (.admin-page / .queue-card) - this component just hadn't been
// updated to actually use it yet, unlike MyContactMessages.jsx which has.
export default function AdminCampaigns() {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState('loading');
  const [actioningId, setActioningId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;
    loadQueue();
  }, [authLoading, user]);

  function loadQueue() {
    setStatus('loading');
    apiClient
      .get('/admin/campaigns', { params: { status: 'pending' } })
      .then((res) => {
        setCampaigns(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function handleApprove(campaign) {
    setActioningId(campaign.id);
    try {
      await apiClient.post(`/campaigns/${campaign.id}/approve`);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    } catch {
      // leave it in the list so the admin can retry
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(campaign) {
    setActioningId(campaign.id);
    try {
      await apiClient.post(`/campaigns/${campaign.id}/reject`, {
        admin_note: noteDrafts[campaign.id] || null,
      });
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    } catch {
      // leave it in the list so the admin can retry
    } finally {
      setActioningId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') {
    return <p className="empty-state">You don't have access to this page.</p>;
  }

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_SPOTLIGHT}</span>
        <div>
          <p className="settings-card-eyebrow">Moderation queue</p>
          <h1>Pending campaign requests</h1>
          <p className="post-meta">
            Approved requests appear in the spotlight on the home page.
            Rejecting one is final for that request - the author can always
            submit a fresh one.
          </p>
        </div>
      </section>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load the moderation queue.</p>}
      {status === 'ready' && campaigns.length === 0 && (
        <p className="empty-state">Nothing waiting for review.</p>
      )}

      {campaigns.length > 0 && (
        <div className="queue-list">
          {campaigns.map((c) => (
            <article key={c.id} className="settings-card queue-card">
              <div className="queue-card-layout">
                {c.image_url && (
                  <img src={c.image_url} alt="" loading="lazy" className="queue-card-image" />
                )}
                <div className="queue-card-main">
                  <p className="queue-card-meta">
                    <strong>{c.title}</strong> requested by {c.user?.name}
                    {c.book && <> · about <em>{c.book.title}</em></>}
                    {c.launch_date && <> · launching {new Date(c.launch_date).toLocaleDateString()}</>}
                  </p>
                  <p className="queue-card-body">{c.description}</p>
                  {c.link_url && (
                    <p className="post-meta">
                      Links to: <a href={c.link_url} target="_blank" rel="noreferrer">{c.link_url}</a>
                    </p>
                  )}

                  <input
                    type="text"
                    className="queue-note-input"
                    placeholder="Optional note if you reject this…"
                    value={noteDrafts[c.id] || ''}
                    onChange={(e) => setNoteDrafts({ ...noteDrafts, [c.id]: e.target.value })}
                  />

                  <div className="queue-card-actions">
                    <button
                      onClick={() => handleApprove(c)}
                      disabled={actioningId === c.id}
                      className="queue-approve-button"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(c)}
                      disabled={actioningId === c.id}
                      className="queue-reject-button"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
