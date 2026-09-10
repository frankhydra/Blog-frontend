import { useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import PortfolioOnePager from '../components/PortfolioOnePager';
import SkeletonGrid from '../components/SkeletonGrid';

const BLANK = { title: '', category: '', description: '', image_url: '', link: '', sort_order: 0 };

// Icons - same minimal line-icon style used across Settings.
const ICON_LAYERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8 12 3.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M3.5 12l8.5 4.5 8.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M3.5 16l8.5 4.5 8.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const ICON_PLUS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ICON_UPLOAD = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

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

  const formCardRef = useRef(null);
  const titleInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');

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

  function focusForm() {
    // Give the form a moment to render/reset before scrolling to it, so
    // the scroll lands on the right spot.
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      titleInputRef.current?.focus();
    }, 0);
  }

  function openAddForm() {
    setEditingId(null);
    setForm(BLANK);
    setCoverUploadError('');
    focusForm();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category ?? '',
      description: item.description ?? '',
      image_url: item.image_url ?? '',
      link: item.link ?? '',
      sort_order: item.sort_order,
    });
    setCoverUploadError('');
    focusForm();
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(BLANK);
    setCoverUploadError('');
  }

  async function handleCoverFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploadError('');
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      const res = await apiClient.post('/uploads', formData);
      setForm((f) => ({ ...f, image_url: res.data.url }));
    } catch {
      setCoverUploadError('Upload failed - try a JPG, PNG, or WebP under 5MB.');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e, publishNow) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        category: form.category || null,
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
          person={{
            id: user.id,
            name: user.name,
            bio: user.bio,
            avatar: user.avatar,
            role: user.role,
            headline: user.headline,
            availability: user.availability,
            location: user.location,
            website: user.website,
            skills: user.skills,
            social_links: user.social_links,
          }}
          items={items}
          previewMode
        />
      </div>
    );
  }

  const HeadingTag = embedded ? 'h2' : 'h1';
  const publishedCount = items.filter((i) => i.status === 'published').length;
  const likesTotal = items.reduce((sum, i) => sum + (i.likes_count ?? 0), 0);

  return (
    <div className="portfolio-manager">
      <section className="portfolio-manager-head">
        <div className="portfolio-manager-head-text">
          <p className="portfolio-manager-eyebrow">
            <span className="portfolio-manager-eyebrow-icon">{ICON_LAYERS}</span>
            Portfolio showcase manager
          </p>
          <HeadingTag>Manage projects & gallery</HeadingTag>
          <p className="post-meta">
            Add, edit, reorder, or feature work items shown to recruiters, clients, and visitors.
            Published items show on your author profile; drafts stay private until you publish them.
          </p>
        </div>
        <div className="portfolio-manager-head-actions">
          <button type="button" onClick={openAddForm} className="portfolio-add-button">
            <span className="portfolio-add-button-icon">{ICON_PLUS}</span>
            Add new project
          </button>
          <button type="button" onClick={() => setView('preview')} className="link-button">
            Preview
          </button>
        </div>
      </section>

      <section ref={formCardRef} className="settings-card portfolio-form-card">
        <h2>{editingId ? 'Edit project' : 'Add project'}</h2>

        <form onSubmit={(e) => handleSubmit(e, editingId ? null : false)}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            ref={titleInputRef}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <label htmlFor="category">Category</label>
          <input
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Web, Design, Writing"
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />

          <label htmlFor="image_url">Cover image</label>
          <div className="portfolio-cover-row">
            {form.image_url && (
              <img src={form.image_url} alt="" className="portfolio-cover-preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <div className="portfolio-cover-inputs">
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverFileChange}
                hidden
              />
              <div className="portfolio-cover-buttons">
                <button
                  type="button"
                  className="avatar-upload-button"
                  onClick={() => coverFileInputRef.current?.click()}
                  disabled={coverUploading}
                >
                  <span className="avatar-upload-button-icon">{ICON_UPLOAD}</span>
                  {coverUploading ? 'Uploading…' : 'Upload image'}
                </button>
              </div>
              <input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="or paste an image URL"
              />
              {coverUploadError && <p className="form-error">{coverUploadError}</p>}
              <p className="settings-card-hint">JPG, PNG, or WebP. Max 5MB.</p>
            </div>
          </div>

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

          <div className="portfolio-form-actions">
            {editingId ? (
              <button type="submit" className="settings-save-button" disabled={submitting}>Save changes</button>
            ) : (
              <>
                <button type="submit" disabled={submitting} onClick={(e) => handleSubmit(e, false)} className="link-button">
                  Save as draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={(e) => handleSubmit(e, true)}
                  className="settings-save-button"
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
      </section>

      {items.length > 0 && (
        <div className="portfolio-stats-grid">
          <div className="portfolio-stat-card">
            <span className="portfolio-stat-num">{items.length}</span>
            <span className="portfolio-stat-label">Total projects</span>
          </div>
          <div className="portfolio-stat-card">
            <span className="portfolio-stat-num portfolio-stat-num-forest">{publishedCount}</span>
            <span className="portfolio-stat-label">Live published</span>
          </div>
          <div className="portfolio-stat-card">
            <span className="portfolio-stat-num portfolio-stat-num-wax">{likesTotal}</span>
            <span className="portfolio-stat-label">Public applause</span>
          </div>
        </div>
      )}

      {status === 'loading' && <SkeletonGrid variant="project" count={3} />}
      {status === 'ready' && items.length === 0 && (
        <p className="post-meta">Nothing added yet - use "Add new project" to get your first item in.</p>
      )}

      {items.length > 0 && (
        <div className="portfolio-grid">
          {items.map((item) => (
            <article key={item.id} className="portfolio-project-card">
              <div className="portfolio-project-image-wrap">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="portfolio-project-image" loading="lazy" />
                ) : (
                  <div className="portfolio-project-image-placeholder">No cover image</div>
                )}
                {item.category && <span className="portfolio-project-tag">{item.category}</span>}
              </div>
              <div className="portfolio-project-body">
                <div className="portfolio-project-title-row">
                  <h3>{item.title}</h3>
                  <span className={`status-pill ${item.status === 'published' ? 'status-pill-published' : 'status-pill-draft'}`}>
                    {item.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                {item.description && <p className="portfolio-project-desc">{item.description}</p>}
                {item.likes_count > 0 && <p className="post-meta">{item.likes_count} likes</p>}

                <div className="portfolio-project-actions">
                  <button type="button" onClick={() => toggleStatus(item)} className="link-button">
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <div className="portfolio-project-actions-right">
                    <button type="button" onClick={() => handleDelete(item)} className="portfolio-delete-button">
                      Delete
                    </button>
                    <button type="button" onClick={() => startEdit(item)} className="portfolio-edit-button">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
