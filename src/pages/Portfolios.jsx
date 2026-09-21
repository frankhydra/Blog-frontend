import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import SkeletonGrid from '../components/SkeletonGrid';
import SearchBar from '../components/SearchBar';

// The public Portfolio page - a community directory of every blogger on
// the platform, ranked by how often they actually post, paginated rather
// than a single person's one-pager dominating the top of the page. Click
// through to /authors/:id for someone's full profile/one-pager.
//
// Q3 follow-up - search added: PortfolioController::directory() now
// accepts ?q=, matched against name/bio. Typing a new search term resets
// back to page 1, same as any filter changing the result set out from
// under an existing page number.
export default function Portfolios() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta('Portfolio', 'Everyone who has claimed a page on Nchukwi, ranked by how often they ship.');

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get('/portfolios', { params: { page, ...(query ? { q: query } : {}) } })
      .then((res) => {
        setPageData(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, query]);

  function handleSearch(term) {
    setPage(1);
    setQuery(term);
  }

  if (status === 'error') return <p>Couldn't load this page.</p>;

  const people = pageData?.data ?? [];
  const currentPage = pageData?.current_page ?? 1;
  const lastPage = pageData?.last_page ?? 1;

  return (
    <div className="about-page">
      <p className="kicker">More voices</p>
      <h1 style={{ marginTop: 0 }}>Everyone who's claimed a page here</h1>
      <p className="post-meta">
        Fellow writers publishing here — click through for their full profile and portfolio.
      </p>

      <SearchBar placeholder="Search by name or bio…" onSearch={handleSearch} />

      {status === 'loading' && <SkeletonGrid variant="author" count={6} />}

      {status === 'ready' && people.length === 0 && (
        <p className="empty-state">
          {query ? `Nobody matches "${query}".` : "Nobody's claimed this yet. Could be you."}
        </p>
      )}

      {status === 'ready' && people.length > 0 && (
        <div className="author-cards">
          {people.map((author) => (
            <Link to={`/authors/${author.id}`} key={author.id} className="author-card">
              <div className="author-card-head">
                {author.avatar ? (
                  <img src={author.avatar} alt={author.name} className="author-card-avatar" loading="lazy" />
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
                      <img key={item.id} src={item.image_url} alt={item.title} loading="lazy" />
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
      )}

      {lastPage > 1 && (
        <nav className="pagination-row" aria-label="Bloggers pages">
          <button
            type="button"
            className="pagination-button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            &larr; Previous
          </button>
          <span className="pagination-status">Page {currentPage} of {lastPage}</span>
          <button
            type="button"
            className="pagination-button"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={currentPage >= lastPage}
          >
            Next &rarr;
          </button>
        </nav>
      )}

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
    </div>
  );
}
