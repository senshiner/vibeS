'use client';

import { useSceneStore } from '@/store/sceneStore';
import { useUserStore } from '@/store/userStore';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Scene1 = () => {
  const setScene = useSceneStore((s) => s.setScene);
  const { name, setName } = useUserStore();
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // === Canvas: Bintang & Kunang-kunang ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Bintang
    const stars: { x: number; y: number; radius: number; opacity: number; twinkleSpeed: number }[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.7,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    // Kunang-kunang
    const fireflies: {
      x: number; y: number;
      vx: number; vy: number;
      radius: number;
      phase: number;
      speed: number;
      targetX: number;
      targetY: number;
    }[] = [];

    const count = 35;
    for (let i = 0; i < count; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 3 + 2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.005,
        targetX: Math.random() * width,
        targetY: Math.random() * height,
      });
    }

    let frame = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Gambar bintang
      stars.forEach((star) => {
        const twinkle = Math.sin(frame * star.twinkleSpeed) * 0.3 + 0.7;
        const alpha = star.opacity * twinkle;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      // Update & gambar kunang-kunang
      fireflies.forEach((f) => {
        // Gerak ke target dengan smoothing
        const dx = f.targetX - f.x;
        const dy = f.targetY - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
          f.vx += (dx / dist) * 0.008;
          f.vy += (dy / dist) * 0.008;
        } else {
          // Pilih target baru secara periodik
          if (Math.random() < 0.002) {
            f.targetX = Math.random() * width;
            f.targetY = Math.random() * height;
          }
        }

        // Batasi kecepatan
        const sp = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
        const maxSpeed = 0.7;
        if (sp > maxSpeed) {
          f.vx = (f.vx / sp) * maxSpeed;
          f.vy = (f.vy / sp) * maxSpeed;
        }

        f.x += f.vx;
        f.y += f.vy;

        // Pantul jika keluar layar
        if (f.x < 0) { f.x = 0; f.vx *= -0.5; }
        if (f.x > width) { f.x = width; f.vx *= -0.5; }
        if (f.y < 0) { f.y = 0; f.vy *= -0.5; }
        if (f.y > height) { f.y = height; f.vy *= -0.5; }

        // Kedip & glow
        const opacity = (Math.sin(frame * f.speed + f.phase) + 1) / 2 * 0.8 + 0.2;
        const radius = f.radius * (0.7 + 0.5 * Math.sin(frame * f.speed * 0.7 + f.phase));

        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius * 5);
        grad.addColorStop(0, `rgba(255, 235, 180, ${opacity})`);
        grad.addColorStop(0.3, `rgba(255, 200, 80, ${opacity * 0.5})`);
        grad.addColorStop(1, `rgba(255, 200, 80, 0)`);

        ctx.beginPath();
        ctx.arc(f.x, f.y, radius * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(f.x, f.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 230, ${opacity * 0.9})`;
        ctx.fill();
      });

      frame++;
      requestAnimationFrame(animate);
    };

    animate();

    // Tampilkan input setelah 2.5 detik (biar pengguna menikmati suasana)
    setTimeout(() => setShowInput(true), 2500);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  // === Handle submit nama ===
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    setName(inputValue.trim());
    setIsTransitioning(true);
    // Setelah fade-out selesai, pindah ke Scene 2
    setTimeout(() => setScene('scene2'), 1800);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#060b19] via-[#0b152d] to-[#0f1b3a]">
      {/* Canvas Bintang & Kunang-kunang */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Overlay kabut */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

      {/* Fade out transisi */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 bg-black pointer-events-none z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Input Nama - muncul setelah 2.5 detik */}
      {showInput && !isTransitioning && (
        <motion.div
          className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full max-w-sm px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            <p className="text-white/40 text-sm tracking-wider font-light">
              tulis nama untuk memulai
            </p>
            <div className="relative w-full">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Namamu..."
                className="w-full px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white placeholder:text-white/30 text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-300"
                autoFocus
              />
              {inputValue.trim() !== '' && (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 rounded-full text-amber-300 text-sm transition-all duration-300"
                >
                  ✦
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}

      {/* Teks "Untuk [nama]" setelah nama disimpan (sebelum transisi) */}
      {name && !isTransitioning && (
        <motion.div
          className="absolute bottom-1/3 left-1/2 -translate-x-1/2 z-10 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <p className="text-2xl md:text-3xl font-serif text-white/80 tracking-wide">
            Untuk <span className="text-amber-300/90">{name}</span>
          </p>
          <p className="text-xs text-white/30 mt-2 tracking-widest">— cahaya kecil untukmu —</p>
        </motion.div>
      )}
    </div>
  );
};
