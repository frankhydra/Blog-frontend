import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import PortfolioOnePager from '../components/PortfolioOnePager';

const BLANK = { title: '', description: '', image_url: '', link: '', sort_order: 0 };

// Every logged-in user manages their own portfolio here. New items start
// as drafts - nothing shows on the public /portfolio page or your author
// profile until you explicitly publish it. The Preview tab renders your
// items through the exact same component the public page uses, so what
// you see is what visitors will eventually see once published.
export default function MyPortfolio({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('editor'); // 'editor' | 'preview'

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

  async function handleSubmit(e, publishNow) {
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
        if (publishNow !== null) payload.status = publishNow ? 'published' : 'draft';
        await apiClient.put(`/portfolio/${editingId}`, payload);
      } else {
        payload.status = publishNow ? 'published' : 'draft';
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

  async function toggleStatus(item) {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    try {
      await apiClient.put(`/portfolio/${item.id}`, { status: nextStatus });
    } catch {
      load(); // roll back to the server's version if the update failed
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await apiClient.delete(`/portfolio/${item.id}`);
    load();
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to manage your portfolio.</p>;

  if (view === 'preview') {
    return (
      <div>
        <div className="one-pager-preview-toolbar">
          <button type="button" onClick={() => setView('editor')} className="link-button">
            &larr; Back to editor
          </button>
        </div>
        <PortfolioOnePager
          person={{ name: user.name, bio: user.bio, avatar: user.avatar, role: user.role }}
          items={items}
          previewMode
        />
      </div>
    );
  }

  return (
    <div>
      {!embedded && (
        <div className="my-portfolio-head">
          <div>
            <h1>Your portfolio</h1>
            <p className="post-meta">
              Published items show on your author profile, and at the top of the
              Portfolio page when you're the featured writer. Drafts stay
              private to you until you publish them.
            </p>
          </div>
          <button type="button" onClick={() => setView('preview')} className="nav-cta">
            Preview
          </button>
        </div>
      )}
      {embedded && (
        <div className="my-portfolio-head">
          <p className="post-meta">
            Published items show on your author profile, and at the top of the
            Portfolio page when you're the featured writer. Drafts stay
            private to you until you publish them.
          </p>
          <button type="button" onClick={() => setView('preview')} className="nav-cta">
            Preview
          </button>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, editingId ? null : false)} className="post-form">
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

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {editingId ? (
            <button type="submit" disabled={submitting}>Save changes</button>
          ) : (
            <>
              <button type="submit" disabled={submitting} onClick={(e) => handleSubmit(e, false)}>
                Save as draft
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, true)}
                className="nav-cta"
              >
                Save & publish
              </button>
            </>
          )}
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
            <strong>{item.title}</strong>{' '}
            <span className={`status-pill ${item.status === 'published' ? 'status-pill-published' : 'status-pill-draft'}`}>
              {item.status === 'published' ? 'Published' : 'Draft'}
            </span>
            <div className="moderation-actions">
              <button onClick={() => toggleStatus(item)}>
                {item.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => startEdit(item)}>Edit</button>
              <button onClick={() => handleDelete(item)} className="reject-button">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
