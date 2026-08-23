import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const BLANK = { title: '', description: '', image_url: '', link: '', sort_order: 0 };

// Every logged-in user manages their own portfolio here - it always loads
// and writes to "my" items only, never anyone else's. The site owner's
// items are what show by default on the About page; everyone else's items
// show on their own /authors/:id profile, linked from the About page's
// "Other bloggers" section.
export default function MyPortfolio() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    load();
  }, [authLoading, user]);

  function load() {
    setStatus('loading');
    apiClient
      .get('/portfolio/mine')
      .then((res) => {
        setItems(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? '',
      image_url: item.image_url ?? '',
      link: item.link ?? '',
      sort_order: item.sort_order,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(BLANK);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        description: form.description || null,
        image_url: form.image_url || null,
        link: form.link || null,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingId) {
        await apiClient.put(`/portfolio/${editingId}`, payload);
      } else {
        await apiClient.post('/portfolio', payload);
      }

      cancelEdit();
      load();
    } catch {
      // Leave the form as-is so the user can retry
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await apiClient.delete(`/portfolio/${item.id}`);
    load();
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to manage your portfolio.</p>;

  return (
    <div>
      <h1>Your portfolio</h1>
      <p className="post-meta">
        These show on your profile page, and on the About page if you're the site owner.
      </p>

      <form onSubmit={handleSubmit} className="post-form">
        <h2>{editingId ? 'Edit item' : 'Add item'}</h2>

        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />

        <label htmlFor="image_url">Image URL</label>
        <input
          id="image_url"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />

        <label htmlFor="link">Link (optional)</label>
        <input
          id="link"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />

        <label htmlFor="sort_order">Sort order (lower shows first)</label>
        <input
          id="sort_order"
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
        />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={submitting}>
            {editingId ? 'Save changes' : 'Add item'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="link-button">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>Your items</h2>
      {status === 'loading' && <p>Loading…</p>}
      {status === 'ready' && items.length === 0 && <p>Nothing added yet.</p>}

      <ul className="moderation-list">
        {items.map((item) => (
          <li key={item.id} className="moderation-item">
            <strong>{item.title}</strong> <span className="post-meta">(order: {item.sort_order})</span>
            <div className="moderation-actions">
              <button onClick={() => startEdit(item)}>Edit</button>
              <button onClick={() => handleDelete(item)} className="reject-button">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
