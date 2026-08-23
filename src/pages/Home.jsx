import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  usePageMeta(null, "Franklin Nchukwi's personal blog - writing on the things I'm building and thinking about.");

  useEffect(() => {
    // scope=home shows your own posts, but blends in community posts once
    // you've gone 24h without publishing - see PostController@index for the
    // actual rule. Each post still carries its real author either way, so
    // community posts get badged below rather than looking like yours.
    apiClient
      .get('/posts', { params: { scope: 'home' } })
      .then((res) => {
        setPosts(res.data.data); // Laravel's paginator nests results in .data
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <p>Loading posts…</p>;
  if (status === 'error') return <p>Couldn't reach the API. Is `php artisan serve` running?</p>;
  if (posts.length === 0) return <p>No posts published yet — write your first one!</p>;

  return (
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
  );
}
