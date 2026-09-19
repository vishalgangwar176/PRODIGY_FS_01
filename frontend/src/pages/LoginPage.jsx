import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(err.response.data.email)}`, {
          replace: true,
          state: { devOtp: err.response.data.devOtp },
        });
      } else {
        const msg = err.response?.data?.message || 'Login failed. Please check your credentials or register.';
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setApiError('');
    try {
      await login('demo@ciphershield.io', 'Password123!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🛡</div>
          <h1 className="auth-title">
            Welcome to <span className="text-gradient">CipherShield</span>
          </h1>
          <p>Sign in to your secure identity portal</p>
        </div>

        <div className="glass-card auth-card">
          {apiError && (
            <div className="alert alert-error mb-24">
              <span>⚠</span> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="alex@ciphershield.io"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <span className="form-error">⚠ {errors.email}</span>}
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              {errors.password && <span className="form-error">⚠ {errors.password}</span>}
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: '28px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Authenticating…
                </>
              ) : (
                '→ Sign In'
              )}
            </button>
          </form>

          <div className="divider">or</div>

          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#38bdf8',
                fontSize: '0.88rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.16)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)')}
            >
              <span>⚡</span> One-Click Demo Sign In
            </button>

            <div className="alert alert-info" style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              🔐 Zero-Trust verification active. All sessions are monitored.
            </div>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" id="go-to-register">Create one →</Link>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
