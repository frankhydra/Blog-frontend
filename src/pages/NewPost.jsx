import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import PostForm from '../components/PostForm';
import { useAuth } from '../context/AuthContext';

export default function NewPost() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/posts', payload);
      navigate(`/posts/${res.data.slug}`);
    } catch {
      setError('Something went wrong saving your post.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to write a post.</p>;

  return (
    <div>
      <h1>Write a new post</h1>
      {error && <p className="form-error">{error}</p>}
      <PostForm onSubmit={handleSubmit} submitting={submitting} userRole={user.role} />
    </div>
  );
}
