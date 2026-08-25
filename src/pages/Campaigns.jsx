import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import CountdownTimer from '../components/CountdownTimer';

// Every approved campaign, not just the handful teased on Home - launches,
// book drops, events, anything an author or the site owner has asked to
// spotlight. Soonest launch first (see CampaignController::index).
export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta('Campaigns', 'Upcoming launches, events, and spotlights from everyone writing here.');

  useEffect(() => {
    apiClient
      .get('/campaigns', { params: { limit: 50 } })
      .then((res) => {
        setCampaigns(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>Couldn't load campaigns.</p>;

  return (
    <div>
      <p className="kicker">Coming up</p>
      <h1>Launches, events & spotlights</h1>
      <p className="post-meta">
        Anything the site owner or an author is highlighting right now, with
        a countdown to launch day.
      </p>

      {campaigns.length === 0 && <p>Nothing on the calendar yet.</p>}

      <div className="campaign-grid">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="campaign-card"
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/campaigns/${c.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/campaigns/${c.id}`)}
          >
            {c.image_url && <img src={c.image_url} alt="" className="campaign-card-image" />}
            <div className="campaign-card-body">
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <p className="post-meta">
                By{' '}
                <Link to={`/authors/${c.user?.id}`} onClick={(e) => e.stopPropagation()}>
                  {c.user?.name}
                </Link>
              </p>
              <CountdownTimer launchDate={c.launch_date} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
