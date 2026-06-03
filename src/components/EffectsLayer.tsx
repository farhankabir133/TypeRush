/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Particle } from '../types';

export interface EffectsLayerRef {
  spawnWordExplosion: (xPercent: number, yPercent: number, word: string, color: string) => void;
  triggerKeyFlash: (color: string) => void;
  triggerStreakBreakGlitch: () => void;
  triggerShieldStrikeEvent: () => void;
}

interface EffectsLayerProps {
  neonThemeColor: string;
  streak: number;
  wpm: number;
  performancePreset?: 'performance' | 'efficiency';
  isLowBattery?: boolean;
}

export const EffectsLayer = forwardRef<EffectsLayerRef, EffectsLayerProps>(
  ({ neonThemeColor, streak, wpm, performancePreset = 'performance', isLowBattery: propIsLowBattery }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    
    // Ambient floating embers
    const embersRef = useRef<{ x: number; y: number; size: number; speedY: number; alpha: number }[]>([]);
    
    // Dynamic overlays / screen hits
    const keyFlashActiveRef = useRef<boolean>(false);
    const keyFlashColorRef = useRef<string>('#06b6d4');
    const keyFlashAlphaRef = useRef<number>(0);

    const glitchTimerRef = useRef<number>(0);
    const shieldStrikeAlphaRef = useRef<number>(0);

    // Local battery status tracking fallback
    const [localIsLowBattery, setLocalIsLowBattery] = useState<boolean>(false);

    useEffect(() => {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          const checkBatteryStatus = () => {
            const isLow = battery.level <= 0.20 && !battery.charging;
            setLocalIsLowBattery(isLow);
          };
          checkBatteryStatus();
          battery.addEventListener('levelchange', checkBatteryStatus);
          battery.addEventListener('chargingchange', checkBatteryStatus);
          return () => {
            battery.removeEventListener('levelchange', checkBatteryStatus);
            battery.removeEventListener('chargingchange', checkBatteryStatus);
          };
        }).catch(() => {});
      }
    }, []);

    const isLowBattery = propIsLowBattery !== undefined ? propIsLowBattery : localIsLowBattery;
    const isPowerSaver = performancePreset === 'efficiency' || isLowBattery;

    // Get color hex values based on theme color name
    const getThemeHexColor = (name: string = neonThemeColor) => {
      switch (name) {
        case 'cyan': return '#06b6d4';
        case 'purple': return '#a855f7';
        case 'green': return '#10b981';
        case 'pink': return '#f43f5e';
        default: return '#06b6d4';
      }
    };

    useImperativeHandle(ref, () => ({
      spawnWordExplosion(xPercent, yPercent, word, colorName) {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const x = (xPercent / 100) * canvas.width;
        const y = (yPercent / 100) * canvas.height;
        const hexColor = getThemeHexColor(colorName);

        // Spawn beautiful letter/spark particles
        const wordLetters = word.split('');
        
        // 1. Individual letter chunks that zoom out (disabled completely on Power Saver)
        const activeLetters = isPowerSaver ? [] : wordLetters;
        activeLetters.forEach((char, idx) => {
          const angle = (idx / activeLetters.length) * Math.PI * 2 + (Math.random() - 0.5);
          const velocity = 2 + Math.random() * 4;
          particlesRef.current.push({
            id: `${Date.now()}-${idx}-${Math.random()}`,
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity - 1, // Subtle upward float
            alpha: 1.0,
            color: hexColor,
            size: 14 + Math.random() * 6, // Larger for legible text
            decay: 0.02 + Math.random() * 0.015,
            // Custom string property stored inside sizing
            ...({ char } as any)
          });
        });

        // 2. High-speed sparkling dust particles (disabled completely on Power Saver)
        const dustCount = isPowerSaver ? 0 : 15;
        for (let i = 0; i < dustCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const velocity = 3 + Math.random() * 6;
          particlesRef.current.push({
            id: `${Date.now()}-dust-${i}-${Math.random()}`,
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            alpha: 1.0,
            color: Math.random() > 0.4 ? hexColor : '#ffffff',
            size: 2 + Math.random() * 3,
            decay: 0.03 + Math.random() * 0.02,
          });
        }
      },

      triggerKeyFlash(colorName) {
        keyFlashActiveRef.current = true;
        keyFlashColorRef.current = getThemeHexColor(colorName);
        keyFlashAlphaRef.current = 0.4;
      },

      triggerStreakBreakGlitch() {
        glitchTimerRef.current = 20; // 20 frames of glitch disruption
      },

      triggerShieldStrikeEvent() {
        shieldStrikeAlphaRef.current = 0.8; // Bright red alarm hit
      }
    }));

    // Handle canvas sizing and main rendering loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      };

      resizeCanvas();
      
      const observer = new ResizeObserver(() => {
        resizeCanvas();
      });
      if (canvas.parentElement) {
        observer.observe(canvas.parentElement);
      }

      // Initialize ambient space dust embers (cleared and configured dynamically based on Power Saver status)
      embersRef.current = [];
      const maxEmbers = isPowerSaver ? 0 : 40;
      for (let i = 0; i < maxEmbers; i++) {
        embersRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: 1 + Math.random() * 2,
          speedY: -0.3 - Math.random() * 0.8,
          alpha: 0.1 + Math.random() * 0.4,
        });
      }

      let animationId: number;

      const draw = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Adaptive Cinematic Space Atmosphere Background Reaction (disabled on Power Saver)
        const activeHex = getThemeHexColor();
        if (streak > 5 && !isPowerSaver) {
          const radialGlow = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 50,
            canvas.width / 2, canvas.height / 2, canvas.width
          );
          const intensity = Math.min(0.12, (streak * 0.005) + (wpm / 1500));
          radialGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
          radialGlow.addColorStop(0.5, `${activeHex}03`);
          radialGlow.addColorStop(1, `${activeHex}${Math.floor(intensity * 100).toString(16).padStart(2, '0')}`);
          ctx.fillStyle = radialGlow;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 2. Space Dust / Atmospheric Embers - Flow speed varies with performance!
        if (!isPowerSaver) {
          const performanceMultiplier = Math.min(4, 1 + streak * 0.1 + (wpm / 50));
          embersRef.current.forEach(ember => {
            ember.y += ember.speedY * performanceMultiplier;
            if (ember.y < 0) {
              ember.y = canvas.height;
              ember.x = Math.random() * canvas.width;
            }
            ctx.fillStyle = `rgba(255, 255, 255, ${ember.alpha * (0.6 + streak * 0.01)})`;
            ctx.beginPath();
            ctx.arc(ember.x, ember.y, ember.size * (1 + streak * 0.02), 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // 3. Render Particles (No expensive shadowBlurs on Power Saver)
        particlesRef.current.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particlesRef.current.splice(idx, 1);
            return;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          
          const customChar = (p as any).char;
          if (customChar) {
            // Text particle
            ctx.fillStyle = p.color;
            ctx.font = `bold ${p.size}px monospace`;
            if (!isPowerSaver) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = p.color;
            }
            ctx.fillText(customChar, p.x, p.y);
          } else {
            // Shiny dust particle
            ctx.fillStyle = p.color;
            if (!isPowerSaver) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = p.color;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        // 4. Render Input Keypress flash ring (creates "impact feedback")
        if (keyFlashActiveRef.current) {
          keyFlashAlphaRef.current -= 0.02;
          if (keyFlashAlphaRef.current <= 0) {
            keyFlashActiveRef.current = false;
          } else {
            ctx.save();
            ctx.strokeStyle = keyFlashColorRef.current;
            ctx.lineWidth = 3;
            ctx.globalAlpha = keyFlashAlphaRef.current;

            // Draw clean concentric impact rings at bottom typing line
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height * 0.9, 100 * (1 - keyFlashAlphaRef.current), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }

        // 5. Strike Feedback Shield Event (Flashing alert boundary)
        if (shieldStrikeAlphaRef.current > 0) {
          shieldStrikeAlphaRef.current -= 0.025;
          ctx.save();
          ctx.fillStyle = `rgba(239, 68, 68, ${shieldStrikeAlphaRef.current * 0.25})`; // Deep crimson danger
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render a pulsing geometric "shield breakdown" light at the bottom
          ctx.strokeStyle = `rgba(239, 68, 68, ${shieldStrikeAlphaRef.current})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height * 0.85);
          ctx.lineTo(canvas.width, canvas.height * 0.85);
          ctx.stroke();
          ctx.restore();
        }

        // 6. Glitch digital offset styling (streak breaking reset)
        if (glitchTimerRef.current > 0) {
          glitchTimerRef.current--;
          if (Math.random() > 0.3) {
            ctx.save();
            // Render random horizontal cyan & red glitch bars
            const barHeight = 8 + Math.random() * 24;
            const barY = Math.random() * canvas.height;
            const displacement = (Math.random() - 0.5) * 45;
            
            ctx.fillStyle = 'rgba(6, 182, 212, 0.35)'; // Cyan glitch
            ctx.fillRect(displacement, barY, canvas.width, barHeight);
            
            ctx.fillStyle = 'rgba(244, 63, 94, 0.35)'; // Pink/Red glitch
            ctx.fillRect(-displacement, barY + Math.random() * 10, canvas.width, barHeight);
            
            ctx.restore();
          }
        }

        animationId = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        cancelAnimationFrame(animationId);
        observer.disconnect();
      };
    }, [neonThemeColor, streak, wpm, isPowerSaver]);

    return (
      <canvas
        ref={canvasRef}
        id="effects-layer-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    );
  }
);

EffectsLayer.displayName = 'EffectsLayer';
