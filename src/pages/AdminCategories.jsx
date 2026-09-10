import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ICON_TAG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 4H6a2 2 0 0 0-2 2v5.5a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l5.5-5.5a2 2 0 0 0 0-2.8l-8-8A2 2 0 0 0 11.5 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="8.2" cy="8.2" r="1.4" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

// Categories are used to organize posts. Deleting one doesn't touch any
// posts that used it - category_id on posts is nullable with an
// on-delete-set-null constraint at the database level, so a deleted
// category's posts just become uncategorized rather than being blocked
// or removed. The post count shown per row is just so an admin knows the
// impact before deleting, not a hard guardrail.
export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;
    loadCategories();
  }, [authLoading, user]);

  function loadCategories() {
    setStatus('loading');
    apiClient
      .get('/categories')
      .then((res) => {
        setCategories(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/categories', { name });
      setCategories((prev) => [...prev, { ...res.data, posts_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add that category.');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function handleRename(category) {
    const name = editingName.trim();
    if (!name || name === category.name) {
      cancelEdit();
      return;
    }
    setSavingId(category.id);
    setError('');
    try {
      const res = await apiClient.put(`/categories/${category.id}`, { name });
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, ...res.data } : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not rename that category.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(category) {
    const warning = category.posts_count > 0
      ? `Delete "${category.name}"? ${category.posts_count} post${category.posts_count === 1 ? '' : 's'} using it will become uncategorized, not deleted.`
      : `Delete "${category.name}"?`;
    if (!confirm(warning)) return;

    setSavingId(category.id);
    setError('');
    try {
      await apiClient.delete(`/categories/${category.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete that category.');
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') return <p>You don't have access to this page.</p>;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_TAG}</span>
        <div>
          <p className="settings-card-eyebrow">Admin</p>
          <h1>Manage categories</h1>
          <p className="post-meta">
            Categories organize posts across the blog. Deleting one doesn't delete
            its posts - they just become uncategorized.
          </p>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="settings-card">
        <h2>Add a category</h2>
        <form onSubmit={handleAdd} className="category-add-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Web, Design, Writing"
            maxLength={255}
          />
          <button type="submit" className="settings-save-button" disabled={submitting || !newName.trim()}>
            {submitting ? 'Adding…' : '+ Add category'}
          </button>
        </form>
      </section>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load categories.</p>}
      {status === 'ready' && categories.length === 0 && (
        <p className="empty-state">No categories yet - add your first one above.</p>
      )}

      {categories.length > 0 && (
        <section className="settings-card admin-table-card">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Posts</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    {editingId === category.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(category);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        maxLength={255}
                        className="category-rename-input"
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td>{category.posts_count}</td>
                  <td className="category-row-actions">
                    {editingId === category.id ? (
                      <>
                        <button
                          type="button"
                          className="queue-approve-button"
                          onClick={() => handleRename(category)}
                          disabled={savingId === category.id}
                        >
                          Save
                        </button>
                        <button type="button" className="link-button" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="portfolio-edit-button" onClick={() => startEdit(category)}>
                          Rename
                        </button>
                        <button
                          type="button"
                          className="portfolio-delete-button"
                          onClick={() => handleDelete(category)}
                          disabled={savingId === category.id}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
