'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  speed: number;
}

/**
 * Langit tenang: gradien senja, bintang yang berkelip pelan, dan
 * partikel cahaya yang melayang lambat. Semua geraknya lambat dan
 * lembut, supaya suasananya menenangkan, bukan meramaikan.
 *
 * Menghormati prefers-reduced-motion: kalau pengguna mematikannya,
 * bintang digambar sekali dan tidak ada animasi.
 */
export function AmbientScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const stars: Star[] = Array.from({ length: 110 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.75,
      radius: Math.random() * 1.4 + 0.4,
      opacity: Math.random() * 0.55 + 0.2,
      twinkleSpeed: Math.random() * 0.012 + 0.004,
    }));

    const motes: Mote[] = Array.from({ length: 26 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(Math.random() * 0.1 + 0.03),
      radius: Math.random() * 2.2 + 1,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
    }));

    let frame = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        const twinkle = Math.sin(frame * star.twinkleSpeed) * 0.25 + 0.75;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 231, 219, ${star.opacity * twinkle})`;
        ctx.fill();
      }

      for (const mote of motes) {
        mote.x += mote.vx;
        mote.y += mote.vy;
        if (mote.y < -10) {
          mote.y = height + 10;
          mote.x = Math.random() * width;
        }
        if (mote.x < -10) mote.x = width + 10;
        if (mote.x > width + 10) mote.x = -10;

        const glow = (Math.sin(frame * mote.speed + mote.phase) + 1) / 2;
        const alpha = 0.12 + glow * 0.25;
        const grad = ctx.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, mote.radius * 6);
        grad.addColorStop(0, `rgba(216, 185, 138, ${alpha})`);
        grad.addColorStop(1, 'rgba(216, 185, 138, 0)');
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      frame += 1;
      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Gambar sekali, diam.
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 231, 219, ${star.opacity})`;
        ctx.fill();
      }
    } else {
      draw();
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0c1a2a_0%,#122a3d_45%,#0a141f_100%)]" />
      {/* Cahaya yang mengembang dan mengempis pelan, seperti napas. */}
      <div className="animate-breathe absolute left-1/2 top-1/3 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(147,184,164,0.16)_0%,rgba(147,184,164,0)_65%)]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,20,31,0.55)_0%,rgba(10,20,31,0)_35%)]" />
    </div>
  );
}
