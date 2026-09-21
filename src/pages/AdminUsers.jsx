import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ROLES = ['admin', 'author', 'contributor'];
const ROLE_LABELS = { admin: 'Admins', author: 'Authors', contributor: 'Contributors' };
const ROLE_OPTIONS = ['contributor', 'author', 'admin'];

const ICON_USERS = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19c0-3 2.5-5.3 5.5-5.3S14.5 16 14.5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M15.5 6.2a3 3 0 0 1 0 5.8M17.8 13.6c2.3.6 4 2.6 4 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

// 2.12 (Issues Log 5.11) - "a role-based account directory (all admins, all
// authors, all contributors as account records), grouped by role." This
// isn't subscriber data (that's AdminSubscribers.jsx, unchanged per Q8) -
// it's the same /admin/users account list this page already had, just
// grouped into three sections with a count per role instead of one flat
// table. No backend change - GET /admin/users already returns every
// account; grouping happens client-side from the same response. Role
// changes still work exactly as before (the <select> per row) - since
// grouping is derived fresh from `users` on every render, moving someone's
// role via the dropdown moves their row into the correct section
// automatically, no extra logic needed.
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

  const grouped = ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    accounts: users.filter((u) => u.role === role),
  }));

  const content = (
    <>
      {status === 'loading' && <Loading />}
      {status === 'error' && <p className="empty-state">Couldn't load users.</p>}
      {error && <p className="form-error">{error}</p>}

      {status === 'ready' && (
        <div className="account-directory">
          {grouped.map(({ role, label, accounts }) => (
            <div key={role} className="settings-card admin-table-card account-directory-group">
              <h2 className="account-directory-heading">
                {label} <span className="account-directory-count">{accounts.length}</span>
              </h2>

              {accounts.length === 0 ? (
                <p className="empty-state">No {label.toLowerCase()} yet.</p>
              ) : (
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            disabled={savingId === u.id}
                            onChange={(e) => changeRole(u, e.target.value)}
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
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
          <h1>Accounts</h1>
          <p className="post-meta">
            Every account on the platform, grouped by role. Promote a
            contributor to author once you're ready for them to publish
            publicly and appear in the community blogs section.
          </p>
        </div>
      </section>

      {content}
    </div>
  );
}
