import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import RichTextEditor from './RichTextEditor';
import ContentPreview from './ContentPreview';

// props:
//   initialPost - pass an existing post when editing, omit when creating
//   onSubmit(payload) - called with the form data when submitted
//   submitting - bool, disables the button and swaps its label
//   userRole - the logged-in user's role, controls whether "publish" is offered
export default function PostForm({ initialPost, onSubmit, submitting, userRole }) {
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '');
  const [body, setBody] = useState(initialPost?.body ?? '');
  const [categoryId, setCategoryId] = useState(initialPost?.category_id ?? '');
  const [status, setStatus] = useState(initialPost?.status ?? 'draft');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState(initialPost?.tags?.map((t) => t.name) ?? []);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('author'); // 'author' | 'reader'

  const canPublish = userRole === 'admin' || userRole === 'author';

  useEffect(() => {
    apiClient.get('/categories').then((res) => setCategories(res.data));
  }, []);

  function addTag() {
    const value = tagInput.trim();
    if (value && tags.length < 10 && !tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTags([...tags, value]);
    }
    setTagInput('');
  }

  function removeTag(tag) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      title,
      excerpt: excerpt || null,
      body,
      category_id: categoryId || null,
      status,
      tags,
    });
  }

  const categoryName = categories.find((c) => String(c.id) === String(categoryId))?.name;

  return (
    <div className="composer">
      <div className="composer-tabs">
        <button
          type="button"
          className={activeTab === 'author' ? 'active' : ''}
          onClick={() => setActiveTab('author')}
        >
          ✏️ Author view (rich editor)
        </button>
        <button
          type="button"
          className={activeTab === 'reader' ? 'active' : ''}
          onClick={() => setActiveTab('reader')}
        >
          👁️ Reader view (public preview)
        </button>
      </div>

      {activeTab === 'author' ? (
        <form onSubmit={handleSubmit} className="post-form">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="excerpt">Excerpt (short summary, optional)</label>
          <input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={500}
          />

          <label htmlFor="category">Category</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label htmlFor="tag-input">Tags (up to 10)</label>
          <div className="skill-input-row">
            <input
              id="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Type a tag and press Enter…"
            />
            <button type="button" onClick={addTag} className="skill-add-button">+ Add</button>
          </div>
          {tags.length > 0 && (
            <div className="skill-chip-row">
              {tags.map((tag) => (
                <span key={tag} className="skill-chip skill-chip-removable">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>&times;</button>
                </span>
              ))}
            </div>
          )}

          <label>Body</label>
          <RichTextEditor content={body} onChange={setBody} />

          {canPublish ? (
            <>
              <label htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Save as draft</option>
                <option value="published">Publish now</option>
              </select>
            </>
          ) : (
            <p className="post-meta">
              Your posts are saved as drafts and reviewed by the site admin before
              they're published.
            </p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save post'}
          </button>
        </form>
      ) : (
        <ContentPreview kind="post" title={title} excerpt={excerpt} body={body} meta={categoryName} />
      )}
    </div>
  );
}
