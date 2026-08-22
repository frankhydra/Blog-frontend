import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import ContentPreview from './ContentPreview';

export default function LetterForm({ initialLetter, onSubmit, submitting }) {
  const [title, setTitle] = useState(initialLetter?.title ?? '');
  const [excerpt, setExcerpt] = useState(initialLetter?.excerpt ?? '');
  const [body, setBody] = useState(initialLetter?.body ?? '');
  const [status, setStatus] = useState(initialLetter?.status ?? 'draft');
  const [activeTab, setActiveTab] = useState('author'); // 'author' | 'reader'

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ title, excerpt: excerpt || null, body, status });
  }

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

          <label>Letter</label>
          <RichTextEditor content={body} onChange={setBody} />

          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Save as draft</option>
            <option value="published">Publish now</option>
          </select>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save letter'}
          </button>
        </form>
      ) : (
        <ContentPreview kind="letter" title={title} excerpt={excerpt} body={body} />
      )}
    </div>
  );
}
