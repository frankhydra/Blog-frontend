import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

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

  if (authLoading) return <p>Loading…</p>;
  if (!user || user.role !== 'admin') {
    return <p>You don't have access to this page.</p>;
  }

  return (
    <div className="admin-comments">
      <h1>Pending campaign requests</h1>
      <p className="post-meta">
        Approved requests appear in the spotlight on the home page.
        Rejecting one is final for that request - the author can always
        submit a fresh one.
      </p>

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Couldn't load the moderation queue.</p>}
      {status === 'ready' && campaigns.length === 0 && <p>Nothing waiting for review.</p>}

      <ul className="moderation-list">
        {campaigns.map((c) => (
          <li key={c.id} className="moderation-item">
            <p className="comment-meta">
              <strong>{c.title}</strong> requested by {c.user?.name}
              {c.book && <> · about <em>{c.book.title}</em></>}
              {c.launch_date && <> · launching {new Date(c.launch_date).toLocaleDateString()}</>}
            </p>
            <p className="comment-body">{c.description}</p>
            {c.link_url && (
              <p className="post-meta">
                Links to: <a href={c.link_url} target="_blank" rel="noreferrer">{c.link_url}</a>
              </p>
            )}
            {c.image_url && (
              <img src={c.image_url} alt="" style={{ maxWidth: '220px', borderRadius: '8px', display: 'block', marginBottom: '0.75rem' }} />
            )}

            <input
              type="text"
              className="moderation-note-input"
              placeholder="Optional note if you reject this…"
              value={noteDrafts[c.id] || ''}
              onChange={(e) => setNoteDrafts({ ...noteDrafts, [c.id]: e.target.value })}
            />

            <div className="moderation-actions">
              <button onClick={() => handleApprove(c)} disabled={actioningId === c.id}>
                Approve
              </button>
              <button onClick={() => handleReject(c)} disabled={actioningId === c.id} className="reject-button">
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
