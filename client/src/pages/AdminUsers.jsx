import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import LoginNotice from '../components/LoginNotice';
import Avatar from '../components/Avatar';
import { formatDate, mergeById } from '../utils';

const ROLES = ['student', 'authority', 'admin'];

function AdminUsers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pending, setPending] = useState(null); // { id, role } waiting for confirmation
  const [saving, setSaving] = useState(false);

  const fetchPage = async (p) => {
    const params = { page: p, limit: 20 };
    if (query.trim()) params.q = query.trim();
    if (roleFilter) params.role = roleFilter;
    const res = await api.get('/api/admin/users', { params });
    setUsers((prev) => mergeById(p === 1 ? [] : prev, res.data.users, true));
    setTotal(res.data.total);
    setPage(p);
    setHasMore(res.data.hasMore);
  };

  // Reload from page 1 when the search or filter changes (after a short pause)
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchPage(1)
        .then(() => !cancelled && setError(''))
        .catch(() => !cancelled && setError('Could not load users. Please try again.'))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, roleFilter, isAdmin]);

  const loadMore = async () => {
    setLoading(true);
    try {
      await fetchPage(page + 1);
    } catch {
      setError('Could not load more users.');
    } finally {
      setLoading(false);
    }
  };

  const confirmRole = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await api.put(`/api/admin/users/${pending.id}/role`, { role: pending.role });
      setUsers((prev) =>
        prev.map((u) => (u._id === pending.id ? { ...u, role: res.data.user.role } : u))
      );
      setNotice(`${res.data.user.username} is now ${res.data.user.role}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the role.');
    } finally {
      setPending(null);
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div>
        <h1>Users</h1>
        <LoginNotice text="You're not logged in." />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div>
        <h1>Users</h1>
        <p className="msg msg-error">This page is only for admins.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Users</h1>
      <p className="muted">
        See everyone who has signed up and change their role. Students can post and comment,
        authorities can also manage FAQs and announcements, and admins can manage everything.
      </p>

      <input
        className="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username or email"
      />
      <div className="row filter-row">
        <label htmlFor="role-filter">Role:</label>
        <select id="role-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <span className="muted">{total} {total === 1 ? 'user' : 'users'}</span>
      </div>

      {notice && <p className="msg msg-success">{notice}</p>}
      {error && <p className="msg msg-error">{error}</p>}
      {!loading && !error && users.length === 0 && <p className="muted">No users match.</p>}

      {users.length > 0 && (
        <div className="table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u._id === user.id;
                const isPending = pending?.id === u._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <Avatar name={u.username} size={28} />
                        <strong>{u.username}</strong>
                        {isMe && <span className="muted">(you)</span>}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.isVerified ? 'Yes' : 'No'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {isMe ? (
                        <span className="badge">{u.role}</span>
                      ) : (
                        <div className="role-cell">
                          <select
                            value={isPending ? pending.role : u.role}
                            onChange={(e) =>
                              e.target.value === u.role
                                ? setPending(null)
                                : setPending({ id: u._id, role: e.target.value })
                            }
                            disabled={saving}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {isPending && (
                            <>
                              <span className="muted">Make {pending.role}?</span>
                              <button className="link-btn" onClick={confirmRole} disabled={saving}>
                                {saving ? 'Saving...' : 'Confirm'}
                              </button>
                              <button className="link-btn" onClick={() => setPending(null)} disabled={saving}>
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {loading && <p className="muted">Loading...</p>}
      {hasMore && !loading && (
        <button className="btn btn-outline" onClick={loadMore}>Load more</button>
      )}
    </div>
  );
}

export default AdminUsers;