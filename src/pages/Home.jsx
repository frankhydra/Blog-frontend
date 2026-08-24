import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';

// The landing page. Leads with what the platform *is* (multi-author blog +
// letters + books), then a campaign spotlight if anything's been approved,
// then a taste of each content type, then the author directory - each
// section links deeper into the site rather than trying to hold everything
// itself. Every fetch fails independently so one slow/broken endpoint
// doesn't blank the whole page.
export default function Home() {
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
      .then((res) => setBooks((res.data.data ?? res.data).slice(0, 3)))
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
          <Link to="/register" className="text-link">Start writing here &rarr;</Link>
        </div>
      </section>

      {campaigns === null ? null : campaigns.length > 0 && (
        <section className="landing-section spotlight-section">
          <p className="kicker">In the spotlight</p>
          <div className="spotlight-grid">
            {campaigns.map((c) => (
              <a
                key={c.id}
                href={c.link_url || (c.book ? `/books/${c.book.slug}` : '#')}
                className="spotlight-card"
                target={c.link_url ? '_blank' : undefined}
                rel={c.link_url ? 'noreferrer' : undefined}
              >
                {c.image_url && <img src={c.image_url} alt="" className="spotlight-card-image" />}
                <div className="spotlight-card-body">
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <span className="post-meta">
                    By {c.user?.name}
                    {c.launch_date && ` · ${new Date(c.launch_date).toLocaleDateString()}`}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="landing-section">
        <div className="landing-section-head">
          <h2>Latest from the blog</h2>
          <Link to="/community" className="text-link">See all &rarr;</Link>
        </div>

        {posts === null && <p>Loading…</p>}
        {posts?.length === 0 && <p>No posts published yet.</p>}
        {posts?.length > 0 && (
          <ul className="entries">
            {posts.map((post) => {
              const { day, month } = formatPostmark(post.published_at);
              const isCommunityPost = post.author?.role !== 'admin';
              return (
                <li key={post.id} className="entry">
                  <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
                  <div className="entry-body">
                    <p className="kicker">
                      {isCommunityPost && <span className="kicker-badge">Community</span>}
                      {post.category ? post.category.name : 'Blog'}
                    </p>
                    <h3>
                      <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="post-meta">
                      By <Link to={`/authors/${post.author.id}`}>{post.author.name}</Link>
                    </p>
                    {post.excerpt && <p>{post.excerpt}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {letters?.length > 0 && (
        <section className="landing-section">
          <div className="landing-section-head">
            <h2>From the letters archive</h2>
            <Link to="/letters" className="text-link">See all &rarr;</Link>
          </div>
          <ul className="entries">
            {letters.map((letter) => {
              const { day, month } = formatPostmark(letter.published_at);
              return (
                <li key={letter.id} className="entry">
                  <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
                  <div className="entry-body">
                    <h3><Link to={`/letters/${letter.slug}`}>{letter.title}</Link></h3>
                    <p className="post-meta">By {letter.author?.name}</p>
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
            <Link to="/books" className="text-link">See all &rarr;</Link>
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
            <Link to="/portfolio" className="text-link">Meet everyone &rarr;</Link>
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
