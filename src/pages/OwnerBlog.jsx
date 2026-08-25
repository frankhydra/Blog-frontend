import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';

// The site owner's own writing, and only the site owner's - everyone
// else's posts live on Community Blogs instead. This is what "Blog" used
// to mean before Home became the mixed introduction page.
export default function OwnerBlog() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');

  usePageMeta("Owner's Blog", "Posts written by the site owner.");

  useEffect(() => {
    apiClient
      .get('/posts', { params: { scope: 'primary' } })
      .then((res) => {
        setPosts(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>Couldn't load these posts.</p>;

  return (
    <div>
      <p className="kicker">Owner's Blog</p>
      <h1>Written by the site owner</h1>
      <p className="post-meta">
        Just my own posts. For everyone else writing here, see{' '}
        <Link to="/community">Community Blogs</Link>.
      </p>

      {posts.length === 0 && <p>Nothing published yet.</p>}
      <ul className="entries">
        {posts.map((post) => {
          const { day, month } = formatPostmark(post.published_at);
          return (
            <li key={post.id} className="entry">
              <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
              <div className="entry-body">
                <p className="kicker">{post.category ? post.category.name : 'Blog'}</p>
                <h2>
                  <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                </h2>
                {post.excerpt && <p>{post.excerpt}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
