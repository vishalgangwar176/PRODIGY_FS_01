import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get(`/admin/users?page=${page}&limit=8`),
    ])
      .then(([dashRes, usersRes]) => {
        setStats(dashRes.data.data.stats);
        setUsers(usersRes.data.data.users);
        setPagination(usersRes.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <>
      <Navbar />
      <main className="admin-page">
        <div className="admin-header">
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Admin Console
            </div>
            <h1>⚙ System <span className="text-gradient">Dashboard</span></h1>
            <p style={{ marginTop: '8px' }}>
              Logged in as <span style={{ color: 'var(--clr-primary)' }}>{user?.email}</span>
            </p>
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
            🔐 Admin Access
          </span>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }} />
          </div>
        ) : (
          <>
            <div className="stats-grid" style={{ marginBottom: '32px' }}>
              <div className="glass-card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--clr-primary)' }}>👥</div>
                <div className="stat-value" style={{ color: 'var(--clr-primary)' }}>{stats?.totalUsers ?? '—'}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--clr-warning)' }}>⚙</div>
                <div className="stat-value" style={{ color: 'var(--clr-warning)' }}>{stats?.totalAdmins ?? '—'}</div>
                <div className="stat-label">Admins</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--clr-success)' }}>🔑</div>
                <div className="stat-value" style={{ color: 'var(--clr-success)' }}>{stats?.activeSessions ?? '—'}</div>
                <div className="stat-label">Active Sessions</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.12)', color: 'var(--clr-accent)' }}>🌐</div>
                <div className="stat-value" style={{ color: 'var(--clr-accent)' }}>Zero-Trust</div>
                <div className="stat-label">Security Model</div>
              </div>
            </div>

            {/* Users Table */}
            <div className="glass-card users-table-card">
              <div className="users-table-header">
                <div>
                  <h3>Registered Users</h3>
                  <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                    {pagination.total} total · Page {pagination.page} of {pagination.totalPages}
                  </p>
                </div>
                <span className="badge badge-primary">Live</span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '30px', height: '30px',
                              borderRadius: '50%',
                              background: 'var(--grad-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                            }}
                          >
                            {u.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--clr-text-2)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--clr-text-3)', fontSize: '0.82rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px', borderTop: '1px solid var(--clr-border)' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Prev
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--clr-text-3)', fontSize: '0.85rem' }}>
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default AdminPage;
