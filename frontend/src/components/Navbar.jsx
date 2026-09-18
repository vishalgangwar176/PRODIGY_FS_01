import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <header className={`addict-header ${scrolled ? 'addict-header--scrolled' : ''}`}>
      {/* Logo */}
      <Link to="/" className="addict-header__logo">
        <span className="addict-wordmark-text">
          <span className="addict-wordmark-bold">CIPHER</span><span className="addict-wordmark-light">SHIELD</span>
        </span>
        <span className="addict-header__logo-tag">IAM v4.2</span>
      </Link>

      {/* Desktop nav */}
      <nav className="addict-header__nav">
        <Link to="/" className="addict-nav-link">SECURITY</Link>
        {user && <Link to="/dashboard" className="addict-nav-link">DASHBOARD</Link>}
        {user && isAdmin && <Link to="/admin" className="addict-nav-link">ADMIN</Link>}
      </nav>

      {/* CTA area */}
      <div className="addict-header__cta">
        {user ? (
          <>
            <div className="addict-header__user">
              <div className="addict-header__avatar">{initials}</div>
              <span className="addict-header__username">{user.name}</span>
            </div>
            <button className="addict-cta-btn addict-cta-btn--outline" onClick={logout}>
              LOGOUT
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="addict-nav-link">SIGN IN</Link>
            <Link to="/register" className="addict-cta-btn">REGISTER</Link>
          </>
        )}

        {/* Hamburger */}
        <button
          className={`addict-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="addict-drawer" onClick={() => setMenuOpen(false)}>
          <Link to="/" className="addict-drawer-link"><span>HOME</span></Link>
          {user ? (
            <>
              <Link to="/dashboard" className="addict-drawer-link"><span>DASHBOARD</span></Link>
              {isAdmin && <Link to="/admin" className="addict-drawer-link"><span>ADMIN</span></Link>}
              <button className="addict-drawer-link" onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span>LOGOUT</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="addict-drawer-link"><span>SIGN IN</span></Link>
              <Link to="/register" className="addict-drawer-link"><span>REGISTER</span></Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
