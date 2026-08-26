import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';
import { getAuthorFlag } from '../utils/authorFlag';
import CountdownTimer from '../components/CountdownTimer';

// The landing page. Leads with what the platform *is* (multi-author blog +
// letters + books), then a taste of each content type, then the author
// directory - each section links deeper into the site rather than trying
// to hold everything itself. Every fetch fails independently so one
// slow/broken endpoint doesn't blank the whole page.
export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(null);
  const [letters, setLetters] = useState(null);
  const [books, setBooks] = useState(null);
  const [authors, setAuthors] = useState(null);
  const [campaigns, setCampaigns] = useState(null);

  usePageMeta(null, "A multi-author platform for blog posts, letters, and books - writing on the things we're building and thinking about.");

  useEffect(() => {
    apiClient.get('/posts', { params: { scope: 'home' } })
      .then((res) => setPosts(res.data.data.slice(0, 4)))
      .catch(() => setPosts([]));

    apiClient.get('/letters')
      .then((res) => setLetters(res.data.data.slice(0, 2)))
      .catch(() => setLetters([]));

    apiClient.get('/books')
      .then((res) => setBooks((res.data.data ?? res.data).slice(0, 6)))
      .catch(() => setBooks([]));

    apiClient.get('/authors')
      .then((res) => setAuthors(res.data.slice(0, 4)))
      .catch(() => setAuthors([]));

    apiClient.get('/campaigns', { params: { limit: 3 } })
      .then((res) => setCampaigns(res.data))
      .catch(() => setCampaigns([]));
  }, []);

  return (
    <div className="landing">
      <section className="hero">
        <p className="kicker">A home for many voices</p>
        <h1>Posts, letters, and books - written by more than one person.</h1>
        <p className="hero-sub">
          This is a small publishing platform: a running blog, a slower-paced
          letters archive, and a shared books catalog, open to anyone who
          wants to write here alongside the site owner.
        </p>
        <div className="hero-actions">
          <Link to="/community" className="nav-cta">Read the blog</Link>
          <Link to="/register" className="text-link">Start writing here</Link>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <h2>Latest from the blog</h2>
          <Link to="/community" className="text-link">See all</Link>
        </div>

        {posts === null && <p>Loading…</p>}
        {posts?.length === 0 && <p>No posts published yet.</p>}
        {posts?.length > 0 && (
          <ul className="entries">
            {posts.map((post) => {
              const { day, month } = formatPostmark(post.published_at);
              const flag = getAuthorFlag(post.author);
              return (
                <li
                  key={post.id}
                  className="entry"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/posts/${post.slug}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/posts/${post.slug}`)}
                >
                  <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
                  <div className="entry-body">
                    <p className="kicker">{post.category ? post.category.name : 'Blog'}</p>
                    <h3>
                      <Link to={`/posts/${post.slug}`} onClick={(e) => e.stopPropagation()}>{post.title}</Link>
                    </h3>
                    <p className="post-meta author-byline">
                      <span className="author-flag" style={{ background: flag.color }} title={flag.title} />
                      By <Link to={`/authors/${post.author.id}`} onClick={(e) => e.stopPropagation()}>{post.author.name}</Link>
                    </p>
                    {post.excerpt && <p>{post.excerpt}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {campaigns === null ? null : campaigns.length > 0 && (
        <section className="landing-section spotlight-section">
          <div className="landing-section-head">
            <p className="kicker" style={{ margin: 0 }}>In the spotlight</p>
            <Link to="/campaigns" className="text-link">Discover more</Link>
          </div>
          <div className="spotlight-grid">
            {campaigns.map((c, i) => (
              <div
                key={c.id}
                className={`spotlight-card spotlight-theme-${i % 3}`}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/campaigns/${c.id}`)}
              >
                {c.image_url && <img src={c.image_url} alt="" className="spotlight-card-image" />}
                <div className="spotlight-card-body">
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <span className="post-meta">By {c.user?.name}</span>
                  <div className="spotlight-card-countdown">
                    <CountdownTimer launchDate={c.launch_date} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="spotlight-block-caption">Upcoming events</p>
        </section>
      )}

      {letters?.length > 0 && (
        <section className="landing-section">
          <div className="landing-section-head">
            <h2>From the letters archive</h2>
            <Link to="/letters" className="text-link">See all</Link>
          </div>
          <ul className="entries">
            {letters.map((letter) => {
              const { day, month } = formatPostmark(letter.published_at);
              const flag = getAuthorFlag(letter.author);
              return (
                <li
                  key={letter.id}
                  className="entry"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/letters/${letter.slug}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/letters/${letter.slug}`)}
                >
                  <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
                  <div className="entry-body">
                    <p className="kicker">Letter</p>
                    <h3><Link to={`/letters/${letter.slug}`} onClick={(e) => e.stopPropagation()}>{letter.title}</Link></h3>
                    <p className="post-meta author-byline">
                      <span className="author-flag" style={{ background: flag.color }} title={flag.title} />
                      By <Link to={`/authors/${letter.author?.id}`} onClick={(e) => e.stopPropagation()}>{letter.author?.name}</Link>
                    </p>
                    {letter.excerpt && <p>{letter.excerpt}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {books?.length > 0 && (
        <section className="landing-section">
          <div className="landing-section-head">
            <h2>From the books catalog</h2>
            <Link to="/books" className="text-link">See all</Link>
          </div>
          <div className="landing-books-grid">
            {books.map((book) => (
              <Link to={`/books/${book.slug}`} key={book.id} className="landing-book-card">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <span className="landing-book-card-fallback">{book.title.charAt(0).toUpperCase()}</span>
                )}
                <div>
                  <h3>{book.title}</h3>
                  <p className="post-meta">{book.author_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {authors?.length > 0 && (
        <section className="landing-section">
          <div className="landing-section-head">
            <h2>Who writes here</h2>
            <Link to="/portfolio" className="text-link">Meet everyone</Link>
          </div>
          <div className="author-cards">
            {authors.map((author) => (
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
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="landing-section one-pager-cta one-pager-cta-close">
        <p>Have something worth writing about?</p>
        <Link to="/register" className="nav-cta">Create an account</Link>
      </section>
    </div>
  );
}
