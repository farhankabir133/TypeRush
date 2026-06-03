/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameStats } from '../types';
import { RotateCcw, Home, Award, ChevronRight } from 'lucide-react';

interface EndScreenProps {
  stats: GameStats;
  difficulty: string;
  category: string;
  onRestart: () => void;
  onBackToMenu: () => void;
  neonThemeColor: string;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  stats,
  difficulty,
  category,
  onRestart,
  onBackToMenu,
  neonThemeColor,
}) => {
  const getThemeTextGlowClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'text-neon-cyan glow-cyan border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-900/30';
      case 'purple': return 'text-neon-purple glow-purple border-purple-500/30 bg-purple-950/10 hover:bg-purple-900/30';
      case 'green': return 'text-neon-green glow-green border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-900/30';
      case 'pink': return 'text-neon-pink glow-pink border-rose-500/30 bg-rose-950/10 hover:bg-rose-900/30';
      default: return 'text-neon-cyan glow-cyan border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-900/30';
    }
  };

  const getThemeBorderClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'border-cyan-500/30';
      case 'purple': return 'border-purple-500/30';
      case 'green': return 'border-emerald-500/30';
      case 'pink': return 'border-rose-500/30';
      default: return 'border-cyan-500/30';
    }
  };

  // Generate a theatrical "cinematic assessment" phrase based on accuracy and WPM
  const getCinematicSummary = () => {
    const wpm = stats.wpm;
    const acc = stats.accuracy;
    
    if (wpm >= 90 && acc >= 96) {
      return {
        title: 'GODLIKE PROTOCOL',
        desc: 'Absolute cognitive synchronization achieved. Your input speed bypasses traditional matrix constraints. Synaptic pathways are running at peak structural efficiency.',
        rank: 'S-Rank Conduit'
      };
    } else if (wpm >= 70 && acc >= 92) {
      return {
        title: 'ELITE INTERPRETER',
        desc: 'Advanced system interaction terminal stable. Minor physical friction detected but heavily overridden by deep cognitive flow state. Standard security nodes eliminated.',
        rank: 'A-Rank Operative'
      };
    } else if (wpm >= 50 && acc >= 85) {
      return {
        title: 'SYNAPSE STABLE',
        desc: 'System interface complete. Substandard speed but highly balanced accuracy. Cognitive buffers handled threats efficiently without total shield breaching.',
        rank: 'B-Rank Analyst'
      };
    } else if (acc >= 75) {
      return {
        title: 'PROBATIONARY SEQUENCE',
        desc: 'Sub-optimal operational velocity. The falling structures frequently saturated core memory layers. Focus state requires synchronization. Engage breathing drills.',
        rank: 'C-Rank Trainee'
      };
    } else {
      return {
        title: 'INTERFACE COLLAPSE',
        desc: 'Critical buffer saturation. The target stream broke through local firewalls. Speed was highly compromised by continuous incorrect input feedback. Reinitialization advised.',
        rank: 'D-Rank Operator'
      };
    }
  };

  const assessment = getCinematicSummary();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/95 backdrop-blur-md select-none font-sans overflow-y-auto">
      <div className={`relative w-full max-w-2xl bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 overflow-hidden box-glow-${neonThemeColor}`}>
        
        {/* Subtle background glow */}
        <div className={`absolute -right-24 -top-24 w-60 h-60 rounded-full blur-3xl opacity-15 bg-current ${onRestart}`} />

        {/* Header Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 rounded-full border border-zinc-800 text-[10px] tracking-widest text-zinc-500 uppercase font-mono mb-3">
            <Award size={12} className="text-amber-500" /> SYSTEM DIAGNOSTICS COMPLETE
          </div>
          
          <h1 className="text-3xl font-display font-semibold text-zinc-100 tracking-tight">
            {assessment.title}
          </h1>
          <p className="font-mono text-xs tracking-widest text-zinc-500 mt-1 uppercase">
            {assessment.rank} • {difficulty} • {category}
          </p>
        </div>

        {/* Narrative / Assessment Summary block */}
        <div className="my-6 p-4 rounded bg-zinc-950/40 border border-zinc-800/40">
          <p className="text-zinc-400 text-sm leading-relaxed text-center font-serif italic">
            "{assessment.desc}"
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-zinc-950/20 border border-zinc-800/50 p-4 rounded-xl text-center">
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">WPM</p>
            <p className={`text-2xl font-semibold font-display ${getThemeTextGlowClass().split(' ')[0]}`}>
              {Math.round(stats.wpm)}
            </p>
            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">SPEED INDEX</p>
          </div>

          <div className="bg-zinc-950/20 border border-zinc-800/50 p-4 rounded-xl text-center">
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">ACCURACY</p>
            <p className="text-2xl font-semibold font-display text-zinc-100">
              {Math.round(stats.accuracy)}%
            </p>
            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
              {stats.correctChars} / {stats.totalKeystrokes} KEYS
            </p>
          </div>

          <div className="bg-zinc-950/20 border border-zinc-800/50 p-4 rounded-xl text-center">
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">BEST STREAK</p>
            <p className="text-2xl font-semibold font-display text-zinc-100">
              {stats.maxStreak}
            </p>
            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">CONSECUTIVE</p>
          </div>

          <div className="bg-zinc-950/20 border border-zinc-800/50 p-4 rounded-xl text-center">
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">CLEARED</p>
            <p className="text-2xl font-semibold font-display text-zinc-100">
              {stats.wordsTyped}
            </p>
            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
              {stats.wordsMissed} ESCAPED
            </p>
          </div>

        </div>

        {/* Supplementary stats */}
        <div className="border-t border-zinc-800/60 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-[11px] font-mono text-zinc-500">
            <div>
              TOTAL ACTIONS: <span className="text-zinc-300 font-medium">{stats.totalKeystrokes}</span>
            </div>
            <div>
              SHIELD BREACHES: <span className="text-red-400 font-medium">{stats.wordsMissed}</span>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={onBackToMenu}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all cursor-pointer"
            >
              <Home size={14} />
              <span>TERMINAL LOBBY</span>
            </button>

            <button
              onClick={onRestart}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${getThemeTextGlowClass()}`}
            >
              <RotateCcw size={14} />
              <span>RELOAD SIMULATION</span>
              <ChevronRight size={12} className="opacity-60" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
