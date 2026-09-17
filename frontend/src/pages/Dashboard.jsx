import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StatCard = ({ icon, label, value, change, color }) => (
  <div className="glass-card stat-card">
    <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
    {change && <div className="stat-change">{change}</div>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    api.get('/user/profile')
      .then(({ data }) => setProfile(data.user))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const initials = user?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const lastLogin = profile?.lastLogin
    ? new Date(profile.lastLogin).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  return (
    <>
      <Navbar />
      <main className="dashboard-page">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-greeting">Identity Portal / Profile & Security</div>
          <h1>Welcome back, <span className="text-gradient">{user?.name} 👋</span></h1>
          <p style={{ marginTop: '8px' }}>
            Hardware-backed IAM profile. Zero-Trust verification active.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard
            icon="🛡"
            label="Security Score"
            value="94%"
            change="↑ Excellent posture"
            color="var(--clr-success)"
          />
          <StatCard
            icon="🔑"
            label="Active Sessions"
            value="1"
            change="Current device"
            color="var(--clr-primary)"
          />
          <StatCard
            icon="⚡"
            label="Access Level"
            value={user?.role === 'admin' ? 'LEVEL 5' : 'LEVEL 4'}
            change={`Role: ${user?.role}`}
            color="var(--clr-accent)"
          />
          <StatCard
            icon="🔒"
            label="Token Status"
            value="Active"
            change="JWT · 1h expiry"
            color="var(--clr-warning)"
          />
        </div>

        {/* Profile Details */}
        <div className="profile-section">
          {/* Identity Card */}
          <div className="glass-card profile-card">
            <h3>Identity Information</h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                background: 'var(--clr-surface)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '60px', height: '60px',
                  background: 'var(--grad-primary)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 700, color: '#fff',
                  boxShadow: '0 0 24px var(--clr-primary-glow)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
                <div style={{ color: 'var(--clr-text-3)', fontSize: '0.85rem' }}>{user?.email}</div>
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge ${user?.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
                    {user?.role === 'admin' ? '⚙ Admin' : '👤 User'}
                  </span>
                </div>
              </div>
            </div>

            {loadingProfile ? (
              <div className="flex-center" style={{ padding: '20px' }}>
                <div className="spinner" />
              </div>
            ) : (
              <>
                <div className="profile-field">
                  <span className="profile-field-label">Email</span>
                  <span className="profile-field-value">{profile?.email}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">User ID</span>
                  <span className="profile-field-value mono" style={{ fontSize: '0.75rem' }}>
                    {profile?.id?.slice(0, 16)}…
                  </span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Role</span>
                  <span className="profile-field-value">{profile?.role}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Account Status</span>
                  <span className="badge badge-success">● Active</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Joined</span>
                  <span className="profile-field-value">{joinedDate}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Last Login</span>
                  <span className="profile-field-value">{lastLogin}</span>
                </div>
              </>
            )}
          </div>

          {/* Security Card */}
          <div className="glass-card profile-card">
            <h3>Security & Authentication</h3>

            {/* Score Ring */}
            <div className="security-score">
              <div className="score-ring">
                <span>94%</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--clr-success)', marginBottom: '4px' }}>
                  Excellent Security Posture
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>
                  Your credentials conform to zero-trust standards.
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', marginTop: '4px' }}>
                  NIST SP 800-63B Compliant
                </div>
              </div>
            </div>

            {/* Auth Method */}
            <div className="profile-field" style={{ marginBottom: '8px' }}>
              <span className="profile-field-label">Auth Method</span>
              <span className="badge badge-primary">JWT Bearer</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Token Type</span>
              <span className="profile-field-value mono">Access + Refresh</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Access Expiry</span>
              <span className="profile-field-value mono">1 hour</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Refresh Expiry</span>
              <span className="profile-field-value mono">7 days</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Token Rotation</span>
              <span className="badge badge-success">● Enabled</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Cookie Security</span>
              <span className="badge badge-success">● httpOnly</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Password Hashing</span>
              <span className="profile-field-value mono">bcrypt · 12 rounds</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
