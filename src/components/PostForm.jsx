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
  const [activeTab, setActiveTab] = useState('author'); // 'author' | 'reader'

  const canPublish = userRole === 'admin' || userRole === 'author';

  useEffect(() => {
    apiClient.get('/categories').then((res) => setCategories(res.data));
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      title,
      excerpt: excerpt || null,
      body,
      category_id: categoryId || null,
      status,
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
