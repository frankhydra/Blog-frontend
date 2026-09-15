import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import Loading from '../components/Loading';

// The page a real unsubscribe link points at. Right now those links are
// only ever shown once, on-screen, right after someone subscribes (see
// SubscribeForm.jsx) since no real email is being sent yet - see
// EMAIL-LIST-STRATEGY.md Section 6. When AWS SES lands, this same page
// keeps working unchanged; it'll just be reached from a real email
// instead of a bookmarked link.
export default function Unsubscribe() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  usePageMeta('Unsubscribe', 'Manage your email subscription.');

  useEffect(() => {
    apiClient
      .get(`/unsubscribe/${token}`)
      .then((res) => {
        setMessage(res.data.message);
        setStatus('done');
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || "That unsubscribe link isn't valid.");
        setStatus('error');
      });
  }, [token]);

  if (status === 'loading') return <Loading fullPage />;

  return (
    <div className="one-pager-narrow">
      <p className="kicker">Subscription</p>
      <h1>{status === 'done' ? "You're unsubscribed — no hard feelings" : 'Something went wrong'}</h1>
      <p className="post-meta">{message}</p>
    </div>
  );
}
