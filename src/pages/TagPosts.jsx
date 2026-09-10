import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';
import { getAuthorFlag } from '../utils/authorFlag';
import SkeletonGrid from '../components/SkeletonGrid';

// Every published post carrying a given tag - reached by clicking a tag
// chip on a post, or from the "browse all tags" list on /tags. Reuses
// the exact same .entries/.entry list markup as CommunityBlogs so a
// filtered view looks like a natural subset of that page, not a
// different page style.
export default function TagPosts() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');

  usePageMeta(`#${slug}`, `Posts tagged "${slug}".`);

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get('/posts', { params: { tag: slug } })
      .then((res) => {
        setPosts(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (status === 'error') return <p>Couldn't load these posts.</p>;

  return (
    <div>
      <Link to="/tags" className="back-link">&larr; All tags</Link>
      <p className="kicker">Tagged</p>
      <h1>#{slug}</h1>

      {status === 'loading' && <SkeletonGrid variant="entry" count={4} />}
      {status === 'ready' && posts.length === 0 && <p className="empty-state">No published posts with this tag yet.</p>}
      {status === 'ready' && (
        <ul className="entries">
          {posts.map((post) => {
          const { day, month } = formatPostmark(post.published_at);
          const flag = getAuthorFlag(post.author);
          return (
            <li key={post.id} className="entry">
              <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
              <div className="entry-body">
                <p className="kicker">{post.category ? post.category.name : 'Blog'}</p>
                <h2>
                  <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="post-meta author-byline">
                  <span className="author-flag" style={{ background: flag.color }} title={flag.title} />
                  By <Link to={`/authors/${post.author.id}`}>{post.author.name}</Link>
                </p>
                {post.excerpt && <p>{post.excerpt}</p>}
              </div>
            </li>
          );
        })}
        </ul>
      )}
    </div>
  );
}
