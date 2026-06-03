/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Word } from '../types';

interface WordEntityProps {
  word: Word;
  isActive: boolean; // Whether the player is currently typing this word
  neonThemeColor: string;
  onClick?: () => void;
  onSelectionStart?: () => void;
  onSelectionEnd?: () => void;
  chargingProgress?: number; // 0 to 100 if being charged
}

export const WordEntity: React.FC<WordEntityProps> = ({
  word,
  isActive,
  neonThemeColor,
  onClick,
  onSelectionStart,
  onSelectionEnd,
  chargingProgress = 0,
}) => {
  const getThemeTextClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'text-cyan-400 glow-cyan';
      case 'purple': return 'text-purple-400 glow-purple';
      case 'green': return 'text-emerald-400 glow-green';
      case 'pink': return 'text-rose-400 glow-pink';
      default: return 'text-cyan-400 glow-cyan';
    }
  };

  const getThemeBorderClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'border-cyan-500/50 text-cyan-400';
      case 'purple': return 'border-purple-500/50 text-purple-400';
      case 'green': return 'border-emerald-500/50 text-emerald-400';
      case 'pink': return 'border-rose-500/50 text-rose-400';
      default: return 'border-cyan-500/50 text-cyan-400';
    }
  };

  const getThemeBgClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'bg-cyan-950/20';
      case 'purple': return 'bg-purple-950/20';
      case 'green': return 'bg-emerald-950/20';
      case 'pink': return 'bg-rose-950/20';
      default: return 'bg-cyan-950/20';
    }
  };

  const text = word.text;
  const typedCount = word.typedCharCount;
  
  const typedPart = text.slice(0, typedCount);
  const untypedPart = text.slice(typedCount);

  // Danger formatting if the word is drifting too low (near the danger zone at y >= 70%)
  const isNearDanger = word.y >= 70;

  // Custom styling attributes depending on Tactical Word Classes
  let classBorder = 'border-zinc-800/40 bg-zinc-950/60 text-zinc-400';
  let badgeLabel = '';
  let opacityStyle = 1;

  if (word.class === 'cloaked') {
    // Cloaked: intermittently visible or very faint except when locked
    opacityStyle = isActive ? 1 : (word.isStealth ? 0.08 : 0.85);
    classBorder = 'border-zinc-700/20 bg-zinc-900/10 text-zinc-500/70 border-dashed';
    badgeLabel = '👻 CLOAKED';
  } else if (word.class === 'regenerative') {
    // Regenerative: styled with a warm orange repair overlay
    classBorder = isActive 
       ? 'border-orange-500/75 bg-orange-950/20 text-orange-400'
       : 'border-orange-500/20 bg-orange-950/5 text-orange-400/80';
    badgeLabel = '↺ REGEN';
  } else if (word.class === 'shield_charger') {
    // Shield Charger: glowing golden emerald capsule
    classBorder = isActive
      ? 'border-amber-400 bg-amber-950/30 text-amber-300 shadow-[0_0_15px_#f59e0b]'
      : 'border-amber-500/30 bg-amber-950/10 text-amber-400/90 shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse';
    badgeLabel = '✦ SHIELD+';
  } else if (word.isBoss) {
    classBorder = 'border-rose-600 bg-rose-950/20 text-rose-300 shadow-[0_0_15px_#f43f5e] uppercase';
    badgeLabel = '⚠️ BOSS UNIT';
  }

  // Intercept events cleanly to prevent bubble issues
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (onSelectionStart) onSelectionStart();
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (onSelectionEnd) onSelectionEnd();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${word.x}%`,
        top: `${word.y}%`,
        transform: 'translate(-50%, -50%)',
        opacity: opacityStyle,
        transition: 'top 0.05s linear, left 0.1s ease-out, opacity 0.3s ease-in-out',
      }}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onClick={handleClick}
      className={`z-20 font-mono tracking-wider select-none pr-3 pl-3 py-1.5 rounded-md border text-sm transition-all duration-150 cursor-pointer active:scale-95
        ${isActive 
          ? `scale-110 z-30 ${getThemeBorderClass()} ${getThemeBgClass()} shadow-[0_0_15px_rgba(0,0,0,0.6)] font-semibold` 
          : isNearDanger
            ? 'border-red-500/40 bg-red-950/10 text-red-400/80 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
            : classBorder
        }
      `}
    >
      {/* Charge accumulation progress bar overlay */}
      {chargingProgress > 0 && (
        <div className="absolute inset-0 bg-amber-500/10 rounded-md overflow-hidden pointer-events-none">
          <div 
            style={{ width: `${chargingProgress}%` }} 
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 opacity-30 transition-all duration-75"
          />
        </div>
      )}

      {/* Tactical Badge Overlay */}
      {badgeLabel && (
        <span className="block text-[8px] font-sans font-bold tracking-widest text-center opacity-60 mb-0.5 leading-none">
          {badgeLabel}
        </span>
      )}

      {/* Aesthetic lock-on reticle */}
      {isActive && (
        <span className={`mr-1 text-xs animate-pulse ${getThemeTextClass()}`}>
          [
        </span>
      )}

      {/* Styled text highlights */}
      {typedPart.length > 0 && (
        <span className={`font-semibold ${getThemeTextClass()}`}>
          {typedPart}
        </span>
      )}
      
      <span className={isActive ? 'text-zinc-100' : isNearDanger ? 'text-red-300' : 'text-zinc-300'}>
        {untypedPart}
      </span>

      {isActive && (
        <span className={`ml-1 text-xs animate-pulse ${getThemeTextClass()}`}>
          ]
        </span>
      )}

      {/* Mini targeted laser connector beam or indicator */}
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full overflow-hidden">
          <div className={`w-full h-full bg-current ${getThemeTextClass()} opacity-80 animate-pulse`} />
        </div>
      )}
    </div>
  );
};

