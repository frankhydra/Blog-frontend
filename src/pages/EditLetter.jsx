import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import LetterForm from '../components/LetterForm';
import { useAuth } from '../context/AuthContext';

export default function EditLetter() {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [status, setStatus] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get(`/letters/${slug}`)
      .then((res) => {
        setLetter(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.put(`/letters/${slug}`, payload);
      navigate(`/letters/${res.data.slug}`);
    } catch {
      setError('Something went wrong saving your changes.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That letter couldn't be found.</p>;
  if (!user || user.role !== 'admin') return <p>Only the site admin can edit letters.</p>;

  return (
    <div>
      <h1>Edit letter</h1>
      {error && <p className="form-error">{error}</p>}
      <LetterForm initialLetter={letter} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
