import { useState } from 'react';

const InteractiveTokenLab = () => {
  const [role, setRole] = useState('user');
  const [tier, setTier] = useState('LEVEL 4 // SEC');
  const [isTampered, setIsTampered] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState('valid'); // 'valid' | 'invalid' | 'verifying'
  const [signatureAnim, setSignatureAnim] = useState(false);

  // Mock token generator
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payloadData = {
    sub: 'usr_9014_99x',
    name: 'Alex Vance',
    role: isTampered ? 'admin (tampered)' : role,
    tier: tier,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const payload = btoa(JSON.stringify(payloadData)).replace(/=/g, '');
  const validSig = 'sK9_8FmZ_08q7Tdael7CuootY8wb5_NANHEbSR3Qqt';
  const displaySig = isTampered ? 'INVALID_TAMPERED_SIG_90x' : validSig;

  const handleVerify = () => {
    setVerifiedStatus('verifying');
    setSignatureAnim(true);
    setTimeout(() => {
      setSignatureAnim(false);
      if (isTampered) {
        setVerifiedStatus('invalid');
      } else {
        setVerifiedStatus('valid');
      }
    }, 600);
  };

  const handleTamperToggle = () => {
    const nextTamper = !isTampered;
    setIsTampered(nextTamper);
    setVerifiedStatus(nextTamper ? 'invalid' : 'valid');
  };

  return (
    <div className="token-lab-card glass-card">
      <div className="token-lab-header">
        <div className="token-lab-badge">
          <span className="live-dot" /> JWT Cryptographic Inspector
        </div>
        <div className="token-lab-actions">
          <button
            type="button"
            className={`btn-tag ${!isTampered ? 'active-clean' : ''}`}
            onClick={() => { setIsTampered(false); setVerifiedStatus('valid'); }}
          >
            ✓ Authentic Token
          </button>
          <button
            type="button"
            className={`btn-tag ${isTampered ? 'active-tampered' : ''}`}
            onClick={handleTamperToggle}
          >
            ⚠️ Simulate Attack (Tamper)
          </button>
        </div>
      </div>

      {/* Claims config row */}
      <div className="claims-config-row">
        <div className="claim-item">
          <label>Target Role</label>
          <select value={role} onChange={(e) => { setRole(e.target.value); setIsTampered(false); setVerifiedStatus('valid'); }}>
            <option value="user">User (Standard)</option>
            <option value="admin">Admin (Privileged)</option>
            <option value="auditor">SecOps Auditor</option>
          </select>
        </div>

        <div className="claim-item">
          <label>Clearance Tier</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="LEVEL 4 // SEC">LEVEL 4 // SEC</option>
            <option value="LEVEL 5 // TOP SECRET">LEVEL 5 // TOP SECRET</option>
            <option value="LEVEL 1 // PUBLIC">LEVEL 1 // PUBLIC</option>
          </select>
        </div>

        <div className="claim-item">
          <label>Algorithm</label>
          <div className="static-pill">HMAC-SHA256 (HS256)</div>
        </div>
      </div>

      {/* 3-Part Colorized JWT breakdown */}
      <div className="jwt-stream-box">
        <span className="jwt-part jwt-header" title="Header: Algorithm & Type">
          {header}
        </span>
        <span className="jwt-dot">.</span>
        <span className="jwt-part jwt-payload" title="Payload: User claims & metadata">
          {payload}
        </span>
        <span className="jwt-dot">.</span>
        <span className={`jwt-part jwt-signature ${isTampered ? 'tampered' : ''}`} title="HMAC Signature">
          {displaySig}
        </span>
      </div>

      {/* Decoded Claims & Signature Validation Display */}
      <div className="jwt-validation-grid">
        <div className="validation-pane">
          <div className="pane-title">Decoded Payload Claims</div>
          <pre className="claims-code">
            {JSON.stringify(payloadData, null, 2)}
          </pre>
        </div>

        <div className="validation-pane">
          <div className="pane-title">Cryptographic Defense Telemetry</div>
          <div className="telemetry-box">
            <div className="telemetry-row">
              <span>Signature Match:</span>
              {verifiedStatus === 'verifying' ? (
                <span className="badge badge-warning">Computing HMAC...</span>
              ) : verifiedStatus === 'valid' ? (
                <span className="badge badge-success">✓ 256-bit Verified</span>
              ) : (
                <span className="badge badge-danger">✗ Signature Mismatch</span>
              )}
            </div>
            <div className="telemetry-row">
              <span>Token Tampering:</span>
              <span className={isTampered ? 'color-danger' : 'color-success'}>
                {isTampered ? 'DETECTED — Claims altered without secret' : 'None detected — Clean'}
              </span>
            </div>
            <div className="telemetry-row">
              <span>Zero-Trust Action:</span>
              <span className="mono">
                {isTampered ? '403 Forbidden (Auto-revoked)' : '200 OK (Clearance granted)'}
              </span>
            </div>

            <button
              type="button"
              className={`btn ${isTampered ? 'btn-danger' : 'btn-primary'} btn-full`}
              style={{ marginTop: '16px', padding: '10px' }}
              onClick={handleVerify}
            >
              {signatureAnim ? 'Verifying with Enclave...' : '⚡ Re-verify Cryptographic Signature'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTokenLab;
