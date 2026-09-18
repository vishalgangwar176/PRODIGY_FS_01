import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// ─── Heat Map Canvas Overlay ──────────────────────────────────────────────────
const HeatMapOverlay = ({ mousePos, containerRef }) => {
  const canvasRef = useRef(null);
  const hotspots = useRef([]);

  useEffect(() => {
    if (!mousePos || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((mousePos.x - rect.left) / rect.width) * 100;
    const y = ((mousePos.y - rect.top) / rect.height) * 100;
    hotspots.current.push({ x, y, intensity: 1.0, age: 0 });
    if (hotspots.current.length > 80) hotspots.current.shift();
  }, [mousePos, containerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId;

    const render = () => {
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      hotspots.current = hotspots.current
        .map(h => ({ ...h, intensity: h.intensity - 0.012, age: h.age + 1 }))
        .filter(h => h.intensity > 0);

      hotspots.current.forEach(h => {
        const px = (h.x / 100) * W;
        const py = (h.y / 100) * H;
        const r = 55 * h.intensity;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, `rgba(239, 68, 68, ${h.intensity * 0.35})`);
        grad.addColorStop(0.4, `rgba(245, 158, 11, ${h.intensity * 0.2})`);
        grad.addColorStop(0.7, `rgba(59, 130, 246, ${h.intensity * 0.12})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        borderRadius: '16px',
        mixBlendMode: 'screen',
      }}
    />
  );
};

// ─── Magnetic Cursor ──────────────────────────────────────────────────────────
const MagneticCursor = ({ mousePos, isInside }) => {
  const cursorRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (mousePos) {
      targetRef.current = mousePos;
    }
  }, [mousePos]);

  useEffect(() => {
    let rafId;
    const animate = () => {
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.12;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.12;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${posRef.current.x - 20}px, ${posRef.current.y - 20}px)`;
        cursorRef.current.style.opacity = isInside ? '1' : '0';
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isInside]);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '2px solid rgba(59, 130, 246, 0.8)',
        background: 'rgba(59, 130, 246, 0.1)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'opacity 0.3s ease, border-color 0.3s ease',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(59, 130, 246, 0.1)',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: '50%',
        transform: 'translate(-50%, -50%)',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: '#3b82f6',
        boxShadow: '0 0 8px #3b82f6',
      }} />
    </div>
  );
};

// ─── Main Hero3DView Component ────────────────────────────────────────────────
const Hero3DView = () => {
  const mountRef = useRef(null);
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('solid');
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);
  const [mousePos, setMousePos] = useState(null);
  const [isInsideCanvas, setIsInsideCanvas] = useState(false);
  const [stats, setStats] = useState({ fps: 60, triangles: 0 });

  const stateRef = useRef({
    viewMode: 'solid',
    autoRotate: true,
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    cardGroup: null,
    layers: [],
    ringGroup: null,
    particles: null,
    glowOrbs: [],
    time: 0,
    normX: 0,
    normY: 0,
    lastFrameTime: performance.now(),
    frameCount: 0,
  });

  useEffect(() => { stateRef.current.viewMode = viewMode; }, [viewMode]);
  useEffect(() => { stateRef.current.autoRotate = autoRotate; }, [autoRotate]);

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      stateRef.current.normX = normX;
      stateRef.current.normY = normY;
    }
  }, []);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // ─── Scene Setup ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050810, 0.03);

    const width = currentMount.clientWidth || 700;
    const height = currentMount.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // ─── Lighting Rig ─────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a1228, 1.0));

    const keyLight = new THREE.PointLight(0x3b82f6, 8, 30);
    keyLight.position.set(5, 6, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x06b6d4, 5, 25);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x10b981, 4, 20);
    rimLight.position.set(0, -5, -4);
    scene.add(rimLight);

    const topLight = new THREE.PointLight(0x8b5cf6, 3, 20);
    topLight.position.set(0, 8, 0);
    scene.add(topLight);

    // ─── Root Group ──────────────────────────────────────────────────────────
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const cardGroup = new THREE.Group();
    rootGroup.add(cardGroup);
    stateRef.current.cardGroup = cardGroup;

    // ─── Base Shield Card ─────────────────────────────────────────────────────
    const baseGeo = new THREE.BoxGeometry(4.0, 2.5, 0.1, 4, 4, 1);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0b1225,
      metalness: 0.95,
      roughness: 0.18,
      envMapIntensity: 1.5,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    cardGroup.add(baseMesh);

    const edgeGeo = new THREE.EdgesGeometry(baseGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.9 });
    baseMesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // ─── Circuit Board Procedural Texture ─────────────────────────────────────
    const circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 1024;
    circuitCanvas.height = 512;
    const cctx = circuitCanvas.getContext('2d');
    cctx.fillStyle = '#060d1f';
    cctx.fillRect(0, 0, 1024, 512);

    // Traces
    cctx.strokeStyle = '#06b6d4';
    cctx.lineWidth = 1.5;
    for (let x = 20; x < 1010; x += 38) {
      cctx.beginPath();
      cctx.moveTo(x, 10);
      cctx.lineTo(x, 80 + Math.sin(x * 0.05) * 20);
      cctx.lineTo(x + 20, 80 + Math.sin(x * 0.05) * 20);
      cctx.stroke();
      cctx.beginPath();
      cctx.arc(x + 20, 80 + Math.sin(x * 0.05) * 20, 4, 0, Math.PI * 2);
      cctx.fillStyle = '#3b82f6';
      cctx.fill();
    }
    for (let y = 150; y < 500; y += 30) {
      cctx.strokeStyle = `rgba(6, 182, 212, ${0.3 + Math.random() * 0.4})`;
      cctx.beginPath();
      cctx.moveTo(50, y);
      cctx.lineTo(980, y);
      cctx.stroke();
    }

    // Chip outlines
    [[100, 200, 140, 90], [300, 220, 100, 70], [500, 190, 160, 110], [750, 210, 120, 80]].forEach(([x, y, w, h]) => {
      cctx.strokeStyle = '#3b82f6';
      cctx.lineWidth = 2;
      cctx.strokeRect(x, y, w, h);
      cctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      cctx.fillRect(x, y, w, h);
      cctx.fillStyle = '#94a3b8';
      cctx.font = '11px JetBrains Mono, monospace';
      cctx.fillText(`IC-${Math.floor(Math.random() * 9000 + 1000)}`, x + 8, y + 20);
    });

    cctx.fillStyle = '#64748b';
    cctx.font = 'bold 13px JetBrains Mono, monospace';
    cctx.fillText('CIPHERSHIELD // HSM SECURE VAULT CORE v4.2', 40, 470);
    cctx.fillText('AES-256-GCM | ECDH P-384 | SHA-3-512', 40, 490);
    cctx.fillText(`UID: 0x${Math.random().toString(16).substr(2, 8).toUpperCase()}...`, 750, 490);

    const circuitTex = new THREE.CanvasTexture(circuitCanvas);
    const circuitMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 2.3),
      new THREE.MeshStandardMaterial({ map: circuitTex, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.95 })
    );
    circuitMesh.position.z = 0.056;
    cardGroup.add(circuitMesh);

    // ─── HSM Chip ────────────────────────────────────────────────────────────
    const chipGeo = new THREE.BoxGeometry(0.9, 0.9, 0.18);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x0a1f40,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.95,
      roughness: 0.08,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(-1.1, 0.15, 0.14);
    cardGroup.add(chipMesh);
    cardGroup.add(Object.assign(
      new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.98, roughness: 0.15 })
      ),
      { position: new THREE.Vector3(-1.1, 0.15, 0.09) }
    ));

    // ─── NFC Ring ────────────────────────────────────────────────────────────
    const nfcMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.025, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6, metalness: 0.8 })
    );
    nfcMesh.position.set(1.1, 0.1, 0.1);
    nfcMesh.rotation.z = Math.PI / 2;
    cardGroup.add(nfcMesh);

    const fingerMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.018, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.7 })
    );
    fingerMesh.position.set(1.1, 0.1, 0.12);
    fingerMesh.rotation.z = Math.PI / 2;
    cardGroup.add(fingerMesh);

    // Holographic Crest
    const crestMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.5, transparent: true, opacity: 0.55, wireframe: true })
    );
    crestMesh.position.set(0, 0.15, 0.13);
    cardGroup.add(crestMesh);

    stateRef.current.layers = [
      { mesh: baseMesh, name: 'Base Enclave', targetZ: 0, explodedZ: -1.5, color: '#3b82f6' },
      { mesh: circuitMesh, name: 'PCB Crypto Bus', targetZ: 0.056, explodedZ: -0.5, color: '#06b6d4' },
      { mesh: chipMesh, name: 'HSM Core', targetZ: 0.14, explodedZ: 0.7, color: '#0284c7' },
      { mesh: nfcMesh, name: 'FIDO2 Sensor', targetZ: 0.1, explodedZ: 1.3, color: '#10b981' },
      { mesh: fingerMesh, name: 'Biometric Enclave', targetZ: 0.12, explodedZ: 1.6, color: '#06b6d4' },
      { mesh: crestMesh, name: 'Zero-Trust Crest', targetZ: 0.13, explodedZ: 2.0, color: '#6366f1' },
    ];

    // ─── Gyroscopic Rings ─────────────────────────────────────────────────────
    const ringGroup = new THREE.Group();
    rootGroup.add(ringGroup);
    stateRef.current.ringGroup = ringGroup;

    const makeRing = (radius, tube, color, opacity, rotX = 0, rotY = 0) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 20, 120),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
      );
      m.rotation.set(rotX, rotY, 0);
      ringGroup.add(m);
      return m;
    };

    const ring1 = makeRing(2.8, 0.022, 0x3b82f6, 0.5);
    const ring2 = makeRing(3.4, 0.018, 0x06b6d4, 0.4, Math.PI / 3);
    const ring3 = makeRing(3.9, 0.014, 0x10b981, 0.3, 0, Math.PI / 4);
    const ring4 = makeRing(4.3, 0.010, 0x8b5cf6, 0.2, Math.PI / 5, Math.PI / 6);

    // ─── Floating Glow Orbs ───────────────────────────────────────────────────
    const orbColors = [0x3b82f6, 0x06b6d4, 0x10b981, 0x8b5cf6, 0xf59e0b];
    const glowOrbs = orbColors.map((color, i) => {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.0 })
      );
      const angle = (i / orbColors.length) * Math.PI * 2;
      orb.userData = { baseAngle: angle, radius: 2.4 + i * 0.3, speed: 0.4 + i * 0.1, yOffset: Math.sin(i * 1.3) * 0.8 };
      scene.add(orb);
      return orb;
    });
    stateRef.current.glowOrbs = glowOrbs;

    // ─── Particle Field ───────────────────────────────────────────────────────
    const PARTICLE_COUNT = 220;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    const pColors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
      pPos[i]     = (Math.random() - 0.5) * 14;
      pPos[i + 1] = (Math.random() - 0.5) * 10;
      pPos[i + 2] = (Math.random() - 0.5) * 10;
      const palette = [[0.23, 0.51, 0.96], [0.02, 0.71, 0.83], [0.06, 0.72, 0.51]];
      const c = palette[Math.floor(Math.random() * palette.length)];
      pColors[i] = c[0]; pColors[i+1] = c[1]; pColors[i+2] = c[2];
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      vertexColors: true, size: 0.055, transparent: true, opacity: 0.75, sizeAttenuation: true,
    }));
    scene.add(particles);
    stateRef.current.particles = particles;

    // ─── Mouse / Touch Handlers ───────────────────────────────────────────────
    const onMouseDown = (e) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
      if (!stateRef.current.isDragging) return;
      const dx = e.clientX - stateRef.current.prevMousePos.x;
      const dy = e.clientY - stateRef.current.prevMousePos.y;
      rootGroup.rotation.y += dx * 0.007;
      rootGroup.rotation.x += dy * 0.007;
      stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { stateRef.current.isDragging = false; };
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        stateRef.current.isDragging = true;
        stateRef.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e) => {
      if (!stateRef.current.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - stateRef.current.prevMousePos.x;
      const dy = e.touches[0].clientY - stateRef.current.prevMousePos.y;
      rootGroup.rotation.y += dx * 0.009;
      rootGroup.rotation.x += dy * 0.009;
      stateRef.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ─── Animation Loop ───────────────────────────────────────────────────────
    let rafId;
    const clock = new THREE.Clock();
    let frameCount = 0;
    let lastFPSTime = performance.now();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { normX, normY, autoRotate: ar, isDragging, viewMode: vm } = stateRef.current;

      // Floating orbs orbit
      glowOrbs.forEach((orb) => {
        const { baseAngle, radius, speed, yOffset } = orb.userData;
        const angle = baseAngle + t * speed;
        orb.position.set(
          Math.cos(angle) * radius,
          yOffset + Math.sin(t * 0.7) * 0.4,
          Math.sin(angle) * radius
        );
      });

      // Rings spin
      ring1.rotation.z = t * 0.22;
      ring2.rotation.y = -t * 0.28;
      ring3.rotation.x = t * 0.18;
      ring4.rotation.z = -t * 0.15;
      ring4.rotation.y = t * 0.12;

      // Particles drift
      particles.rotation.y = t * 0.035;
      particles.rotation.x = Math.sin(t * 0.04) * 0.12;

      // Layer transitions
      const isExploded = vm === 'exploded';
      const isHologram = vm === 'hologram';
      stateRef.current.layers.forEach((layer) => {
        const tz = isExploded ? layer.explodedZ : layer.targetZ;
        layer.mesh.position.z += (tz - layer.mesh.position.z) * 0.07;
        if (layer.mesh.material) {
          layer.mesh.material.wireframe = isHologram;
          layer.mesh.material.opacity = isHologram ? 0.45 : 0.95;
          layer.mesh.material.transparent = isHologram || !!layer.mesh.material.transparent;
        }
      });

      // Card float animation
      cardGroup.position.y = Math.sin(t * 0.8) * 0.06;
      cardGroup.rotation.z = Math.sin(t * 0.5) * 0.008;

      // Mouse parallax tilt
      if (!isDragging && !ar) {
        rootGroup.rotation.y += (normX * 0.6 - rootGroup.rotation.y) * 0.04;
        rootGroup.rotation.x += (-normY * 0.35 - rootGroup.rotation.x) * 0.04;
      }

      // Auto rotation
      if (ar && !isDragging) {
        rootGroup.rotation.y += 0.006;
        rootGroup.rotation.x = Math.sin(t * 0.5) * 0.07;
      }

      // Dynamic light pulsation
      keyLight.intensity  = 7 + Math.sin(t * 2.8) * 1.5;
      fillLight.intensity = 4.5 + Math.cos(t * 2.2) * 1.0;
      topLight.intensity  = 2.5 + Math.sin(t * 1.7 + 1) * 0.8;

      renderer.render(scene, camera);

      // FPS counter
      frameCount++;
      const now = performance.now();
      if (now - lastFPSTime > 1000) {
        setStats({ fps: Math.round(frameCount * 1000 / (now - lastFPSTime)), triangles: renderer.info.render.triangles });
        frameCount = 0;
        lastFPSTime = now;
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleTriggerPulse = () => {
    setPulseCount(c => c + 1);
    const cg = stateRef.current.cardGroup;
    if (cg) {
      cg.scale.set(1.18, 1.18, 1.18);
      setTimeout(() => cg?.scale.set(1, 1, 1), 200);
    }
  };

  return (
    <div
      ref={containerRef}
      className="hero-3d-wrapper"
      style={{ position: 'relative', cursor: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsInsideCanvas(true)}
      onMouseLeave={() => { setIsInsideCanvas(false); stateRef.current.normX = 0; stateRef.current.normY = 0; }}
    >
      <MagneticCursor mousePos={mousePos} isInside={isInsideCanvas} />

      {/* 3D Canvas */}
      <div ref={mountRef} className="hero-3d-canvas" title="Drag to rotate • Move to heat-track" />

      {/* Heat Map Overlay */}
      {isInsideCanvas && <HeatMapOverlay mousePos={mousePos} containerRef={containerRef} />}

      {/* FPS / Stats HUD */}
      <div style={{
        position: 'absolute', top: '10px', left: '12px',
        background: 'rgba(7,11,20,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px',
        padding: '5px 10px', fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.65rem', color: '#64748b', zIndex: 10,
        display: 'flex', gap: '14px', letterSpacing: '0.05em',
      }}>
        <span style={{ color: stats.fps >= 55 ? '#10b981' : '#f59e0b' }}>FPS {stats.fps}</span>
        <span>{stats.triangles.toLocaleString()} ▲</span>
        <span style={{ color: '#3b82f6' }}>WEBGL 2.0</span>
        <span style={{ color: '#06b6d4' }}>✦ LIVE</span>
      </div>

      {/* Pulse Counter HUD */}
      {pulseCount > 0 && (
        <div style={{
          position: 'absolute', top: '10px', right: '12px',
          background: 'rgba(59,130,246,0.15)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(59,130,246,0.35)', borderRadius: '8px',
          padding: '5px 12px', fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.7rem', color: '#3b82f6', zIndex: 10,
        }}>
          ⚡ {pulseCount} pulses emitted
        </div>
      )}

      {/* 3D Control Bar */}
      <div className="hero-3d-toolbar">
        <div className="hero-3d-modes">
          {[['solid', '🛡️ Solid'], ['hologram', '🌐 Hologram'], ['exploded', '💥 Exploded']].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`btn-3d-tab ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hero-3d-actions">
          <button type="button" className={`btn-3d-action ${autoRotate ? 'active' : ''}`} onClick={() => setAutoRotate(v => !v)}>
            {autoRotate ? '⏸ Pause' : '▶ Spin'}
          </button>
          <button type="button" className="btn-3d-action pulse-action" onClick={handleTriggerPulse}>
            ⚡ Pulse
          </button>
        </div>
      </div>

      {/* Exploded Legend */}
      {viewMode === 'exploded' && (
        <div className="exploded-legend">
          {stateRef.current.layers.slice().reverse().map((l) => (
            <div key={l.name} className="legend-item" style={{ borderColor: l.color }}>
              <span className="legend-dot" style={{ background: l.color }} />
              <span>{l.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="hero-3d-hint">
        <span>🖱 Drag to orbit • Move mouse for heat trace • Click ⚡ to pulse</span>
      </div>
    </div>
  );
};

export default Hero3DView;
