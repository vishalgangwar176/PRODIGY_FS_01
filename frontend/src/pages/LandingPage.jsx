import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Hero3DView from '../components/Hero3DView';

// ─── Splash Loader ────────────────────────────────────────────────────────────
const SplashLoader = ({ onDone }) => {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let val = 0;
    const interval = setInterval(() => {
      val += Math.floor(Math.random() * 10) + 4;
      if (val >= 100) {
        val = 100;
        clearInterval(interval);
        setTimeout(() => { setLeaving(true); setTimeout(onDone, 650); }, 300);
      }
      setCount(val);
    }, 55);
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
const useReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Use a small delay so the splash has time to clear before triggering
    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
        { threshold }
      );
      if (ref.current) obs.observe(ref.current);
    }, 50);
    return () => clearTimeout(timer);
  }, [threshold]);
  return [ref, visible];
};

// ─── Marquee ──────────────────────────────────────────────────────────────────
const Marquee = () => {
  const items = ['ZERO-TRUST AUTH', 'JWT ROTATION', 'RBAC ENFORCED', 'AES-256-GCM', 'HSM VAULT', 'FIDO2 PASSKEYS', 'HTTPONLY COOKIES', 'BCRYPT 12x'];
  const doubled = [...items, ...items];
  return (
    <div className="addict-marquee-wrap" aria-hidden="true">
      <div className="addict-marquee">
        {doubled.map((t, i) => (
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
    <div ref={ref} className={`addict-feature-card${visible ? ' is-visible' : ''}`}>
      <div className="addict-feature-card__num">{num}</div>
      <div className="addict-feature-card__body">
        <div className="addict-feature-card__tag">{tag}</div>
        <h3 className="addict-feature-card__title">{title}</h3>
        <p className="addict-feature-card__desc">{desc}</p>
      </div>
      <div className="addict-feature-card__arrow" aria-hidden="true">→</div>
    </div>
  );
};

// ─── Stat item ────────────────────────────────────────────────────────────────
const StatItem = ({ value, label }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`addict-stat${visible ? ' is-visible' : ''}`}>
      <div className="addict-stat__value">{value}</div>
      <div className="addict-stat__label">{label}</div>
    </div>
  );
};

// ─── Work card ────────────────────────────────────────────────────────────────
const WorkCard = ({ id, title, desc, tag, accent }) => {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`addict-work-card${visible ? ' is-visible' : ''}`}>
      <div className="addict-work-card__num">{id}</div>
      <div className="addict-work-card__inner">
        <div className="addict-work-card__tag" style={{ color: accent, borderColor: `${accent}55` }}>{tag}</div>
        <h3 className="addict-work-card__title">{title}</h3>
        <p className="addict-work-card__desc">{desc}</p>
      </div>
      <div className="addict-work-card__accent" style={{ background: accent }} />
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  const { user } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  // Hero is above-the-fold — mark visible after splash finishes
  const [heroReady, setHeroReady] = useState(false);
  const [phraseRef, phraseVisible] = useReveal();

  useEffect(() => {
    if (splashDone) {
      // Small rAF delay so CSS transition fires
      requestAnimationFrame(() => requestAnimationFrame(() => setHeroReady(true)));
    }
  }, [splashDone]);

  const events = [
    { id: '001', title: 'Replay Attack Blocked', desc: 'Invalid refresh token hash detected — session cookie purged and user forced re-auth via 401 redirect.', tag: 'THREAT NEUTRALIZED', accent: '#ef4444' },
    { id: '002', title: 'RBAC Elevation Denied',  desc: 'User-role principal attempted admin route access. Middleware returned 403 Forbidden before handler executed.', tag: 'ACCESS DENIED', accent: '#f59e0b' },
    { id: '003', title: 'Silent Token Refresh',   desc: 'Access token expired after 1h. Refresh endpoint rotated both tokens seamlessly — user session uninterrupted.', tag: 'SESSION EXTENDED', accent: '#10b981' },
    { id: '004', title: 'OTP Verification Success', desc: '6-digit HMAC-SHA256 OTP verified within 10-minute window. User account activated, JWT pair issued.', tag: 'IDENTITY VERIFIED', accent: '#3b82f6' },
  ];

  return (
    <div className="addict-root">
      {/* Splash */}
      {!splashDone && <SplashLoader onDone={() => setSplashDone(true)} />}

      {/* Global grain overlay */}
      <div className="addict-noise" aria-hidden="true" />

      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="addict-hero" aria-label="Hero">
        <div className="addict-hero__bg-grid" aria-hidden="true" />

        {/* Text block — visible immediately after splash */}
        <div className={`addict-hero__content${heroReady ? ' is-visible' : ''}`}>
          <p className="addict-hero__label">
            <span className="addict-hero__label-dot" aria-hidden="true" />
            HARDWARE-GRADE IDENTITY PLATFORM
          </p>

          <h1 className="addict-hero__title">
            <em className="addict-hero__title-line addict-hero__title-serif">Cipher</em>
            <strong className="addict-hero__title-line addict-hero__title-bold">Shield</strong>
            <span className="addict-hero__title-line addict-hero__title-sub">IAM Suite v4.2</span>
          </h1>

          <p className="addict-hero__sub">
            Cryptographically isolated authentication pipeline — JWT rotation,
            httpOnly session vaults, and sub-millisecond RBAC clearance.
          </p>

          <div className="addict-hero__actions">
            {user ? (
              <Link to="/dashboard" className="addict-btn addict-btn--primary">
                Open Portal <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="addict-btn addict-btn--primary">
                  Get Access <span aria-hidden="true">→</span>
                </Link>
                <Link to="/login" className="addict-btn addict-btn--ghost">
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="addict-hero__scroll-hint" aria-hidden="true">
            <div className="addict-hero__scroll-line" />
            <span>SCROLL</span>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="addict-hero__canvas">
          <Hero3DView />
        </div>
      </section>

      {/* ═══════════════ MARQUEE ═══════════════ */}
      <Marquee />

      {/* ═══════════════ MANIFESTO ═══════════════ */}
      <section className="addict-manifesto" aria-label="Manifesto">
        <div ref={phraseRef} className={`addict-manifesto__inner${phraseVisible ? ' is-visible' : ''}`}>
          <p className="addict-section-eyebrow">PHILOSOPHY //</p>
          <blockquote className="addict-manifesto__quote">
            "Data and cryptographic intuition — together we engineer{' '}
            <em>irresistible security</em> that becomes the backbone of your brand."
          </blockquote>
          <div className="addict-manifesto__rule" aria-hidden="true" />
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="addict-features" aria-label="Security Architecture">
        <header className="addict-section-header">
          <p className="addict-section-eyebrow">SECURITY ARCHITECTURE</p>
          <h2 className="addict-section-title">
            Built on<br /><em>Zero-Trust</em>
          </h2>
        </header>

        <div className="addict-features__grid">
          <FeatureCard num="01" title="FIDO2 Hardware Passkeys"
            desc="Hardware-backed authentication with physical YubiKeys, TouchID, and WebAuthn credentials. NIST SP 800-63B compliant."
            tag="ES256 ENCRYPTED" />
          <FeatureCard num="02" title="Silent Refresh Token Rotation"
            desc="Every token exchange issues a newly signed refresh key and invalidates the previous hash — eliminating all replay attacks."
            tag="HTTPONLY COOKIE" />
          <FeatureCard num="03" title="Role-Based Access Control"
            desc="Granular enforcement distinguishing User profiles from privileged Admin consoles with middleware-level RBAC."
            tag="LEVEL 4 // SEC" />
          <FeatureCard num="04" title="NoSQL Injection Shield"
            desc="express-mongo-sanitize strips all $ operators and dot-notation from every incoming request before it touches the database."
            tag="XSS IMMUNE" />
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="addict-stats-section" aria-label="Key Metrics">
        <div className="addict-stats-section__glow" aria-hidden="true" />
        <div className="addict-stats-grid">
          <StatItem value="0.84ms" label="Avg Enclave Latency" />
          <StatItem value="12×"    label="bcrypt Salt Rounds" />
          <StatItem value="100%"   label="Brute-Force Shield" />
          <StatItem value="7d"     label="Refresh Token Lifespan" />
        </div>
      </section>

      {/* ═══════════════ WORKS / DEFENSE LOG ═══════════════ */}
      <section className="addict-works" aria-label="Live Defense Log">
        <header className="addict-section-header">
          <p className="addict-section-eyebrow">SYSTEM EVENTS</p>
          <h2 className="addict-section-title">
            Live<br /><em>Defense Log</em>
          </h2>
        </header>

        <div className="addict-works__grid">
          {events.map(ev => (
            <WorkCard key={ev.id} {...ev} />
          ))}
        </div>
      </section>

      {/* ═══════════════ CTA BAND ═══════════════ */}
      <section className="addict-cta-band" aria-label="Call to Action">
        <div className="addict-cta-band__inner">
          <p className="addict-section-eyebrow">GET STARTED</p>
          <h2 className="addict-cta-band__title">
            Create your<br /><em>secure identity</em>
          </h2>
          <div className="addict-cta-band__actions">
            {user ? (
              <Link to="/dashboard" className="addict-btn addict-btn--primary">
                Open Dashboard <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="addict-btn addict-btn--primary">
                  Register Account <span aria-hidden="true">→</span>
                </Link>
                <Link to="/login" className="addict-btn addict-btn--ghost">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="addict-footer">
        <div className="addict-footer__top">
          <div className="addict-footer__brand">
            <p className="addict-footer__wordmark">CIPHERSHIELD</p>
            <p className="addict-footer__tagline">Hardware-Grade Identity Suite</p>
          </div>
          <nav className="addict-footer__nav" aria-label="Footer navigation">
            <Link to="/"         className="addict-footer__link">HOME</Link>
            <Link to="/login"    className="addict-footer__link">SIGN IN</Link>
            <Link to="/register" className="addict-footer__link">REGISTER</Link>
          </nav>
        </div>
        <div className="addict-footer__bottom">
          <ul className="addict-footer__tags" aria-label="Certifications">
            <li>Zero-Trust Verified</li>
            <li>HSM Hardware Protected</li>
            <li>RBAC Enabled</li>
            <li>AES-256-GCM</li>
          </ul>
          <p className="addict-footer__copy">
            © 2026 CipherShield IAM Suite. Engineered with Node.js, Express, MongoDB &amp; React.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
