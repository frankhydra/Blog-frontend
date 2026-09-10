import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import Loading from '../components/Loading';

// Every tag currently attached to at least one published post, most-used
// first. Tags with zero published posts don't show here - see
// TagController::index for why.
export default function AllTags() {
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState('loading');

  usePageMeta('Tags', 'Browse posts by tag.');

  useEffect(() => {
    apiClient
      .get('/tags')
      .then((res) => {
        setTags(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <Loading fullPage />;
  if (status === 'error') return <p>Couldn't load tags.</p>;

  return (
    <div>
      <p className="kicker">Browse</p>
      <h1>Tags</h1>

      {tags.length === 0 && <p className="empty-state">No tagged posts yet.</p>}

      {tags.length > 0 && (
        <div className="tag-browse-list">
          {tags.map((tag) => (
            <Link key={tag.id} to={`/tags/${tag.slug}`} className="skill-chip post-tag-chip">
              {tag.name} <span className="post-meta">({tag.posts_count})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
