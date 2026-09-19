import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const VerifyEmailPage = () => {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || null);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const autoFillOtp = (codeToFill) => {
    if (!codeToFill) return;
    const chars = codeToFill.toString().slice(0, 6).split('');
    while (chars.length < 6) chars.push('');
    setOtp(chars);
    setApiError('');
    setTimeout(() => {
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }, 50);
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setApiError('');

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        setApiError('');
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setApiError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email, code);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Verification failed. Please check the code.';
      setApiError(msg);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setApiError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/send-otp', { email });
      setResendCooldown(60);
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
        setSuccessMsg(`New code generated: ${res.data.devOtp}`);
      } else {
        setSuccessMsg(res.data?.message || 'A new verification code has been dispatched.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  if (!email) return null;

  return (
    <main className="auth-page">
      <div className="auth-container" style={{ maxWidth: '440px' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'var(--clr-primary)', animation: 'pulse 2s infinite' }}>
            ✉️
          </div>
          <h1 className="auth-title">Verify Email</h1>
          <p>
            We've sent a code to <br />
            <span style={{ color: 'var(--clr-primary)', fontWeight: 'bold' }}>{email}</span>
          </p>
        </div>

        <div className="glass-card auth-card">
          {/* Dev Mode Helper Card */}
          {devOtp && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(14, 165, 233, 0.15)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  fontWeight: '700',
                  color: 'var(--clr-primary)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>⚡</span> Verification Code (Dev / Local Mode)
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  letterSpacing: '8px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  margin: '8px 0 12px',
                }}
              >
                {devOtp}
              </div>
              <button
                type="button"
                onClick={() => autoFillOtp(devOtp)}
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#38bdf8',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.35)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)')}
              >
                ⚡ Auto-fill Code
              </button>
            </div>
          )}

          {apiError && (
            <div className="alert alert-error mb-24">
              <span>⚠</span> {apiError}
            </div>
          )}

          {successMsg && (
            <div
              className="alert mb-24"
              style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ade80',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>✓</span> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '15px 0 25px' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="form-input"
                  style={{
                    width: '46px',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    padding: '0',
                    borderRadius: '8px',
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Verifying…
                </>
              ) : (
                'Verify & Continue →'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? 'var(--clr-text-3)' : 'var(--clr-primary)',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                fontWeight: 'bold',
                padding: 0,
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend now'}
            </button>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--clr-border)',
              fontSize: '0.75rem',
              color: 'var(--clr-text-3)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            💡 For real Gmail delivery, set your Gmail address and 16-character Google App Password in{' '}
            <code style={{ color: 'var(--clr-primary)' }}>backend/.env</code>.
          </div>
        </div>

        <div className="auth-footer">
          <Link to="/login">← Back to login</Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
      `}</style>
    </main>
  );
};

export default VerifyEmailPage;
