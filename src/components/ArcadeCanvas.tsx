import React, { useEffect, useRef } from 'react';
import { LaserBeam, Particle } from '../types/game';

interface ArcadeCanvasProps {
  laserBeams: LaserBeam[];
  onRemoveLaser: (id: string) => void;
}

export const ArcadeCanvas: React.FC<ArcadeCanvasProps> = ({ laserBeams, onRemoveLaser }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Array<{ x: number; y: number; size: number; speed: number; alpha: number }>>([]);

  // Initialize stars once
  useEffect(() => {
    const stars: Array<{ x: number; y: number; size: number; speed: number; alpha: number }> = [];
    const count = 90;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 0.08 + 0.02,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    starsRef.current = stars;
  }, []);

  // Spawn particles whenever a new laser beam arrives
  useEffect(() => {
    if (laserBeams.length > 0) {
      const latest = laserBeams[laserBeams.length - 1];
      const count = 22;
      const newParticles: Particle[] = [];
      const isRed = latest.color.includes('239') || latest.color.includes('red');

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        newParticles.push({
          x: latest.targetX,
          y: latest.targetY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: isRed
            ? ['#ef4444', '#f87171', '#fca5a5', '#ffedd5'][Math.floor(Math.random() * 4)]
            : ['#06b6d4', '#22d3ee', '#10b981', '#34d399', '#ffffff'][Math.floor(Math.random() * 5)],
          size: Math.random() * 3.5 + 1.5,
          life: 1,
          maxLife: Math.random() * 20 + 20,
        });
      }
      particlesRef.current.push(...newParticles);
    }
  }, [laserBeams]);

  // Main 60fps render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Resize canvas to match display size
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Starfield
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > 100) {
          star.y = 0;
          star.x = Math.random() * 100;
        }

        const px = (star.x / 100) * canvas.width;
        const py = (star.y / 100) * canvas.height;

        ctx.fillStyle = `rgba(180, 210, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Active Laser Beams
      const now = Date.now();
      laserBeams.forEach((beam) => {
        const elapsed = now - beam.timestamp;
        const duration = 220; // ms
        if (elapsed > duration) {
          onRemoveLaser(beam.id);
          return;
        }

        const progress = elapsed / duration;
        const alpha = 1 - progress;

        // Outer glow
        ctx.save();
        ctx.shadowColor = beam.color;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = beam.color;
        ctx.lineWidth = 6 * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(beam.startX, beam.startY);
        ctx.lineTo(beam.targetX, beam.targetY);
        ctx.stroke();

        // Bright white core
        ctx.shadowBlur = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * alpha;
        ctx.beginPath();
        ctx.moveTo(beam.startX, beam.startY);
        ctx.lineTo(beam.targetX, beam.targetY);
        ctx.stroke();

        // Muzzle flare at start
        ctx.fillStyle = beam.color;
        ctx.beginPath();
        ctx.arc(beam.startX, beam.startY, 8 * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Impact flash at target
        ctx.beginPath();
        ctx.arc(beam.targetX, beam.targetY, 14 * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Draw Explosion Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life += 1;

        const progress = p.life / p.maxLife;
        if (progress >= 1) return false;

        const alpha = 1 - progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [laserBeams, onRemoveLaser]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
