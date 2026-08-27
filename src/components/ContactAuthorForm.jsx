import { useState } from 'react';
import apiClient from '../api/client';

export default function ContactAuthorForm({ authorId, authorName }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
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
      });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
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
