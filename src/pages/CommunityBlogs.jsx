import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';
import { getAuthorFlag } from '../utils/authorFlag';

// Every post from everyone writing here - the owner, authors, and
// contributors alike, all in one shared feed. Each post carries a small
// color flag next to the byline instead of an "Owner"/"Community" label,
// so identity is personal rather than a two-tier split.
export default function CommunityBlogs() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');

  usePageMeta('Community Blogs', 'Every post from everyone writing here, all in one shared feed.');

  useEffect(() => {
    apiClient
      .get('/posts')
      .then((res) => {
        setPosts(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>Couldn't load posts.</p>;

  return (
    <div>
      <p className="kicker">Community Blogs</p>
      <h1>Everyone writing on this platform</h1>

      {posts.length === 0 && <p>No posts published yet.</p>}
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
    </div>
  );
}
