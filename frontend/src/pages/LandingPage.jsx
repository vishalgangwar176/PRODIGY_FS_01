import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <main className="landing-main">
        <HeroSection />
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">🛡️</span>
            <span>CipherShield IAM Suite v4.2</span>
          </div>
          <div className="footer-tags">
            <span className="badge badge-primary">Zero-Trust Verified</span>
            <span className="badge badge-success">HSM Hardware Protected</span>
            <span className="badge badge-warning">RBAC Enabled</span>
          </div>
          <p className="footer-copy">
            Engineered with Node.js, Express, MongoDB, and React. All sessions cryptographically secured.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
