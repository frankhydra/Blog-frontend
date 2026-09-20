import { useState } from 'react';
import apiClient from '../api/client';

export default function ContactAuthorForm({ authorId, authorName, posts = [] }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [postId, setPostId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/authors/${authorId}/contact`, {
        sender_name: name,
        sender_email: email,
        message,
        post_id: postId || null,
      });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
      setPostId('');
    } catch {
      setError('Something went wrong sending your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <p className="form-success contact-form-sent">
        Your message to {authorName} is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="contact-form-row">
        <div>
          <label htmlFor="contact-name">Your name</label>
          <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="contact-email">Your email</label>
          <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      {posts.length > 0 && (
        <>
          <label htmlFor="contact-post">What's this about? (optional)</label>
          <select id="contact-post" value={postId} onChange={(e) => setPostId(e.target.value)}>
            <option value="">Just saying hi / something else</option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>{post.title}</option>
            ))}
          </select>
        </>
      )}

      <label htmlFor="contact-message">Message</label>
      <textarea
        id="contact-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder={`Tell ${authorName} what's on your mind...`}
        required
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
