import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

const BLANK = { title: '', description: '', link_url: '', image_url: '', launch_date: '', book_id: '' };

// <input type="datetime-local"> requires "YYYY-MM-DDTHH:mm" - no
// trailing Z, no seconds/microseconds - but the API now returns
// launch_date as a full ISO string since it's cast to datetime.
// Converts using the browser's local time so what's shown in the field
// matches what the picker's clock face actually displayed when it was
// set.
function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_LABEL = {
  pending: 'Awaiting review',
  approved: 'Live on the home page',
  rejected: 'Not approved',
  withdrawn: 'Withdrawn',
};

// Any logged-in author or contributor can ask for a spot in the home page
// campaign spotlight - a book launch, an event, anything worth pushing to
// the front of the site. Requests start pending and only go public once an
// admin approves them from /admin/campaigns. Admins don't request one here
// - they already control the spotlight directly (see the guard below).
export default function RequestCampaign({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Skipped when embedded - the dashboard tab that renders this sets its
  // own page title; calling this here too would just fight it.
  usePageMeta(
    embedded ? undefined : 'Request a campaign',
    embedded ? undefined : 'Ask to have a book launch or announcement featured on the home page.'
  );

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
      if (editingId) {
        await apiClient.put(`/campaigns/${editingId}`, payload);
        setEditingId(null);
      } else {
        await apiClient.post('/campaigns', payload);
      }
      setForm(BLANK);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong saving your request.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditClick(campaign) {
    setError('');
    setEditingId(campaign.id);
    setForm({
      title: campaign.title || '',
      description: campaign.description || '',
      link_url: campaign.link_url || '',
      image_url: campaign.image_url || '',
      launch_date: toDatetimeLocalValue(campaign.launch_date),
      book_id: campaign.book_id ? String(campaign.book_id) : '',
    });
    // The form is above the list this button lives in - scroll it into
    // view so it's obvious something happened, since the fields filling
    // in isn't itself very visible if the form is off-screen below.
    document.getElementById('campaign-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(BLANK);
    setError('');
  }

  async function handleWithdraw(campaign) {
    const verb = campaign.status === 'approved' ? 'Take down' : campaign.status === 'rejected' ? 'Remove' : 'Withdraw';
    if (!confirm(`${verb} "${campaign.title}"? It'll stay here so you can resubmit it or delete it for good later.`)) return;
    setError('');
    try {
      await apiClient.post(`/campaigns/${campaign.id}/withdraw`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong with that request.');
    }
  }

  async function handleResubmit(campaign) {
    if (!confirm(`Resubmit "${campaign.title}" for a fresh admin review?`)) return;
    setError('');
    try {
      await apiClient.post(`/campaigns/${campaign.id}/resubmit`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong resubmitting that request.');
    }
  }

  async function handleDeletePermanently(campaign) {
    if (!confirm(`Permanently delete "${campaign.title}"? This can't be undone.`)) return;
    setError('');
    try {
      await apiClient.delete(`/campaigns/${campaign.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong deleting that request.');
    }
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to request a campaign spotlight.</p>;
  if (user.role === 'admin') {
    return (
      <p className="empty-state">
        Admins already control the spotlight directly from{' '}
        <Link to="/admin/campaigns">Moderate campaigns</Link> - there's no need
        to request one here.
      </p>
    );
  }

  const content = (
    <>
      {error && <p className="form-error">{error}</p>}

      <form id="campaign-form" onSubmit={handleSubmit} className="post-form">
        <h2>{editingId ? 'Edit request' : 'New request'}</h2>
        {editingId && ['approved', 'rejected'].includes(campaigns.find((c) => c.id === editingId)?.status) && (
          <p className="post-meta">
            {campaigns.find((c) => c.id === editingId)?.status === 'approved'
              ? "This is currently live. Saving will pull it off the home page and send it back for a fresh admin review."
              : 'Saving will resend this for a fresh admin review.'}
          </p>
        )}

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

        <label htmlFor="launch_date">Launch / event date &amp; time (optional)</label>
        <input
          id="launch_date"
          type="datetime-local"
          value={form.launch_date}
          onChange={(e) => setForm({ ...form, launch_date: e.target.value })}
        />
        <p className="post-meta">Leave off if it's not tied to a specific date - it'll show as an ongoing/evergreen spotlight instead.</p>

        <div className="post-form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Send request'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="queue-secondary-button">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <h2>Your requests</h2>
      {error && <p className="form-error">{error}</p>}
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
            {(c.status === 'pending' || c.status === 'approved' || c.status === 'rejected') && (
              <div className="moderation-actions">
                <button type="button" onClick={() => handleEditClick(c)}>Edit</button>
                <button onClick={() => handleWithdraw(c)} className="reject-button">
                  {c.status === 'approved' ? 'Take down' : c.status === 'rejected' ? 'Remove' : 'Withdraw'}
                </button>
              </div>
            )}
            {c.status === 'withdrawn' && (
              <div className="moderation-actions">
                <button type="button" onClick={() => handleEditClick(c)}>Edit</button>
                <button onClick={() => handleResubmit(c)}>Resubmit for review</button>
                <button onClick={() => handleDeletePermanently(c)} className="reject-button">Delete permanently</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) return content;

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

      {content}
    </div>
  );
}
