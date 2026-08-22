import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import BookForm from '../components/BookForm';
import { useAuth } from '../context/AuthContext';

export default function EditBook() {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [status, setStatus] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get(`/books/${slug}`)
      .then((res) => {
        setBook(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.put(`/books/${slug}`, payload);
      navigate(`/books/${res.data.slug}`);
    } catch {
      setError('Something went wrong saving your changes.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That book couldn't be found.</p>;
  if (!user || (user.id !== book.owner_id && user.role !== 'admin')) {
    return <p>You don't have permission to edit this book.</p>;
  }

  return (
    <div>
      <h1>Edit book</h1>
      {error && <p className="form-error">{error}</p>}
      <BookForm initialBook={book} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
