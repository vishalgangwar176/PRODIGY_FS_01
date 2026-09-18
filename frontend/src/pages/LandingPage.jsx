import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Hero3DView from '../components/Hero3DView';

// ─── Splash Loader (ADDICT-style percentage counter) ─────────────────────────
const SplashLoader = ({ onDone }) => {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let val = 0;
    const interval = setInterval(() => {
      val += Math.floor(Math.random() * 12) + 3;
      if (val >= 100) {
        val = 100;
        clearInterval(interval);
        setTimeout(() => { setLeaving(true); setTimeout(onDone, 700); }, 300);
      }
      setCount(val);
    }, 60);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className={`addict-splash ${leaving ? 'addict-splash--leave' : ''}`}>
      <div className="addict-splash__noise" />
      <div className="addict-splash__counter">
        <span className="addict-splash__num">{String(count).padStart(2, '0')}</span>
        <span className="addict-splash__pct">%</span>
      </div>
      <div className="addict-splash__brand">CIPHERSHIELD</div>
    </div>
  );
};

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

// ─── Marquee ticker ───────────────────────────────────────────────────────────
const Marquee = () => {
  const items = ['ZERO-TRUST AUTH', 'JWT ROTATION', 'RBAC ENFORCED', 'AES-256-GCM', 'HSM VAULT', 'FIDO2 PASSKEYS', 'HTTPONLY COOKIES', 'BCRYPT 12x'];
  return (
    <div className="addict-marquee-wrap">
      <div className="addict-marquee">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="addict-marquee-item">
            {t} <span className="addict-marquee-dot">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Feature card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ num, title, desc, tag }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`addict-feature-card ${visible ? 'addict-reveal' : ''}`}>
      <div className="addict-feature-card__num">{num}</div>
      <div className="addict-feature-card__body">
        <div className="addict-feature-card__tag">{tag}</div>
        <h3 className="addict-feature-card__title">{title}</h3>
        <p className="addict-feature-card__desc">{desc}</p>
      </div>
      <div className="addict-feature-card__arrow">→</div>
    </div>
  );
};

