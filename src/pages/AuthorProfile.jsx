import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';

export default function AuthorProfile() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta(author?.name, author?.bio);

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get(`/authors/${id}`)
      .then((res) => {
        setAuthor(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That author couldn't be found.</p>;

  return (
    <div className="author-profile">
      <Link to="/community" className="back-link">&larr; Back to community blogs</Link>

      <p className="kicker">{author.role === 'admin' ? 'Site owner' : 'Author'}</p>
      <h1>{author.name}</h1>
      {author.bio && <p className="author-bio">{author.bio}</p>}

      <h2 style={{ marginTop: '2.5rem' }}>Posts</h2>
      {author.posts.length === 0 && <p>No published posts yet.</p>}
      <ul className="entries">
        {author.posts.map((post) => {
          const { day, month } = formatPostmark(post.published_at);
          return (
            <li key={post.id} className="entry">
              <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
              <div className="entry-body">
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
