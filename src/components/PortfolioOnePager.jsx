import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { formatPostmark } from '../utils/postmark';
import ContactAuthorForm from './ContactAuthorForm';

const ROLE_LABELS = {
  admin: 'Site owner',
  author: 'Author',
  contributor: 'Contributor',
};

const SOCIAL_ICONS = {
  github: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.9-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.83-2.34 4.68-4.57 4.92.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 10v6.2M7.5 7.6v.02M11.3 16.2V10M11.3 12.5c0-1.5 1-2.5 2.4-2.5s2.3 1 2.3 2.7v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4l16 16M20 4 4 20M4 4h4l12 16h-4L4 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  ),
};

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20.5s-7.5-4.6-9.8-9.3C.9 8 2.4 4.8 5.6 4.1c2-.4 3.9.5 5 2.1a5.7 5.7 0 0 1 1.4-1.6c1.2-1 3-1.4 4.6-1 3.2.7 4.7 3.9 3.4 6.9C17.5 15.9 12 20.5 12 20.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

// A single-page portfolio: intro (with headline/availability/skills/socials),
// a filterable list of work with likes, a career timeline, recent writing,
// and an optional contact form. Used in three places:
//   - the public Portfolio landing page (with topCta / bottomCta)
//   - an individual author's page at /authors/:id (with backLink, showContact)
//   - the "My Portfolio" builder's preview mode (with previewMode)
export default function PortfolioOnePager({
  person,
  items = [],
  posts = [],
  experience = [],
  previewMode = false,
  showContact = false,
  topCta = null,
  bottomCta = null,
  backLink = null,
}) {
  const [likeState, setLikeState] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const set = new Set(items.map((item) => item.category).filter(Boolean));
    return Array.from(set);
  }, [items]);

  const visibleItems = categoryFilter === 'all'
    ? items
    : items.filter((item) => item.category === categoryFilter);

  if (!person) return null;

  const roleLabel = ROLE_LABELS[person.role] || null;
  const socialLinks = person.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  async function toggleLike(item) {
    if (previewMode) return;
    const current = likeState[item.id] ?? { liked: item.liked_by_viewer, count: item.likes_count ?? 0 };
    // Optimistic update so the heart responds instantly
    setLikeState((prev) => ({
      ...prev,
      [item.id]: { liked: !current.liked, count: current.count + (current.liked ? -1 : 1) },
    }));
    try {
      const res = await apiClient.post(`/portfolio/${item.id}/like`);
      setLikeState((prev) => ({ ...prev, [item.id]: { liked: res.data.liked, count: res.data.likes_count } }));
    } catch {
      setLikeState((prev) => ({ ...prev, [item.id]: current }));
    }
  }

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
          {person.headline && <p className="one-pager-headline">{person.headline}</p>}

          {person.availability && (
            <span className="availability-pill">
              <span className="availability-dot" />
              {person.availability}
            </span>
          )}

          {person.bio && <p className="one-pager-bio">{person.bio}</p>}

          {(person.location || person.website) && (
            <div className="one-pager-meta-row">
              {person.location && (
                <span className="one-pager-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  {person.location}
                </span>
              )}
              {person.website && (
                <a
                  href={person.website}
                  target="_blank"
                  rel="noreferrer"
                  className="one-pager-meta-item one-pager-meta-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.4-3.8-8.5S9.5 5.9 12 3.5Z" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  {person.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}

          {person.skills?.length > 0 && (
            <div className="skill-chip-row">
              {person.skills.map((skill) => (
                <span key={skill} className="skill-chip">{skill}</span>
              ))}
            </div>
          )}

          {hasSocialLinks && (
            <div className="social-icon-row">
              {Object.entries(socialLinks).map(([platform, url]) => (
                url ? (
                  <a key={platform} href={url} target="_blank" rel="noreferrer" className="social-icon-link" title={platform}>
                    {SOCIAL_ICONS[platform]}
                  </a>
                ) : null
              ))}
            </div>
          )}
        </div>
      </header>

      {topCta}

      <section className="one-pager-section">
        <div className="one-pager-section-head">
          <h2>Work</h2>
          {categories.length > 0 && (
            <div className="category-filter-row">
              <button
                type="button"
                className={`category-filter-btn ${categoryFilter === 'all' ? 'category-filter-btn-active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-filter-btn ${categoryFilter === cat ? 'category-filter-btn-active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {visibleItems.length === 0 && (
          <p className="post-meta">
            {previewMode ? "You haven't added anything yet — add your first item below." : 'Nothing here yet.'}
          </p>
        )}

        <ul className="one-pager-list">
          {visibleItems.map((item) => {
            const like = likeState[item.id] ?? { liked: item.liked_by_viewer, count: item.likes_count ?? 0 };
            return (
              <li key={item.id} className="one-pager-row">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="one-pager-row-thumb" />
                )}
                <div className="one-pager-row-body">
                  <div className="one-pager-row-head">
                    <h3>{item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
                    ) : item.title}</h3>
                    {item.category && <span className="item-category-tag">{item.category}</span>}
                    {previewMode && item.status === 'draft' && (
                      <span className="status-pill status-pill-draft">Draft</span>
                    )}
                  </div>
                  {item.description && <p>{item.description}</p>}
                  {!previewMode && (
                    <button
                      type="button"
                      className={`like-button ${like.liked ? 'like-button-active' : ''}`}
                      onClick={() => toggleLike(item)}
                    >
                      <HeartIcon filled={like.liked} />
                      {like.count > 0 ? like.count : ''}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {experience.length > 0 && (
        <section className="one-pager-section">
          <h2>Experience</h2>
          <div className="timeline">
            {experience.map((exp) => (
              <div key={exp.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-head">
                  <h3>{exp.role} <span className="timeline-company">@ {exp.company}</span></h3>
                  {exp.period && <span className="timeline-period">{exp.period}</span>}
                </div>
                {exp.details && <p>{exp.details}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

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

      {showContact && !previewMode && (
        <section className="one-pager-section">
          <h2>Get in touch</h2>
          <ContactAuthorForm authorId={person.id} authorName={person.name} />
        </section>
      )}

      {bottomCta}
    </div>
  );
}
