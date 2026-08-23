import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  draft: 'Draft (not public yet)',
  published: 'Published',
};

export default function MyPosts() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (authLoading || !user) return;
    apiClient
      .get('/my/posts')
      .then((res) => {
        setPosts(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authLoading, user]);

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to see your posts.</p>;

  return (
    <div>
      <h1>My posts</h1>
      <p>
        <Link to="/write/post">Write a new post</Link>
      </p>

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Couldn't load your posts.</p>}
      {status === 'ready' && posts.length === 0 && <p>You haven't written anything yet.</p>}

      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id} className="post-list-item">
            <h2>
              {post.status === 'published' ? (
                <Link to={`/posts/${post.slug}`}>{post.title}</Link>
              ) : (
                post.title
              )}
            </h2>
            <p className="post-meta">
              {STATUS_LABELS[post.status] ?? post.status} ·{' '}
              <Link to={`/posts/${post.slug}/edit`}>Edit</Link>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
