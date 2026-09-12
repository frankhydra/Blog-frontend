import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ROLES = ['contributor', 'author', 'admin'];

const ICON_USERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19c0-3 2.5-5.3 5.5-5.3S14.5 16 14.5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M15.5 6.2a3 3 0 0 1 0 5.8M17.8 13.6c2.3.6 4 2.6 4 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

// Card header matches the other Admin pages (Comments/Campaigns/Posts);
// the table itself keeps its own .admin-table-card/.user-table styling,
// already defined in index.css but previously unused here.
export default function AdminUsers({ embedded = false }) {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') return;
    loadUsers();
  }, [authLoading, user]);

  function loadUsers() {
    setStatus('loading');
    apiClient
      .get('/admin/users')
      .then((res) => {
        setUsers(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  async function changeRole(targetUser, role) {
    setSavingId(targetUser.id);
    setError('');
    try {
      const res = await apiClient.patch(`/admin/users/${targetUser.id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? res.data : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update that role.');
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading) return <Loading fullPage />;
  if (!user || user.role !== 'admin') return <p className="empty-state">You don't have access to this page.</p>;

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load users.</p>}
      {error && <p className="form-error">{error}</p>}

      {status === 'ready' && (
        <div className="settings-card admin-table-card">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => changeRole(u, e.target.value)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <span className="settings-card-icon admin-page-icon">{ICON_USERS}</span>
        <div>
          <p className="settings-card-eyebrow">User management</p>
          <h1>Manage authors</h1>
          <p className="post-meta">
            Promote a contributor to author once you're ready for them to
            publish publicly and appear in the community blogs section.
          </p>
        </div>
      </section>

      {content}
    </div>
  );
}
