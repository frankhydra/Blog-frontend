import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import downloadFile from '../utils/downloadFile';
import apiClient from '../api/client';

const ICON_SUBSCRIBERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6.5h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 4.7 - platform-wide oversight: the /join list total, plus every
// author/contributor/admin's own list size, each with its own CSV. This
// is oversight, not a separate copy of the data - an author/contributor
// can already pull their own file from "My Subscribers" (4.8); this page
// just lets the admin see everyone's numbers in one place without asking.
export default function AdminSubscribers({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;
    setStatus('loading');
    apiClient
      .get('/admin/subscribers')
      .then((res) => {
        setData(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authLoading, user]);

  async function handleDownload(id, name) {
    setDownloadingId(id ?? 'platform');
    try {
      if (id) {
        await downloadFile(`/admin/subscribers/export/${id}`, `${name}-subscribers.csv`);
      } else {
        await downloadFile('/admin/subscribers/export', 'platform-subscribers.csv');
      }
    } finally {
      setDownloadingId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') return <p className="empty-state">You don't have access to this page.</p>;

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load subscriber data.</p>}

      {status === 'ready' && (
        <>
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Platform list</h2>
            </div>
            <div className="subscriber-platform-row">
              <div>
                <span className="dashboard-summary-count">{data.platform_count}</span>
                <span className="post-meta"> subscriber{data.platform_count === 1 ? '' : 's'} via /join</span>
                {data.platform_new_since_last_check > 0 && (
                  <span className="dashboard-summary-new">
                    {data.platform_new_since_last_check} new since you last checked
                  </span>
                )}
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => handleDownload(null, 'platform')}
                disabled={downloadingId === 'platform'}
              >
                {downloadingId === 'platform' ? 'Preparing…' : 'Download CSV'}
              </button>
            </div>
          </div>

          <div className="settings-card admin-table-card">
            <div className="settings-card-header">
              <h2>By author</h2>
            </div>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Subscribers</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.authors.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.role}</td>
                    <td>{a.count}</td>
                    <td>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => handleDownload(a.id, a.name)}
                        disabled={a.count === 0 || downloadingId === a.id}
                      >
                        {downloadingId === a.id ? 'Preparing…' : 'Download CSV'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_SUBSCRIBERS}</span>
        <div>
          <p className="settings-card-eyebrow">Oversight</p>
          <h1>Subscribers</h1>
          <p className="post-meta">
            The platform-wide list, plus every author and contributor's own
            list size. Each list can be downloaded as a CSV.
          </p>
        </div>
      </section>

      {content}
    </div>
  );
}
