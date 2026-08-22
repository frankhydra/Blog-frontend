import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';

export default function CommunityBlogs() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');

  usePageMeta('Community', 'Posts from other writers on the platform.');

  useEffect(() => {
    apiClient
      .get('/posts', { params: { scope: 'community' } })
      .then((res) => {
        setPosts(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>Couldn't load community posts.</p>;

  return (
    <div>
      <p className="kicker">Community</p>
      <h1>Other writers on the platform</h1>

      {posts.length === 0 && <p>No community posts yet.</p>}
      <ul className="entries">
        {posts.map((post) => {
          const { day, month } = formatPostmark(post.published_at);
          return (
            <li key={post.id} className="entry">
              <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
              <div className="entry-body">
                <p className="kicker">{post.category ? post.category.name : 'Community'}</p>
                <h2>
                  <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="post-meta">
                  By <Link to={`/authors/${post.author.id}`}>{post.author.name}</Link>
                </p>
                {post.excerpt && <p>{post.excerpt}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
