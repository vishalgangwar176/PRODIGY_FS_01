import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PASSWORD_RULES = [
  { label: '8+ characters',                   test: (p) => p.length >= 8 },
  { label: 'Uppercase letter',                 test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',                 test: (p) => /[a-z]/.test(p) },
  { label: 'Number',                           test: (p) => /\d/.test(p) },
];

const PasswordStrength = ({ password }) => {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const pct = (passed / PASSWORD_RULES.length) * 100;
  const color =
    pct < 50 ? 'var(--clr-danger)' : pct < 75 ? 'var(--clr-warning)' : 'var(--clr-success)';

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ height: '4px', background: 'var(--clr-border)', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '100px', transition: 'all 0.3s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {PASSWORD_RULES.map((r) => (
          <span
            key={r.label}
            style={{
              fontSize: '0.72rem',
              color: r.test(password) ? 'var(--clr-success)' : 'var(--clr-text-3)',
              transition: 'color 0.2s',
            }}
          >
            {r.test(password) ? '✓' : '○'} {r.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (!PASSWORD_RULES.every((r) => r.test(form.password))) e.password = 'Password does not meet all requirements';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
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
      const data = await register(form.name.trim(), form.email, form.password);
      if (data.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
          replace: true,
          state: { devOtp: data.devOtp },
        });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container" style={{ maxWidth: '460px' }}>
        <div className="auth-header">
          <div className="auth-logo">🛡</div>
          <h1 className="auth-title">
            Create <span className="text-gradient">IAM Account</span>
          </h1>
          <p>Join CipherShield — secure identity from day one</p>
        </div>

        <div className="glass-card auth-card">
          {apiError && (
            <div className="alert alert-error mb-24">
              <span>⚠</span> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Alex Vance"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
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
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {form.password && <PasswordStrength password={form.password} />}
              {errors.password && <span className="form-error">⚠ {errors.password}</span>}
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                name="confirm"
                className={`form-input ${errors.confirm ? 'error' : ''}`}
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirm && <span className="form-error">⚠ {errors.confirm}</span>}
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: '28px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Creating account…
                </>
              ) : (
                '→ Create Account'
              )}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" id="go-to-login">Sign in →</Link>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
