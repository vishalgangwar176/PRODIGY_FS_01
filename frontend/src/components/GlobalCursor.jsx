import { useEffect, useRef } from 'react';

/**
 * GlobalCursor — renders a custom magnetic cursor + glowing comet trail
 * that works across the entire app. Hidden automatically on touch devices.
 */
const GlobalCursor = () => {
  const cursorDotRef   = useRef(null);
  const cursorRingRef  = useRef(null);
  const trailCanvasRef = useRef(null);

  useEffect(() => {
    // Don't run on touch-only devices
    if (window.matchMedia('(hover: none)').matches) return;

    // Hide default cursor globally
    document.documentElement.style.cursor = 'none';

    const dot   = cursorDotRef.current;
    const ring  = cursorRingRef.current;
    const canvas = trailCanvasRef.current;
    if (!dot || !ring || !canvas) return;

    // Resize canvas to full viewport
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');

    // Trail particles
    const trail = [];
    const MAX_TRAIL = 28;

    let mouseX = -200, mouseY = -200;
    let ringX  = -200, ringY  = -200;
    let rafId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Push a new trail point
      trail.push({
        x: mouseX,
        y: mouseY,
        alpha: 1.0,
        size: 6 + Math.random() * 4,
        hue: 210 + Math.random() * 60, // blue → cyan
      });
      if (trail.length > MAX_TRAIL) trail.shift();
    };

    // Cursor style changes on clickable elements
    const onMouseOver = (e) => {
      if (e.target.closest('a, button, [role="button"], input, select, textarea, label')) {
        dot.style.transform   = 'translate(-50%,-50%) scale(1.8)';
        ring.style.transform  = 'translate(-50%,-50%) scale(1.6)';
        ring.style.borderColor = 'rgba(6, 182, 212, 0.9)';
        ring.style.boxShadow  = '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.2)';
      } else {
        dot.style.transform   = 'translate(-50%,-50%) scale(1)';
        ring.style.transform  = 'translate(-50%,-50%) scale(1)';
        ring.style.borderColor = 'rgba(59, 130, 246, 0.8)';
        ring.style.boxShadow  = '0 0 15px rgba(59, 130, 246, 0.4)';
      }
    };

    const onMouseDown = () => {
      dot.style.transform  = 'translate(-50%,-50%) scale(0.6)';
      ring.style.transform = 'translate(-50%,-50%) scale(0.8)';
    };
    const onMouseUp = () => {
      dot.style.transform  = 'translate(-50%,-50%) scale(1)';
      ring.style.transform = 'translate(-50%,-50%) scale(1)';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup',   onMouseUp);

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Move dot instantly
      dot.style.left = `${mouseX}px`;
      dot.style.top  = `${mouseY}px`;

      // Ring follows with spring lag
      ringX += (mouseX - ringX) * 0.13;
      ringY += (mouseY - ringY) * 0.13;
      ring.style.left = `${ringX}px`;
      ring.style.top  = `${ringY}px`;

      // Draw trail on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      trail.forEach((p, i) => {
        p.alpha -= 0.032;
        p.size  *= 0.93;
        if (p.alpha <= 0) return;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.alpha * 0.9})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 90%, 55%, ${p.alpha * 0.4})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw a thin connecting line between consecutive points
        if (i > 0) {
          const prev = trail[i - 1];
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha * 0.35})`;
          ctx.lineWidth = p.size * 0.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      });
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.style.cursor = '';
    };
  }, []);

  return (
    <>
      {/* Trail canvas — full viewport, behind everything but above body */}
      <canvas
        ref={trailCanvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 99998,
          mixBlendMode: 'screen',
        }}
      />

      {/* Inner dot — snaps to cursor */}
      <div
        ref={cursorDotRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 99999,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, #38bdf8 60%, #3b82f6 100%)',
          boxShadow: '0 0 10px #38bdf8, 0 0 20px rgba(59,130,246,0.6)',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.12s ease, background 0.2s ease',
          willChange: 'left, top',
        }}
      />

      {/* Outer ring — lags behind */}
      <div
        ref={cursorRingRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 99999,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1.5px solid rgba(59, 130, 246, 0.8)',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.4), inset 0 0 8px rgba(59, 130, 246, 0.08)',
          background: 'rgba(59, 130, 246, 0.04)',
          backdropFilter: 'blur(2px)',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          willChange: 'left, top',
        }}
      />
    </>
  );
};

export default GlobalCursor;
