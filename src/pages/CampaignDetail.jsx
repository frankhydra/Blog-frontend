import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import CountdownTimer from '../components/CountdownTimer';

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta(campaign?.title, campaign?.description);

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get(`/campaigns/${id}`)
      .then((res) => {
        setCampaign(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That campaign couldn't be found.</p>;

  return (
    <div className="campaign-detail">
      <Link to="/campaigns" className="back-link">&larr; Discover more campaigns</Link>

      <p className="kicker">In the spotlight</p>
      <h1>{campaign.title}</h1>
      <p className="post-meta">
        By <Link to={`/authors/${campaign.user?.id}`}>{campaign.user?.name}</Link>
        {campaign.launch_date && ` · Launching ${new Date(campaign.launch_date).toLocaleDateString()}`}
      </p>

      <CountdownTimer launchDate={campaign.launch_date} />

      {campaign.image_url && (
        <img src={campaign.image_url} alt="" className="campaign-detail-image" />
      )}

      <p className="campaign-detail-description">{campaign.description}</p>

      <div className="campaign-detail-actions">
        {campaign.book && (
          <Link to={`/books/${campaign.book.slug}`} className="nav-cta">
            View the book
          </Link>
        )}
        {campaign.link_url && (
          <a href={campaign.link_url} target="_blank" rel="noreferrer" className="text-link">
            Learn more
          </a>
        )}
      </div>

      <p className="post-meta campaign-detail-footer">
        <Link to="/campaigns">See everything coming up &rarr;</Link>
      </p>
    </div>
  );
}