// ─── Stat item ────────────────────────────────────────────────────────────────
const StatItem = ({ value, label }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`addict-stat ${visible ? 'addict-reveal' : ''}`}>
      <div className="addict-stat__value">{value}</div>
      <div className="addict-stat__label">{label}</div>
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  const { user } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [heroRef, heroVisible] = useReveal();
  const [phraseRef, phraseVisible] = useReveal();

  return (
    <div className="addict-root">
      {!splashDone && <SplashLoader onDone={() => setSplashDone(true)} />}

      {/* Noise grain overlay */}
      <div className="addict-noise" aria-hidden="true" />

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="addict-hero">
        <div className="addict-hero__bg-grid" />

        <div ref={heroRef} className={`addict-hero__content ${heroVisible ? 'addict-hero--visible' : ''}`}>
          <div className="addict-hero__label">
            <span className="addict-hero__label-dot" />
            HARDWARE-GRADE IDENTITY PLATFORM
          </div>

          <h1 className="addict-hero__title">
            <span className="addict-hero__title-line addict-hero__title-line--serif">
              Cipher
            </span>
            <span className="addict-hero__title-line addict-hero__title-line--thin">
              Shield
            </span>
            <span className="addict-hero__title-line addict-hero__title-line--small">
              IAM Suite
            </span>
          </h1>

          <p className="addict-hero__sub">
            Cryptographically isolated authentication pipeline — JWT rotation, httpOnly session vaults, and sub-millisecond RBAC clearance.
          </p>

          <div className="addict-hero__actions">
            {user ? (
              <Link to="/dashboard" className="addict-hero__btn addict-hero__btn--primary">
                <span>Open Portal</span>
                <span className="addict-hero__btn-arrow">→</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="addict-hero__btn addict-hero__btn--primary">
                  <span>Get Access</span>
                  <span className="addict-hero__btn-arrow">→</span>
                </Link>
                <Link to="/login" className="addict-hero__btn addict-hero__btn--ghost">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          <div className="addict-hero__scroll-hint">
            <div className="addict-hero__scroll-line" />
            <span>SCROLL</span>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="addict-hero__canvas">
          <Hero3DView />
        </div>
      </section>

      {/* ── MARQUEE TICKER ────────────────────────────────────────────── */}
      <Marquee />

      {/* ── MANIFESTO ─────────────────────────────────────────────────── */}
      <section className="addict-manifesto">
        <div ref={phraseRef} className={`addict-manifesto__inner ${phraseVisible ? 'addict-reveal' : ''}`}>
          <div className="addict-manifesto__label">PHILOSOPHY //</div>
          <blockquote className="addict-manifesto__quote">
            "Data and cryptographic intuition — together we engineer <em>irresistible security</em> that becomes the backbone of your brand."
          </blockquote>
          <div className="addict-manifesto__line" />
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="addict-features">
        <div className="addict-features__header">
          <div className="addict-section-label">SECURITY ARCHITECTURE</div>
          <h2 className="addict-section-title">
            Built on<br /><em>Zero-Trust</em>
          </h2>
        </div>

        <div className="addict-features__grid">
          <FeatureCard
            num="01"
            title="FIDO2 Hardware Passkeys"
            desc="Hardware-backed authentication with physical YubiKeys, TouchID, and WebAuthn credentials. NIST SP 800-63B compliant."
            tag="ES256 ENCRYPTED"
          />
          <FeatureCard
            num="02"
            title="Silent Refresh Token Rotation"
            desc="Every token exchange issues a newly signed refresh key and invalidates the previous hash in MongoDB — eliminating all replay attacks."
            tag="HTTPONLY COOKIE"
          />
          <FeatureCard
            num="03"
            title="Role-Based Access Control"
            desc="Granular enforcement distinguishing User profiles from privileged Admin consoles with middleware-level RBAC."
            tag="LEVEL 4 // SEC"
          />
          <FeatureCard
            num="04"
            title="NoSQL Injection Shield"
            desc="express-mongo-sanitize strips all $ operators and dot-notation from every incoming request before it touches the database layer."
            tag="XSS IMMUNE"
          />
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────── */}
      <section className="addict-stats-section">
        <div className="addict-stats-section__bg" />
        <div className="addict-stats-grid">
          <StatItem value="0.84ms" label="Avg Enclave Latency" />
          <StatItem value="12x" label="bcrypt Salt Rounds" />
          <StatItem value="100%" label="Brute-Force Shield" />
          <StatItem value="7d" label="Refresh Token Lifespan" />
        </div>
      </section>

      {/* ── WORKS / SECURITY EVENTS ───────────────────────────────────── */}
      <section className="addict-works">
        <div className="addict-works__header">
          <div className="addict-section-label">SYSTEM EVENTS</div>
          <h2 className="addict-section-title">
            Live<br /><em>Defense Log</em>
          </h2>
        </div>

        <div className="addict-works__grid">
          {[
            { id: '001', title: 'Replay Attack Blocked', desc: 'Invalid refresh token hash detected — session cookie purged and user forced re-auth via 401 redirect.', tag: 'THREAT NEUTRALIZED', accent: '#ef4444' },
            { id: '002', title: 'RBAC Elevation Denied', desc: 'User-role principal attempted admin route access. Middleware returned 403 Forbidden before handler executed.', tag: 'ACCESS DENIED', accent: '#f59e0b' },
            { id: '003', title: 'Silent Token Refresh', desc: 'Access token expired after 1h. Refresh endpoint rotated both tokens seamlessly — user session uninterrupted.', tag: 'SESSION EXTENDED', accent: '#10b981' },
            { id: '004', title: 'OTP Verification Success', desc: '6-digit HMAC-SHA256 OTP verified within 10-minute window. User account activated, JWT pair issued.', tag: 'IDENTITY VERIFIED', accent: '#3b82f6' },
          ].map(ev => (
            <div key={ev.id} className="addict-work-card">
              <div className="addict-work-card__num">{ev.id}</div>
              <div className="addict-work-card__inner">
                <div className="addict-work-card__tag" style={{ color: ev.accent, borderColor: `${ev.accent}40` }}>{ev.tag}</div>
                <h3 className="addict-work-card__title">{ev.title}</h3>
                <p className="addict-work-card__desc">{ev.desc}</p>
              </div>
              <div className="addict-work-card__accent" style={{ background: ev.accent }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ───────────────────────────────────────────────────── */}
      <section className="addict-cta-band">
        <div className="addict-cta-band__inner">
          <div className="addict-section-label">GET STARTED</div>
          <h2 className="addict-cta-band__title">
            Create your<br /><em>secure identity</em>
          </h2>
          <div className="addict-cta-band__actions">
            {user ? (
              <Link to="/dashboard" className="addict-hero__btn addict-hero__btn--primary">
                <span>Open Dashboard</span>
                <span className="addict-hero__btn-arrow">→</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="addict-hero__btn addict-hero__btn--primary">
                  <span>Register Account</span>
                  <span className="addict-hero__btn-arrow">→</span>
                </Link>
                <Link to="/login" className="addict-hero__btn addict-hero__btn--ghost">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="addict-footer">
        <div className="addict-footer__top">
          <div className="addict-footer__brand">
            <div className="addict-footer__wordmark">CIPHERSHIELD</div>
            <div className="addict-footer__tagline">Hardware-Grade Identity Suite</div>
          </div>
          <nav className="addict-footer__nav">
            <Link to="/" className="addict-footer__link">HOME</Link>
            <Link to="/login" className="addict-footer__link">SIGN IN</Link>
            <Link to="/register" className="addict-footer__link">REGISTER</Link>
          </nav>
        </div>
        <div className="addict-footer__bottom">
          <div className="addict-footer__tags">
            <span>Zero-Trust Verified</span>
            <span>HSM Hardware Protected</span>
            <span>RBAC Enabled</span>
            <span>AES-256-GCM</span>
          </div>
          <p className="addict-footer__copy">
            © 2026 CipherShield IAM Suite. Engineered with Node.js, Express, MongoDB & React.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
