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
  // A contributor's own already-published post (an admin approved it
  // earlier) shouldn't be resubmittable or re-privatized just by editing
  // it - only the status the form actually understands as "this contributor
  // is still working on getting this approved".
  const alreadyPublished = !canPublish && initialPost?.status === 'published';
  const alreadySubmitted = Boolean(initialPost?.submitted_at);

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

  function submitForm(submitForReview = false) {
    const payload = {
      title,
      excerpt: excerpt || null,
      body,
      category_id: categoryId || null,
      tags,
    };

    if (canPublish) {
      // Author/admin: unchanged - the status dropdown says exactly what
      // they want, so send it as-is.
      payload.status = status;
    } else if (!alreadyPublished) {
      // Contributor, still pre-publication: never send `status` at all -
      // the backend already forces it to 'draft' either way, and leaving
      // it out means an edit to an already-published post (see
      // alreadyPublished below) can't accidentally get sent here either.
      // submit_for_review is the real signal: whether this save should
      // enter the admin's review queue or stay a private work-in-progress.
      payload.submit_for_review = submitForReview;
    }
    // else: contributor editing an already-published post - no status,
    // no submit_for_review, just the content fields. It's already live;
    // this is a straight content fix, not a review-workflow action.

    onSubmit(payload);
  }

  // Enter-to-submit / the single admin-author button both fall back to
  // "don't submit for review" - the contributor-only second button below
  // is the only path that ever passes submitForReview=true.
  function handleFormSubmit(e) {
    e.preventDefault();
    submitForm(false);
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
        <form onSubmit={handleFormSubmit} className="post-form">
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
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save post'}
              </button>
            </>
          ) : alreadyPublished ? (
            <>
              <p className="post-meta">
                This post is already published. Changes save straight to the
                live version - there's no review step for an edit.
              </p>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <>
              <p className="post-meta">
                {alreadySubmitted
                  ? 'This post is submitted and waiting on the site admin to review it. Save draft keeps editing privately without re-notifying them; the other button re-submits your latest changes.'
                  : "Save draft keeps this private while you work on it. Submit for review sends it to the site admin - it still won't be public until they approve it."}
              </p>
              <div className="post-form-actions">
                <button
                  type="button"
                  onClick={() => submitForm(false)}
                  disabled={submitting}
                  className="queue-secondary-button"
                >
                  {submitting ? 'Saving…' : 'Save draft'}
                </button>
                <button
                  type="button"
                  onClick={() => submitForm(true)}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : alreadySubmitted ? 'Resubmit for review' : 'Submit for review'}
                </button>
              </div>
            </>
          )}
        </form>
      ) : (
        <ContentPreview kind="post" title={title} excerpt={excerpt} body={body} meta={categoryName} />
      )}
    </div>
  );
}
