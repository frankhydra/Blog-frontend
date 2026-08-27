import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import PortfolioOnePager from '../components/PortfolioOnePager';

export default function Portfolios() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta('Portfolio', "See the site owner's work, and the other bloggers publishing here.");

  useEffect(() => {
    // Re-fetch whenever who's logged in changes, since the API personalizes
    // the featured slot to the viewer (their own portfolio if they're an
    // author/contributor, the site owner's otherwise).
    setStatus('loading');
    apiClient
      .get('/portfolios')
      .then((res) => {
        setData(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [user?.id]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>Couldn't load this page.</p>;

  const { featured, featured_portfolio: items, featured_posts: posts, featured_experience: experience, other_authors: otherAuthors } = data;
  const isViewingSelf = featured?.is_viewer;
  const hasOthers = otherAuthors && otherAuthors.length > 0;

  function scrollToOthers(e) {
    e.preventDefault();
    document.getElementById('other-authors')?.scrollIntoView({ behavior: 'smooth' });
  }

  const topCta = hasOthers && (
    <div className="one-pager-cta">
      <p>{isViewingSelf ? "You're not the only one writing here." : "There's more than one writer here."}</p>
      <a href="#other-authors" onClick={scrollToOthers} className="nav-cta">
        See other authors & contributors ↓
      </a>
    </div>
  );

  const bottomCta = (
    <div className="one-pager-cta one-pager-cta-close">
      {user ? (
        <>
          <p>Want to add to what's shown here?</p>
          <Link to="/settings?tab=portfolio" className="nav-cta">Manage your portfolio</Link>
        </>
      ) : (
        <>
          <p>Want your own work featured on this page?</p>
          <Link to="/register" className="nav-cta">Create an account</Link>
        </>
      )}
    </div>
  );

  return (
    <div className="about-page">
      <PortfolioOnePager
        person={featured}
        items={items}
        posts={posts}
        experience={experience}
        showContact={!isViewingSelf}
        topCta={topCta}
        bottomCta={!hasOthers ? bottomCta : null}
      />

      {isViewingSelf && (
        <p className="post-meta one-pager-self-links">
          <Link to="/settings?tab=profile">Edit your bio</Link> ·{' '}
          <Link to="/settings?tab=portfolio">Manage your portfolio</Link>
        </p>
      )}

      {hasOthers && (
        <section id="other-authors" className="one-pager-section">
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
                    <h3>
                      {author.name}
                      {author.is_owner && <span className="owner-badge owner-badge-inline">Site owner</span>}
                    </h3>
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

          {bottomCta}
        </section>
      )}
    </div>
  );
}
