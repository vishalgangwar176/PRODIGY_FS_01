import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * - If loading session: show full-screen spinner
 * - If not authenticated: redirect to /login
 * - If role provided: restrict to that role (redirect to /dashboard if wrong role)
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '40px', animation: 'pulseLogo 2s ease-in-out infinite' }}>🛡</div>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
        <p style={{ color: 'var(--clr-text-3)', fontSize: '0.875rem' }}>Verifying session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
