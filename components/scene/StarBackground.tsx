'use client';
import { useEffect, useRef } from 'react';

export const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Konfigurasi bintang
    const stars: { x: number; y: number; radius: number; opacity: number; twinkleSpeed: number }[] = [];
    const numStars = 150;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.7, // batasi ke atas agar tidak menutupi bukit
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    // Bintang jatuh
    let shootingStar = {
      active: false,
      x: 0,
      y: 0,
      speedX: 0,
      speedY: 0,
      life: 0,
      maxLife: 0,
      trail: [] as { x: number; y: number }[],
    };

    let frame = 0;

    const drawStars = () => {
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

      // Gambar bintang jatuh
      if (shootingStar.active) {
        shootingStar.trail.push({ x: shootingStar.x, y: shootingStar.y });
        if (shootingStar.trail.length > 15) shootingStar.trail.shift();

        // Gambar trail
        shootingStar.trail.forEach((pos, idx) => {
          const alpha = idx / shootingStar.trail.length;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2 * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fill();
        });

        // Update posisi
        shootingStar.x += shootingStar.speedX;
        shootingStar.y += shootingStar.speedY;
        shootingStar.life++;

        if (shootingStar.life > shootingStar.maxLife) {
          shootingStar.active = false;
        }
      }

      frame++;
      requestAnimationFrame(drawStars);
    };

    // Fungsi memicu bintang jatuh secara periodik
    const triggerShootingStar = () => {
      if (!shootingStar.active) {
        shootingStar.active = true;
        shootingStar.x = Math.random() * width * 0.8 + width * 0.1;
        shootingStar.y = Math.random() * height * 0.2;
        shootingStar.speedX = Math.random() * 4 + 2;
        shootingStar.speedY = Math.random() * 2 + 1;
        shootingStar.life = 0;
        shootingStar.maxLife = Math.random() * 60 + 40;
        shootingStar.trail = [];
      }
      setTimeout(triggerShootingStar, Math.random() * 6000 + 4000);
    };

    drawStars();
    setTimeout(triggerShootingStar, 2000);

    // Resize handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};
