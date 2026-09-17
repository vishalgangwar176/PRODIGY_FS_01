import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Hero3DView = () => {
  const mountRef = useRef(null);
  const [viewMode, setViewMode] = useState('solid'); // 'solid' | 'hologram' | 'exploded'
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeLayer, setActiveLayer] = useState(null);
  const [pulseCount, setPulseCount] = useState(0);

  // References to communicate state changes to Three.js loop without tearing down the scene
  const stateRef = useRef({
    viewMode: 'solid',
    autoRotate: true,
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    rotationVelocity: { x: 0, y: 0.005 },
    cardGroup: null,
    layers: [],
    ringGroup: null,
    particles: null,
    pulseRings: [],
  });

  useEffect(() => {
    stateRef.current.viewMode = viewMode;
  }, [viewMode]);

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // ─── Scene & Camera Setup ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b14, 0.035);

    const width = currentMount.clientWidth || 600;
    const height = currentMount.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    currentMount.appendChild(renderer.domElement);

    // ─── Lighting ─────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const primaryLight = new THREE.PointLight(0x3b82f6, 4, 25);
    primaryLight.position.set(4, 5, 4);
    scene.add(primaryLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3.5, 20);
    cyanLight.position.set(-5, -3, 3);
    scene.add(cyanLight);

    const rimLight = new THREE.PointLight(0x10b981, 2, 15);
    rimLight.position.set(0, -4, -3);
    scene.add(rimLight);

    // ─── Main Group (Vault Card + Rings) ──────────────────────────────────────
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const cardGroup = new THREE.Group();
    rootGroup.add(cardGroup);
    stateRef.current.cardGroup = cardGroup;

    // ─── Layer 1: Titanium Base Plate ─────────────────────────────────────────
    const baseGeo = new THREE.BoxGeometry(3.6, 2.2, 0.08);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0c1322,
      metalness: 0.9,
      roughness: 0.25,
      wireframe: false,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    cardGroup.add(baseMesh);

    // Border bevel glow
    const edgeGeo = new THREE.EdgesGeometry(baseGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    baseMesh.add(edgeLines);

    // ─── Layer 2: Cryptographic PCB Circuit Traces ────────────────────────────
    const circuitGeo = new THREE.PlaneGeometry(3.3, 1.9);
    const circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 512;
    circuitCanvas.height = 256;
    const ctx = circuitCanvas.getContext('2d');

    // Draw circuit procedural texture
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;

    // Grid lines & chips
    for (let x = 30; x < 500; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 20, 100);
      ctx.lineTo(x + 50, 100);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + 50, 100, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }
    // Hex code texts
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('CIPHERSHIELD // HSM VAULT CORE', 40, 220);
    ctx.fillText('AES-256-GCM | SHA-256 ES256', 40, 235);
    ctx.fillText('0x7F9A...B84C', 380, 235);

    const circuitTex = new THREE.CanvasTexture(circuitCanvas);
    const circuitMat = new THREE.MeshStandardMaterial({
      map: circuitTex,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.95,
    });
    const circuitMesh = new THREE.Mesh(circuitGeo, circuitMat);
    circuitMesh.position.z = 0.05;
    cardGroup.add(circuitMesh);

    // ─── Layer 3: Central Secure Enclave Chip (HSM) ───────────────────────────
    const chipGeo = new THREE.BoxGeometry(0.85, 0.85, 0.15);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(-0.9, 0.1, 0.12);
    cardGroup.add(chipMesh);

    // Golden contacts on chip
    const contactsGeo = new THREE.BoxGeometry(0.95, 0.95, 0.02);
    const contactsMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.2 });
    const contactsMesh = new THREE.Mesh(contactsGeo, contactsMat);
    contactsMesh.position.set(-0.9, 0.1, 0.08);
    cardGroup.add(contactsMesh);

    // ─── Layer 4: Biometric Sensor / NFC Loop Ring ────────────────────────────
    const nfcGeo = new THREE.RingGeometry(0.35, 0.42, 32);
    const nfcMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const nfcMesh = new THREE.Mesh(nfcGeo, nfcMat);
    nfcMesh.position.set(0.9, 0.1, 0.09);
    cardGroup.add(nfcMesh);

    const fingerGeo = new THREE.RingGeometry(0.18, 0.24, 24);
    const fingerMesh = new THREE.Mesh(fingerGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide }));
    fingerMesh.position.set(0.9, 0.1, 0.1);
    cardGroup.add(fingerMesh);

    // Holographic shield crest
    const crestGeo = new THREE.CircleGeometry(0.45, 6);
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });
    const crestMesh = new THREE.Mesh(crestGeo, crestMat);
    crestMesh.position.set(0, 0.1, 0.11);
    cardGroup.add(crestMesh);

    // Array of distinct layers for Exploded View
    stateRef.current.layers = [
      { mesh: baseMesh, name: 'Base Shield Enclave', targetZ: 0, explodedZ: -1.2, color: '#3b82f6' },
      { mesh: circuitMesh, name: 'PCB Cryptographic Bus', targetZ: 0.05, explodedZ: -0.4, color: '#06b6d4' },
      { mesh: chipMesh, name: 'Hardware HSM Core', targetZ: 0.12, explodedZ: 0.6, color: '#0284c7' },
      { mesh: contactsMesh, name: 'Gold Isolation Grid', targetZ: 0.08, explodedZ: 0.3, color: '#f59e0b' },
      { mesh: nfcMesh, name: 'FIDO2 / WebAuthn Sensor', targetZ: 0.09, explodedZ: 1.1, color: '#10b981' },
      { mesh: fingerMesh, name: 'Biometric Touch Enclave', targetZ: 0.1, explodedZ: 1.3, color: '#10b981' },
      { mesh: crestMesh, name: 'Zero-Trust Verification Ring', targetZ: 0.11, explodedZ: 1.6, color: '#6366f1' },
    ];

    // ─── Gyroscopic Outer Rings ───────────────────────────────────────────────
    const ringGroup = new THREE.Group();
    rootGroup.add(ringGroup);
    stateRef.current.ringGroup = ringGroup;

    const ring1Geo = new THREE.TorusGeometry(2.6, 0.018, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.4 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ringGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.1, 0.015, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.3 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    ringGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(3.5, 0.012, 16, 80);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.25 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 4;
    ringGroup.add(ring3);

    // ─── Floating Particle Field ──────────────────────────────────────────────
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 12;
      particlePos[i + 1] = (Math.random() - 0.5) * 8;
      particlePos[i + 2] = (Math.random() - 0.5) * 8;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.045,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    stateRef.current.particles = particles;

    // ─── Mouse Drag & Parallax Handling ───────────────────────────────────────
    const handleMouseDown = (e) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!stateRef.current.isDragging) {
        // Subtle tilt parallax on hover
        const rect = currentMount.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        if (!stateRef.current.isDragging && !stateRef.current.autoRotate) {
          rootGroup.rotation.y = normX * 0.4;
          rootGroup.rotation.x = -normY * 0.3;
        }
        return;
      }

      const deltaX = e.clientX - stateRef.current.prevMousePos.x;
      const deltaY = e.clientY - stateRef.current.prevMousePos.y;

      rootGroup.rotation.y += deltaX * 0.008;
      rootGroup.rotation.x += deltaY * 0.008;

      stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        stateRef.current.isDragging = true;
        stateRef.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e) => {
      if (!stateRef.current.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - stateRef.current.prevMousePos.x;
      const deltaY = e.touches[0].clientY - stateRef.current.prevMousePos.y;
      rootGroup.rotation.y += deltaX * 0.01;
      rootGroup.rotation.x += deltaY * 0.01;
      stateRef.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    // ─── Resize Handler ───────────────────────────────────────────────────────
    const handleResize = () => {
      if (!currentMount) return;
      const newW = currentMount.clientWidth;
      const newH = currentMount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // ─── Animation Loop ───────────────────────────────────────────────────────
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gyro rings spin continuously
      ring1.rotation.z = elapsedTime * 0.25;
      ring2.rotation.y = elapsedTime * -0.3;
      ring3.rotation.x = elapsedTime * 0.2;

      // Particles float
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1;

      // Handle view mode transitions (smooth interpolation of layers)
      const isExploded = stateRef.current.viewMode === 'exploded';
      const isHologram = stateRef.current.viewMode === 'hologram';

      stateRef.current.layers.forEach((layer) => {
        const targetZ = isExploded ? layer.explodedZ : layer.targetZ;
        layer.mesh.position.z += (targetZ - layer.mesh.position.z) * 0.08;

        if (layer.mesh.material) {
          layer.mesh.material.wireframe = isHologram;
          if (isHologram) {
            layer.mesh.material.opacity = 0.5;
            layer.mesh.material.transparent = true;
          }
        }
      });

      // Auto rotation when not dragging
      if (stateRef.current.autoRotate && !stateRef.current.isDragging) {
        rootGroup.rotation.y += 0.007;
        rootGroup.rotation.x = Math.sin(elapsedTime * 0.6) * 0.08;
      }

      // Dynamic light pulsation
      primaryLight.intensity = 3.5 + Math.sin(elapsedTime * 3) * 0.8;
      cyanLight.intensity = 3.0 + Math.cos(elapsedTime * 2.5) * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    // ─── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('resize', handleResize);

      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Trigger pulse effect
  const handleTriggerPulse = () => {
    setPulseCount((c) => c + 1);
    if (stateRef.current.cardGroup) {
      // Quick pop jump
      const initialScale = 1;
      stateRef.current.cardGroup.scale.set(1.15, 1.15, 1.15);
      setTimeout(() => {
        if (stateRef.current.cardGroup) {
          stateRef.current.cardGroup.scale.set(initialScale, initialScale, initialScale);
        }
      }, 180);
    }
  };

  return (
    <div className="hero-3d-wrapper">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="hero-3d-canvas" title="Drag to rotate in 3D" />

      {/* Floating 3D Control Bar */}
      <div className="hero-3d-toolbar">
        <div className="hero-3d-modes">
          <button
            type="button"
            className={`btn-3d-tab ${viewMode === 'solid' ? 'active' : ''}`}
            onClick={() => setViewMode('solid')}
          >
            🛡️ Solid Enclave
          </button>
          <button
            type="button"
            className={`btn-3d-tab ${viewMode === 'hologram' ? 'active' : ''}`}
            onClick={() => setViewMode('hologram')}
          >
            🌐 Hologram Wireframe
          </button>
          <button
            type="button"
            className={`btn-3d-tab ${viewMode === 'exploded' ? 'active' : ''}`}
            onClick={() => setViewMode('exploded')}
          >
            💥 Exploded Layers
          </button>
        </div>

        <div className="hero-3d-actions">
          <button
            type="button"
            className={`btn-3d-action ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle continuous 3D rotation"
          >
            {autoRotate ? '⏸ Pause Spin' : '▶ Auto Spin'}
          </button>
          <button
            type="button"
            className="btn-3d-action pulse-action"
            onClick={handleTriggerPulse}
            title="Emit cryptographic auth pulse"
          >
            ⚡ Security Pulse
          </button>
        </div>
      </div>

      {/* Layer breakdown labels when in exploded mode */}
      {viewMode === 'exploded' && (
        <div className="exploded-legend">
          <div className="legend-item" style={{ borderColor: '#6366f1' }}>
            <span className="legend-dot" style={{ background: '#6366f1' }} />
            <span>Layer 4: Zero-Trust Crest</span>
          </div>
          <div className="legend-item" style={{ borderColor: '#10b981' }}>
            <span className="legend-dot" style={{ background: '#10b981' }} />
            <span>Layer 3: FIDO2 Biometric Loop</span>
          </div>
          <div className="legend-item" style={{ borderColor: '#0284c7' }}>
            <span className="legend-dot" style={{ background: '#0284c7' }} />
            <span>Layer 2: Hardware HSM Enclave</span>
          </div>
          <div className="legend-item" style={{ borderColor: '#3b82f6' }}>
            <span className="legend-dot" style={{ background: '#3b82f6' }} />
            <span>Layer 1: Titanium Base Plate</span>
          </div>
        </div>
      )}

      {/* Helper Tip */}
      <div className="hero-3d-hint">
        <span>🖱 Click and drag to orbit in 3D • Scroll / hover to inspect</span>
      </div>
    </div>
  );
};

export default Hero3DView;
