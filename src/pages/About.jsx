import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

export default function About() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta('About', "Who I am, what I do, and the projects I've worked on.");

  useEffect(() => {
    apiClient
      .get('/about')
      .then((res) => {
        setData(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>Couldn't load this page.</p>;

  const { owner, portfolio } = data;

  return (
    <div className="about-page">
      {owner && (
        <div className="about-header">
          {owner.avatar && <img src={owner.avatar} alt={owner.name} className="about-avatar" />}
          <div>
            <p className="kicker">Who I am</p>
            <h1>{owner.name}</h1>
            {owner.bio && <p>{owner.bio}</p>}
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <p className="post-meta">
          <Link to="/edit-profile">Edit your bio</Link> ·{' '}
          <Link to="/admin/portfolio">Manage portfolio</Link>
        </p>
      )}

      <p className="kicker" style={{ marginTop: '2.5rem' }}>What I've made</p>
      <h2 style={{ marginTop: 0 }}>Portfolio</h2>
      {portfolio.length === 0 && <p>Nothing added to the portfolio yet.</p>}

      <div className="portfolio-grid">
        {portfolio.map((item) => (
          <div key={item.id} className="portfolio-item">
            {item.image_url && <img src={item.image_url} alt={item.title} />}
            <h3>{item.title}</h3>
            {item.description && <p>{item.description}</p>}
            {item.link && (
              <a href={item.link} target="_blank" rel="noreferrer">
                View &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
