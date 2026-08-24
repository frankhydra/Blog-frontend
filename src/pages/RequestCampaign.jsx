import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

const BLANK = { title: '', description: '', link_url: '', image_url: '', launch_date: '', book_id: '' };

const STATUS_LABEL = {
  pending: 'Awaiting review',
  approved: 'Live on the home page',
  rejected: 'Not approved',
};

// Any logged-in user can ask for a spot in the home page campaign spotlight
// - a book launch, an event, anything worth pushing to the front of the
// site. Requests start pending and only go public once an admin approves
// them from /admin/campaigns.
export default function RequestCampaign() {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  usePageMeta('Request a campaign', 'Ask to have a book launch or announcement featured on the home page.');

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    load();
    // Books aren't scoped to "mine" by the API, so pull a page and filter
    // client-side to the ones this user owns, for the optional book picker.
    apiClient
      .get('/books')
      .then((res) => setMyBooks((res.data.data ?? res.data).filter((b) => b.owner?.id === user.id)))
      .catch(() => setMyBooks([]));
  }, [authLoading, user]);

  function load() {
    setStatus('loading');
    apiClient
      .get('/my/campaigns')
      .then((res) => {
        setCampaigns(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  function handleBookPick(bookId) {
    const book = myBooks.find((b) => String(b.id) === String(bookId));
    setForm((f) => ({
      ...f,
      book_id: bookId,
      // Prefill from the book, but leave it editable - the campaign pitch
      // doesn't have to read exactly like the catalog entry.
      title: bookId && !f.title ? `${book.title} is out now` : f.title,
      link_url: bookId && !f.link_url ? (book.purchase_url || '') : f.link_url,
      image_url: bookId && !f.image_url ? (book.cover_url || '') : f.image_url,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        link_url: form.link_url || null,
        image_url: form.image_url || null,
        launch_date: form.launch_date || null,
        book_id: form.book_id || null,
      };
      await apiClient.post('/campaigns', payload);
      setForm(BLANK);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong submitting your request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(campaign) {
    if (!confirm(`Withdraw your request "${campaign.title}"?`)) return;
    await apiClient.delete(`/campaigns/${campaign.id}`);
    load();
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to request a campaign spotlight.</p>;

  return (
    <div>
      <div className="my-portfolio-head">
        <div>
          <h1>Request a campaign</h1>
          <p className="post-meta">
            Have a book launch, an event, or an announcement worth putting
            in front of every visitor? Ask for a spot in the home page
            spotlight. An admin reviews every request before it goes live.
          </p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="post-form">
        <h2>New request</h2>

        {myBooks.length > 0 && (
          <>
            <label htmlFor="book_id">Tie this to one of your books (optional)</label>
            <select
              id="book_id"
              value={form.book_id}
              onChange={(e) => handleBookPick(e.target.value)}
            >
              <option value="">Not tied to a book</option>
              {myBooks.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="title">Headline</label>
        <input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder='e.g. "My debut novel launches this Friday"'
          maxLength={255}
          required
        />

        <label htmlFor="description">Pitch</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          placeholder="What is it, and why should visitors care? A sentence or two is plenty."
          maxLength={2000}
          required
        />

        <label htmlFor="link_url">Link (optional)</label>
        <input
          id="link_url"
          value={form.link_url}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          placeholder="Where should the spotlight send people?"
        />

        <label htmlFor="image_url">Image URL (optional)</label>
        <input
          id="image_url"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />

        <label htmlFor="launch_date">Launch / event date (optional)</label>
        <input
          id="launch_date"
          type="date"
          value={form.launch_date}
          onChange={(e) => setForm({ ...form, launch_date: e.target.value })}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Send request'}
        </button>
      </form>

      <h2>Your requests</h2>
      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Couldn't load your requests.</p>}
      {status === 'ready' && campaigns.length === 0 && <p>You haven't requested a spotlight yet.</p>}

      <ul className="moderation-list">
        {campaigns.map((c) => (
          <li key={c.id} className="moderation-item">
            <strong>{c.title}</strong>{' '}
            <span className={`status-pill status-pill-${c.status}`}>
              {STATUS_LABEL[c.status]}
            </span>
            {c.status === 'rejected' && c.admin_note && (
              <p className="post-meta">Admin note: {c.admin_note}</p>
            )}
            {c.status === 'pending' && (
              <div className="moderation-actions">
                <button onClick={() => handleWithdraw(c)} className="reject-button">Withdraw</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
