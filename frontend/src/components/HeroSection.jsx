import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Hero3DView from './Hero3DView';
import InteractiveTokenLab from './InteractiveTokenLab';

const HeroSection = () => {
  const { user } = useAuth();
  const [heroMode, setHeroMode] = useState('3d'); // '3d' | 'lab' | 'defense'
  const [telemetryCount, setTelemetryCount] = useState(14820);
  const [defenseLog, setDefenseLog] = useState([
    { id: 1, text: 'Replay protection active: Token hash validated', time: '1s ago', type: 'ok' },
    { id: 2, text: 'NIST SP 800-63B Zero-Trust session check passed', time: '4s ago', type: 'ok' },
    { id: 3, text: 'Hardware FIDO2 + Passkey WebAuthn handshook', time: '8s ago', type: 'ok' },
  ]);

  // Simulated live telemetry heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const triggerAttackSim = () => {
    const newAlert = {
      id: Date.now(),
      text: 'BREACH DETECTED: Invalid refresh token replay. Cookie invalidated & session revoked (401).',
      time: 'Just now',
      type: 'warn',
    };
    setDefenseLog((prev) => [newAlert, ...prev.slice(0, 4)]);
  };

  return (
    <section className="hero-section">
      {/* Top Cyber Status Pill Bar */}
      <div className="hero-top-status">
        <div className="status-pill status-online">
          <span className="live-dot green-pulse" /> All Systems Nominal
        </div>
        <div className="status-pill status-security">
          <span>🔒 Zero-Trust Active (99.99%)</span>
        </div>
        <div className="status-pill status-enclave">
          <span>⚡ Enclave Vault: AES-256-GCM / HSM</span>
        </div>
      </div>

      {/* Main Hero Header */}
      <div className="hero-content">
        <div className="hero-badge">
          <span>🛡️ CIPHERSHIELD IAM SUITE V4.2</span>
        </div>

        <h1 className="hero-title">
          Hardware-Grade Identity &{' '}
          <span className="text-gradient">Zero-Trust Authentication</span>
        </h1>

        <p className="hero-subtitle">
          Cryptographically isolated user authentication pipeline with hardware-backed JWT rotation,
          tamper-proof httpOnly cookie sessions, and sub-millisecond RBAC clearance.
        </p>

        {/* Primary Call-to-Actions */}
        <div className="hero-cta-group">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary hero-btn-main">
              ⚡ Open Identity Portal →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary hero-btn-main">
                🔐 Access IAM Portal
              </Link>
              <Link to="/register" className="btn btn-ghost hero-btn-ghost">
                + Register New Account
              </Link>
            </>
          )}

          <button
            type="button"
            className="btn btn-ghost hero-btn-mode"
            onClick={() => setHeroMode(heroMode === '3d' ? 'lab' : '3d')}
          >
            {heroMode === '3d' ? '🧪 Open JWT Token Lab' : '🌐 View 3D Enclave Model'}
          </button>
        </div>

        {/* Interactive Mode Switcher Tabs */}
        <div className="hero-tabs-nav">
          <button
            type="button"
            className={`hero-tab-btn ${heroMode === '3d' ? 'active' : ''}`}
            onClick={() => setHeroMode('3d')}
          >
            <span className="tab-icon">💎</span> 3D Cryptographic Enclave
            <span className="tab-pill">Interactive 3D</span>
          </button>

          <button
            type="button"
            className={`hero-tab-btn ${heroMode === 'lab' ? 'active' : ''}`}
            onClick={() => setHeroMode('lab')}
          >
            <span className="tab-icon">🧪</span> JWT Inspector & Attack Lab
            <span className="tab-pill">Live Lab</span>
          </button>

          <button
            type="button"
            className={`hero-tab-btn ${heroMode === 'defense' ? 'active' : ''}`}
            onClick={() => setHeroMode('defense')}
          >
            <span className="tab-icon">📡</span> Zero-Trust Defense Stream
            <span className="tab-pill">{defenseLog.length} Events</span>
          </button>
        </div>
      </div>

      {/* Dynamic Interactive Stage based on selected Mode */}
      <div className="hero-interactive-stage">
        {heroMode === '3d' && (
          <div className="stage-panel stage-3d">
            <Hero3DView />
          </div>
        )}

        {heroMode === 'lab' && (
          <div className="stage-panel stage-lab">
            <InteractiveTokenLab />
          </div>
        )}

        {heroMode === 'defense' && (
          <div className="stage-panel stage-defense glass-card">
            <div className="defense-header">
              <div>
                <h3>Real-Time Zero-Trust Security Enclave</h3>
                <p>Telemetry stream synchronized with SHA-256 session rotation pool.</p>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={triggerAttackSim}
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                ⚠️ Simulate Replay Attack
              </button>
            </div>

            <div className="defense-stream-list">
              {defenseLog.map((item) => (
                <div key={item.id} className={`defense-log-row ${item.type}`}>
                  <div className="log-indicator">
                    {item.type === 'warn' ? '🚨' : '🛡️'}
                  </div>
                  <div className="log-content">
                    <div className="log-text">{item.text}</div>
                    <div className="log-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="defense-stats-bar">
              <div className="defense-stat">
                <span className="stat-num">{telemetryCount.toLocaleString()}</span>
                <span className="stat-desc">Cryptographic Tokens Verified</span>
              </div>
              <div className="defense-stat">
                <span className="stat-num">0.84ms</span>
                <span className="stat-desc">Avg Enclave Latency</span>
              </div>
              <div className="defense-stat">
                <span className="stat-num">100%</span>
                <span className="stat-desc">Brute-Force Shield Active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Feature Architecture Cards */}
      <div className="hero-features-grid">
        <div className="glass-card feature-tile">
          <div className="feature-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--clr-primary)' }}>
            🔑
          </div>
          <h4>FIDO2 & Hardware Passkeys</h4>
          <p>
            Hardware-backed authentication standard supporting physical USB-C YubiKeys, TouchID, and WebAuthn credentials.
          </p>
          <div className="feature-meta">
            <span className="badge badge-primary">ES256 ENCRYPTED</span>
            <span className="feature-sub">NIST SP 800-63B</span>
          </div>
        </div>

        <div className="glass-card feature-tile">
          <div className="feature-icon" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--clr-accent)' }}>
            🔄
          </div>
          <h4>Silent Refresh Token Rotation</h4>
          <p>
            Every token exchange issues a newly signed refresh key and invalidates the previous hash in MongoDB to eliminate replay attacks.
          </p>
          <div className="feature-meta">
            <span className="badge badge-success">● httpOnly Cookie</span>
            <span className="feature-sub">XSS-Immune</span>
          </div>
        </div>

        <div className="glass-card feature-tile">
          <div className="feature-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--clr-success)' }}>
            🛡️
          </div>
          <h4>Role-Based Access Control</h4>
          <p>
            Granular access enforcement strictly distinguishing User profiles from privileged Admin consoles and audit logs.
          </p>
          <div className="feature-meta">
            <span className="badge badge-warning">LEVEL 4 // SEC</span>
            <span className="feature-sub">RBAC Middleware</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
