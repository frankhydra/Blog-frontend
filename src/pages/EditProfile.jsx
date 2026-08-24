import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EditProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.patch('/profile', { name, bio: bio || null, avatar: avatar || null });
      navigate('/my-portfolio');
    } catch {
      setError('Something went wrong saving your profile.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to edit your profile.</p>;

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1>Edit your profile</h1>

      <label htmlFor="name">Name</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

      <label htmlFor="avatar">Avatar image URL (optional)</label>
      <input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />

      <label htmlFor="bio">Bio</label>
      <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
