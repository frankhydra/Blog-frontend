import { Link } from 'react-router-dom';
import { formatPostmark } from '../utils/postmark';

const ROLE_LABELS = {
  admin: 'Site owner',
  author: 'Author',
  contributor: 'Contributor',
};

// A single-page portfolio: intro, a list of work, and a short list of
// recent writing. Used in three places:
//   - the public Portfolio landing page (with topCta / bottomCta)
//   - an individual author's page at /authors/:id (with backLink)
//   - the "My Portfolio" builder's preview mode (with previewMode)
export default function PortfolioOnePager({
  person,
  items = [],
  posts = [],
  previewMode = false,
  topCta = null,
  bottomCta = null,
  backLink = null,
}) {
  if (!person) return null;

  const roleLabel = ROLE_LABELS[person.role] || null;

  return (
    <div className="one-pager">
      {previewMode && (
        <div className="one-pager-preview-banner">
          Preview — this is how your portfolio looks to visitors. Draft items
          below are marked and won't show on your public page until published.
        </div>
      )}

      {backLink && (
        <Link to={backLink.to} className="back-link">
          &larr; {backLink.label}
        </Link>
      )}

      <header className="one-pager-hero">
        {person.avatar ? (
          <img src={person.avatar} alt={person.name} className="one-pager-avatar" />
        ) : (
          <span className="one-pager-avatar one-pager-avatar-fallback">
            {person.name.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="one-pager-hero-text">
          {roleLabel && <p className="kicker">{roleLabel}</p>}
          <h1>{person.name}</h1>
          {person.bio && <p className="one-pager-bio">{person.bio}</p>}
        </div>
      </header>

      {topCta}

      <section className="one-pager-section">
        <h2>Work</h2>
        {items.length === 0 && (
          <p className="post-meta">
            {previewMode ? "You haven't added anything yet — add your first item below." : 'Nothing added yet.'}
          </p>
        )}

        <ul className="one-pager-list">
          {items.map((item) => (
            <li key={item.id} className="one-pager-row">
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="one-pager-row-thumb" />
              )}
              <div className="one-pager-row-body">
                <div className="one-pager-row-head">
                  <h3>{item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
                  ) : item.title}</h3>
                  {previewMode && item.status === 'draft' && (
                    <span className="status-pill status-pill-draft">Draft</span>
                  )}
                </div>
                {item.description && <p>{item.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {posts.length > 0 && (
        <section className="one-pager-section">
          <h2>Recent writing</h2>
          <ul className="one-pager-list">
            {posts.map((post) => {
              const { day, month } = formatPostmark(post.published_at);
              return (
                <li key={post.id} className="one-pager-row one-pager-row-writing">
                  <span className="one-pager-row-date">{month} {day}</span>
                  <div className="one-pager-row-body">
                    <h3><Link to={`/posts/${post.slug}`}>{post.title}</Link></h3>
                    {post.excerpt && <p>{post.excerpt}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {bottomCta}
    </div>
  );
}
