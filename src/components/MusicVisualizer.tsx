/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';

interface MusicVisualizerProps {
  themeColor: string;
  stats: { wpm: number; streak: number };
  overdriveActive: boolean;
}

export function MusicVisualizer({ themeColor, stats, overdriveActive }: MusicVisualizerProps) {
  const [phase, setPhase] = useState(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      // Speed up frequency of wave based on WPM and overdrive status
      const speed = overdriveActive ? 0.22 : 0.05 + Math.min(0.12, stats.wpm / 350);
      setPhase(p => (p + speed) % (Math.PI * 2));
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [stats.wpm, overdriveActive]);

  // Generate a smooth multi-harmonic wave curve
  const points: string[] = [];
  const width = 400;
  const height = 20;
  const hLimit = overdriveActive ? 14 : 4 + Math.min(6, stats.streak * 0.25);

  for (let x = 0; x <= width; x += 12) {
    const angle1 = (x / width) * Math.PI * 4 + phase;
    const angle2 = (x / width) * Math.PI * 8 - phase * 0.6;
    const y = height / 2 + Math.sin(angle1) * hLimit + Math.cos(angle2) * (hLimit * 0.3);
    points.push(`${x},${y}`);
  }

  const getGlowColor = () => {
    if (overdriveActive) return '#ef4444'; // Orange/Red on overdrive
    if (themeColor === 'purple') return '#c084fc';
    if (themeColor === 'green') return '#4ade80';
    if (themeColor === 'pink') return '#f472b6';
    return '#22d3ee'; // cyan
  };

  const pathData = `M 0,${height / 2} ` + points.map(p => `L ${p}`).join(' ') + ` L ${width},${height} L 0,${height} Z`;

  return (
    <div className="w-full h-8 absolute -top-8 left-0 pointer-events-none select-none overflow-hidden z-10">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Subtle filled area */}
        <path
          d={pathData}
          fill={`url(#visualizer-grad-${themeColor})`}
          className="opacity-15 transition-all duration-300"
        />
        {/* Crisp laser line */}
        <path
          d={`M 0,${height / 2} ` + points.map(p => `L ${p}`).join(' ')}
          fill="none"
          stroke={getGlowColor()}
          strokeWidth={overdriveActive ? "3.0" : "1.2"}
          className="transition-all duration-300"
          style={{
            filter: `drop-shadow(0 0 5px ${getGlowColor()})`
          }}
        />
        
        <defs>
          <linearGradient id={`visualizer-grad-${themeColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={getGlowColor()} stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
