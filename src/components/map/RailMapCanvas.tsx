import React, { useRef, useEffect } from 'react';
import { ViewMode } from '../../types';

interface RailMapCanvasProps {
  viewMode: ViewMode;
  reducedMotion: boolean;
  tampereCoords: { x: number; y: number }; // In 0..100 percentage
  ouluCoords: { x: number; y: number };
}

/**
 * RailMapCanvas: Procedural shader/canvas rendering engine
 * Implements:
 * 1. Faceted terrain elevation shading
 * 2. FMI Snow particle simulation over Northern Ostrobothnia (Oulu line)
 * 3. Animated delay ripple shader waves centered at Tampere
 * 4. 2D vs 3D perspective camera matrix
 */
export const RailMapCanvas: React.FC<RailMapCanvasProps> = ({
  viewMode,
  reducedMotion,
  tampereCoords,
  ouluCoords,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Snow particles for FMI weather alert near Oulu corridor
    const particlesCount = 45;
    const snowParticles = Array.from({ length: particlesCount }, () => ({
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 140,
      radius: Math.random() * 1.8 + 0.6,
      speedX: Math.random() * 0.8 + 0.3,
      speedY: Math.random() * 1.2 + 0.6,
      opacity: Math.random() * 0.7 + 0.3,
    }));

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      time += reducedMotion ? 0 : 0.025;

      // 1. Faceted terrain background grid / relief contours (Finland geography)
      ctx.save();
      if (viewMode === '3D') {
        // Perspective tilt
        ctx.translate(width * 0.05, height * 0.05);
      }

      // Draw subtle terrain triangulation / elevation facets
      ctx.strokeStyle = 'rgba(36, 52, 68, 0.25)';
      ctx.lineWidth = 0.5;

      const cols = 12;
      const rows = 18;
      const stepX = width / cols;
      const stepY = height / rows;

      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * stepX;
          const y = j * stepY;
          // Simple procedural elevation noise
          const elevation = Math.sin(i * 0.5 + time * 0.1) * Math.cos(j * 0.4);
          if (elevation > 0.4) {
            ctx.fillStyle = 'rgba(77, 163, 255, 0.015)';
            ctx.fillRect(x, y, stepX, stepY);
          }
        }
      }
      ctx.stroke();

      // 2. Tampere Delay Ripple Shader Effect (Expanding circular wave rings)
      const tX = (tampereCoords.x / 100) * width;
      const tY = (tampereCoords.y / 100) * height;

      if (!reducedMotion) {
        for (let r = 0; r < 3; r++) {
          const wavePhase = (time * 0.8 + r * 1.2) % 3.5;
          const radius = wavePhase * 36 + 6;
          const alpha = Math.max(0, 1 - wavePhase / 3.5) * 0.45;

          ctx.beginPath();
          ctx.arc(tX, tY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(240, 160, 48, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#F0A030';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      }

      // 3. FMI Weather Snow Layer (Concentrated in Northern Ostrobothnia around Oulu)
      const oX = (ouluCoords.x / 100) * width;
      const oY = (ouluCoords.y / 100) * height;

      ctx.save();
      ctx.translate(oX, oY);

      snowParticles.forEach((p) => {
        if (!reducedMotion) {
          p.x += p.speedX;
          p.y += p.speedY;

          if (p.x > 90) p.x = -90;
          if (p.y > 80) p.y = -80;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 240, 255, ${p.opacity * 0.6})`;
        ctx.fill();
      });

      // FMI weather zone label
      ctx.fillStyle = 'rgba(77, 163, 255, 0.65)';
      ctx.font = '9px monospace';
      ctx.fillText('FMI: Lumikertymä 15cm / 6h', -70, -65);

      ctx.restore();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewMode, reducedMotion, tampereCoords, ouluCoords]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      aria-hidden="true"
    />
  );
};
