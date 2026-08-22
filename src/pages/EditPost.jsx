import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import PostForm from '../components/PostForm';
import { useAuth } from '../context/AuthContext';

export default function EditPost() {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get(`/posts/${slug}`)
      .then((res) => {
        setPost(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.put(`/posts/${slug}`, payload);
      navigate(`/posts/${res.data.slug}`);
    } catch {
      setError('Something went wrong saving your changes.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That post couldn't be found.</p>;
  if (!user || (user.id !== post.author_id && user.role !== 'admin')) {
    return <p>You don't have permission to edit this post.</p>;
  }

  return (
    <div>
      <h1>Edit post</h1>
      {error && <p className="form-error">{error}</p>}
      <PostForm
        initialPost={post}
        onSubmit={handleSubmit}
        submitting={submitting}
        userRole={user.role}
      />
    </div>
  );
}
