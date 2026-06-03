/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameStats } from '../types';
import { Sparkles, EyeOff, Volume2, VolumeX, Shield, CircleDot } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  focusMode: boolean;
  setFocusMode: (f: boolean) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  neonThemeColor: string;
  category: string;
  difficulty: string;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  focusMode,
  setFocusMode,
  isMuted,
  setIsMuted,
  neonThemeColor,
  category,
  difficulty,
}) => {
  const getThemeTextGlowClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'text-cyan-400 glow-cyan';
      case 'purple': return 'text-purple-400 glow-purple';
      case 'green': return 'text-emerald-400 glow-green';
      case 'pink': return 'text-rose-400 glow-pink';
      default: return 'text-cyan-400 glow-cyan';
    }
  };

  const getThemeIndicatorBgClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
      case 'purple': return 'bg-purple-400 shadow-[0_0_8px_#c084fc]';
      case 'green': return 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
      case 'pink': return 'bg-rose-400 shadow-[0_0_8px_#f43f5e]';
      default: return 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
    }
  };

  if (focusMode) {
    return (
      <div className="absolute top-8 right-8 flex items-center gap-4 z-40 text-[10px] font-mono tracking-widest text-zinc-500 transition-opacity duration-300 hover:opacity-100 opacity-25">
        <span className="flex items-center gap-1.5">
          <EyeOff size={11} className="text-zinc-600" /> FOCUS MODE ENGAGED
        </span>
        <button
          onClick={() => setFocusMode(false)}
          className="hover:text-zinc-300 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-1 rounded"
        >
          [DEACTIVATE]
        </button>
      </div>
    );
  }

  // Multiplier logic: baseline is 1.0, increases with streak of consecutive completions
  const multiplier = (1.0 + (stats.streak * 0.1)).toFixed(1);

  return (
    <header className="absolute top-0 left-0 w-full z-40 flex justify-between items-start p-8 font-sans select-none pointer-events-auto">
      
      {/* Sleek Stats Matrix (Left side) */}
      <div className="flex gap-12 font-sans">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">Velocity</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light tracking-tighter text-white">
              {Math.round(stats.wpm)}
            </span>
            <span className={`text-xs ${getThemeTextGlowClass()} font-mono tracking-widest`}>
              WPM
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">Multiplier</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light tracking-tighter text-white">
              {multiplier}
            </span>
            <span className={`text-xs ${stats.streak > 0 ? getThemeTextGlowClass() : 'text-zinc-600'} font-mono tracking-widest`}>
              x
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">Accuracy</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light tracking-tighter text-white">
              {Math.round(stats.accuracy)}
            </span>
            <span className="text-xs text-zinc-500 font-mono tracking-widest">%</span>
          </div>
        </div>

        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">Telemetry</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-light tracking-tight text-white/70">
              {stats.score.toString().padStart(6, '0')}
            </span>
            <span className="text-[10px] text-zinc-600 font-mono tracking-wider">PTS</span>
          </div>
        </div>
      </div>

      {/* Right side controller indicators */}
      <div className="flex items-start gap-6">
        
        {/* System parameters feedback summary */}
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">System Status</div>
          <div className="flex items-center gap-2 justify-end">
            <span className={`text-xs font-mono uppercase tracking-tighter ${getThemeTextGlowClass()}`}>
              {difficulty} // {category}
            </span>
            <div className={`w-2 h-2 rounded-full ${getThemeIndicatorBgClass()}`}></div>
          </div>
        </div>

        {/* Sensory utilities control unit (Mute & Focus mode buttons) */}
        <div className="flex items-center gap-2 bg-zinc-900/40 border border-white/[0.04] rounded-lg p-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 transition-all hover:bg-white/[0.04]"
            title={isMuted ? 'Activate auditory system' : 'Deactivate auditory system'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          
          <button
            onClick={() => setFocusMode(true)}
            className="px-2 py-1 rounded text-[10px] font-mono tracking-wider text-zinc-500 hover:text-zinc-350 transition-all hover:bg-white/[0.04] flex items-center gap-1"
            title="Focus Mode Only"
          >
            <EyeOff size={11} />
            <span>FOCUS</span>
          </button>
        </div>

      </div>

    </header>
  );
};
