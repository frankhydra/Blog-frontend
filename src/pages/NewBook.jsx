import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import BookForm from '../components/BookForm';
import { useAuth } from '../context/AuthContext';

export default function NewBook() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/books', payload);
      navigate(`/books/${res.data.slug}`);
    } catch {
      setError('Something went wrong saving that book.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to add a book.</p>;

  return (
    <div>
      <h1>Add a book</h1>
      {error && <p className="form-error">{error}</p>}
      <BookForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
