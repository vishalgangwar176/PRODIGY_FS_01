import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">🛡</div>
          <span>CipherShield</span>
          <span className="navbar-version">IAM v4.2</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">
            💎 3D Enclave Hero
          </Link>
          {user && (
            <Link to="/dashboard" className="nav-link">
              👤 Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                ⚙ Admin
              </Link>
            )}

            <div className="navbar-user">
              <div className="navbar-avatar">{initials}</div>
              <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>{user?.name}</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                ● {user?.role}
              </span>
            </div>

            <button className="btn btn-danger" onClick={logout} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              ↪ Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              + Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
