import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const VerifyEmailPage = () => {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Verification failed.';
      setApiError(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    try {
      await api.post('/auth/send-otp', { email });
      setResendCooldown(60);
      setApiError('');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  if (!email) return null;

  return (
    <main className="auth-page">
      <div className="auth-container" style={{ maxWidth: '420px' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'var(--clr-primary)', animation: 'pulse 2s infinite' }}>✉️</div>
          <h1 className="auth-title">Verify Email</h1>
          <p>
            We've sent a code to <br/>
            <span style={{ color: 'var(--clr-primary)', fontWeight: 'bold' }}>{email}</span>
          </p>
        </div>

        <div className="glass-card auth-card">
          {apiError && (
            <div className="alert alert-error mb-24">
              <span>⚠</span> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0 30px' }}>
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
                    width: '45px',
                    height: '55px',
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    padding: '0',
                    borderRadius: '8px'
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
                <><div className="spinner" /> Verifying…</>
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
                padding: 0
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend now'}
            </button>
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
