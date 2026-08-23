import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

export default function About() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta('About', "Who I am, what I do, and the other bloggers on this platform.");

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

  const { owner, portfolio, other_authors: otherAuthors } = data;
  const isOwner = owner && user?.id === owner.id;

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

      {isOwner && (
        <p className="post-meta">
          <Link to="/edit-profile">Edit your bio</Link> ·{' '}
          <Link to="/my-portfolio">Manage your portfolio</Link>
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

      {otherAuthors && otherAuthors.length > 0 && (
        <>
          <p className="kicker" style={{ marginTop: '3.5rem' }}>More voices</p>
          <h2 style={{ marginTop: 0 }}>Other bloggers on this platform</h2>
          <p className="post-meta">
            Fellow writers publishing here — click through for their full profile and portfolio.
          </p>

          <div className="author-cards">
            {otherAuthors.map((author) => (
              <Link to={`/authors/${author.id}`} key={author.id} className="author-card">
                <div className="author-card-head">
                  {author.avatar ? (
                    <img src={author.avatar} alt={author.name} className="author-card-avatar" />
                  ) : (
                    <span className="author-card-avatar author-card-avatar-fallback">
                      {author.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h3>{author.name}</h3>
                    <span className="author-card-meta">
                      {author.posts_count} {author.posts_count === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                </div>

                {author.bio && <p className="author-card-bio">{author.bio}</p>}

                {author.portfolio_preview.length > 0 && (
                  <div className="author-card-portfolio">
                    {author.portfolio_preview.map((item) => (
                      item.image_url ? (
                        <img key={item.id} src={item.image_url} alt={item.title} />
                      ) : (
                        <span key={item.id} className="author-card-portfolio-placeholder">
                          {item.title}
                        </span>
                      )
                    ))}
                  </div>
                )}

                <span className="author-card-cta">View profile &rarr;</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
