import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import LetterForm from '../components/LetterForm';
import { useAuth } from '../context/AuthContext';

export default function NewLetter() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/letters', payload);
      navigate(`/letters/${res.data.slug}`);
    } catch {
      setError('Something went wrong saving your letter.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user || user.role !== 'admin') return <p>Only the site admin can write letters.</p>;

  return (
    <div>
      <h1>Write a new letter</h1>
      {error && <p className="form-error">{error}</p>}
      <LetterForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
