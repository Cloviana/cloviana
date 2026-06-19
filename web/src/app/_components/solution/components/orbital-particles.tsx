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

function gaussian(mean: number, std: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * std;
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
      const count = Math.floor((w * h) / 130);

      for (let i = 0; i < count; i++) {
        let cx: number, cy: number;
        if (Math.random() < 0.85) {
          cx = gaussian(0.5, 0.1) * w;
          cy = gaussian(0.5, 0.1) * h;
        } else {
          cx = Math.random() * w;
          cy = Math.random() * h;
        }

        const dx = (cx - w / 2) / (w / 2);
        const dy = (cy - h / 2) / (h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        const size = 0.4 + Math.random() * (0.6 + dist * 1.2);
        const opacity = Math.max(0.08, 0.85 - dist * 0.5 + Math.random() * 0.2);
        const orbitRadiusX = 2 + Math.random() * (8 + dist * 40);
        const orbitRadiusY = orbitRadiusX * (0.05 + Math.random() * 0.15);

        particles.push({
          centerX: cx,
          centerY: cy,
          orbitRadiusX,
          orbitRadiusY,
          angle: Math.random() * Math.PI * 2,
          speed:
            (Math.random() * 0.016 + 0.008) * (Math.random() < 0.5 ? 1 : -1),
          size,
          opacity,
          x: cx,
          y: cy,
        });
      }
    };

    const createLabels = () => {
      // Remove old label elements
      for (const l of labels) l.el.remove();
      labels.length = 0;

      const w = canvas.width;
      const h = canvas.height;

      LABEL_TEXTS.forEach((text, i) => {
        // Evenly distribute around centre, close in
        const angle = (i / LABEL_TEXTS.length) * Math.PI * 2;
        const spreadX = 0.06 + Math.random() * 0.1;
        const spreadY = 0.05 + Math.random() * 0.08;
        const cx = w / 2 + Math.cos(angle) * spreadX * w;
        const cy = h / 2 + Math.sin(angle) * spreadY * h;

        const orbitRadiusX = 50 + Math.random() * 80;
        const orbitRadiusY = orbitRadiusX * (0.08 + Math.random() * 0.12);

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
          left: `${cx}px`,
          top: `${cy}px`,
          opacity: '0',
          filter: 'blur(0px)',
          transition: 'opacity 0.7s ease, filter 0.7s ease',
        });

        wrapper.appendChild(el);

        // Stagger initial appearance: each label waits i * 1.2s before first show
        const now = performance.now();
        labels.push({
          text,
          x: cx,
          y: cy,
          centerX: cx,
          centerY: cy,
          orbitRadiusX,
          orbitRadiusY,
          angle: Math.random() * Math.PI * 2,
          speed:
            (Math.random() * 0.007 + 0.004) * (Math.random() < 0.5 ? 1 : -1),
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
        ctx.fillStyle = `rgba(150, 150, 150, ${p.opacity})`;
        ctx.fill();
      }

      const now = performance.now();
      let visibleCount = labels.filter((l) => l.visible).length;
      const MIN_DIST = 90;

      // Advance all angles and compute current positions first
      for (const l of labels) {
        l.angle += l.speed;
        l.x = l.centerX + Math.cos(l.angle) * l.orbitRadiusX;
        l.y = l.centerY + Math.sin(l.angle) * l.orbitRadiusY;
      }

      for (const l of labels) {
        // Hide if duration elapsed
        if (l.visible && now >= l.hideAt) {
          l.visible = false;
          l.el.style.opacity = '0';
          l.el.style.filter = 'blur(6px)';
          l.nextShowAt = now + 2000 + Math.random() * 2000;
          visibleCount--;
        }

        // Hide if drifted too close to another visible label
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

        // Show if scheduled, slot available, and no overlap
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
