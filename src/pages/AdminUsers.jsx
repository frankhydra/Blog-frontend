import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = ['contributor', 'author', 'admin'];

export default function AdminUsers() {
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

  if (authLoading) return <p>Loading…</p>;
  if (!user || user.role !== 'admin') return <p>You don't have access to this page.</p>;

  return (
    <div className="admin-users">
      <h1>Manage authors</h1>
      <p className="post-meta">
        Promote a contributor to author once you're ready for them to publish
        publicly and appear in the community blogs section.
      </p>

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Couldn't load users.</p>}
      {error && <p className="form-error">{error}</p>}

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
  );
}
