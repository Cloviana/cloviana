'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  angle: number;
  speed: number;
  size: number;
  opacity: number;
  centerX: number;
  centerY: number;
}

interface Label {
  text: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  angle: number;
  speed: number;
  el: HTMLDivElement;
  nextShowAt: number;
  hideAt: number;
  visible: boolean;
}

const LABEL_TEXTS = [
  'ORIGINAL DATA',
  'MARKET INSIGHTS',
  'INDUSTRY REPORT',
  'CITATIONS',
  'THIRD-PARTY PROOF',
  'EXPERT QUOTES',
  'AI TRUST SIGNALS',
  'EARNED MENTIONS',
];

export function OrbitalParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Particle[] = [];
    const labels: Label[] = [];

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const createParticles = () => {
      particles.length = 0;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.sqrt(cx * cx + cy * cy);
      const count = Math.floor((w * h) / 130);

      for (let i = 0; i < count; i++) {
        // Bias distribution toward center with double sqrt
        const radius = maxRadius * Math.sqrt(Math.sqrt(Math.random()));
        const dist = radius / maxRadius;

        const orbitRadiusX = radius;
        const orbitRadiusY = orbitRadiusX * (0.05 + Math.random() * 0.18);
        const angle = Math.random() * Math.PI * 2;

        const size = 0.4 + Math.random() * (0.6 + dist * 1.2);
        const opacity = Math.max(0.08, 0.85 - dist * 0.5 + Math.random() * 0.2);

        particles.push({
          centerX: cx,
          centerY: cy,
          orbitRadiusX,
          orbitRadiusY,
          angle,
          speed:
            (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
          size,
          opacity,
          x: cx + Math.cos(angle) * orbitRadiusX,
          y: cy + Math.sin(angle) * orbitRadiusY,
        });
      }
    };

    const createLabels = () => {
      for (const l of labels) l.el.remove();
      labels.length = 0;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      LABEL_TEXTS.forEach((text, i) => {
        const orbitRadiusX = w * (0.12 + Math.random() * 0.22);
        const orbitRadiusY = orbitRadiusX * (0.08 + Math.random() * 0.12);
        const angle = (i / LABEL_TEXTS.length) * Math.PI * 2;

        const x = cx + Math.cos(angle) * orbitRadiusX;
        const y = cy + Math.sin(angle) * orbitRadiusY;

        const el = document.createElement('div');
        el.textContent = text;
        Object.assign(el.style, {
          position: 'absolute',
          backgroundColor: 'black',
          color: 'white',
          fontFamily: 'GeistMono, "Geist Mono", monospace',
          fontSize: '8px',
          fontWeight: '400',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          borderRadius: '1px',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          left: `${x}px`,
          top: `${y}px`,
          opacity: '0',
          filter: 'blur(0px)',
          transition: 'opacity 0.7s ease, filter 0.7s ease',
        });

        wrapper.appendChild(el);

        const now = performance.now();
        labels.push({
          text,
          x,
          y,
          centerX: cx,
          centerY: cy,
          orbitRadiusX,
          orbitRadiusY,
          angle,
          speed:
            (Math.random() * 0.002 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
          el,
          visible: false,
          nextShowAt: now + i * 1200,
          hideAt: Infinity,
        });
      });
    };

    const MAX_VISIBLE = 3;
    const SHOW_DURATION = 3000;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.angle += p.speed;
        p.x = p.centerX + Math.cos(p.angle) * p.orbitRadiusX;
        p.y = p.centerY + Math.sin(p.angle) * p.orbitRadiusY;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      }

      const now = performance.now();
      let visibleCount = labels.filter((l) => l.visible).length;
      const MIN_DIST = 90;

      for (const l of labels) {
        l.angle += l.speed;
        l.x = l.centerX + Math.cos(l.angle) * l.orbitRadiusX;
        l.y = l.centerY + Math.sin(l.angle) * l.orbitRadiusY;
      }

      for (const l of labels) {
        if (l.visible && now >= l.hideAt) {
          l.visible = false;
          l.el.style.opacity = '0';
          l.el.style.filter = 'blur(6px)';
          l.nextShowAt = now + 2000 + Math.random() * 2000;
          visibleCount--;
        }

        if (l.visible) {
          const tooClose = labels.some((other) => {
            if (other === l || !other.visible) return false;
            return Math.hypot(l.x - other.x, l.y - other.y) < MIN_DIST;
          });
          if (tooClose) {
            l.visible = false;
            l.el.style.opacity = '0';
            l.el.style.filter = 'blur(6px)';
            l.nextShowAt = now + 2000 + Math.random() * 2000;
            visibleCount--;
          }
        }

        if (!l.visible && now >= l.nextShowAt && visibleCount < MAX_VISIBLE) {
          const overlaps = labels.some((other) => {
            if (!other.visible) return false;
            return Math.hypot(l.x - other.x, l.y - other.y) < MIN_DIST;
          });
          if (!overlaps) {
            l.visible = true;
            l.hideAt = now + SHOW_DURATION;
            l.el.style.filter = 'blur(0px)';
            l.el.style.opacity = '1';
            visibleCount++;
          }
        }

        l.el.style.left = `${l.x}px`;
        l.el.style.top = `${l.y}px`;
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    createLabels();
    draw();

    const observer = new ResizeObserver(() => {
      resize();
      createParticles();
      createLabels();
    });

    observer.observe(wrapper);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      for (const l of labels) l.el.remove();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 h-full w-full overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
