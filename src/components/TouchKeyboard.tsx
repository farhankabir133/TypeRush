/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Word } from '../types';

interface TouchKeyboardProps {
  onKeyPress: (char: string) => void;
  words: Word[];
  activeWordId: string | null;
  neonThemeColor: string;
  oneHanded: 'none' | 'left' | 'right';
  caseInsensitive: boolean;
}

export const TouchKeyboard: React.FC<TouchKeyboardProps> = ({
  onKeyPress,
  words,
  activeWordId,
  neonThemeColor,
  oneHanded,
  caseInsensitive,
}) => {
  // QWERTY Row setups
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  // Map theme colors to CSS properties
  const getThemeTextClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'text-cyan-400 border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.25)]';
      case 'purple': return 'text-purple-400 border-purple-500/40 shadow-[0_0_8px_rgba(192,132,252,0.25)]';
      case 'green': return 'text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.25)]';
      case 'pink': return 'text-rose-400 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.25)]';
      default: return 'text-cyan-400 border-cyan-500/40';
    }
  };

  const getThemeActiveBgClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return 'bg-cyan-950/40 border-cyan-400 text-cyan-300';
      case 'purple': return 'bg-purple-950/40 border-purple-400 text-purple-300';
      case 'green': return 'bg-emerald-950/40 border-emerald-400 text-emerald-300';
      case 'pink': return 'bg-rose-950/40 border-rose-400 text-rose-300';
      default: return 'bg-cyan-950/40 border-cyan-400 text-cyan-300';
    }
  };

  // Determine which characters are currently "Target Candidates" or "Next Required Characters"
  const getKeyboardTelemetry = () => {
    const highlights = new Set<string>();
    let isPrimaryLock = false;

    if (activeWordId) {
      // We are locked on a word. Find its next expected character
      const targetWord = words.find(w => w.id === activeWordId);
      if (targetWord) {
        const nextChar = targetWord.text[targetWord.typedCharCount];
        if (nextChar) {
          highlights.add(nextChar.toUpperCase());
          isPrimaryLock = true;
        }
      }
    } else {
      // No active lock, highlight the first letters of all active words (to help focus target discovery)
      words.forEach(w => {
        if (w.text && w.text.length > 0) {
          highlights.add(w.text[0].toUpperCase());
        }
      });
    }

    return { highlights, isPrimaryLock };
  };

  const { highlights, isPrimaryLock } = getKeyboardTelemetry();

  // One-handed Ergonomic classes
  let alignmentClass = 'w-full max-w-lg mx-auto';
  if (oneHanded === 'left') {
    alignmentClass = 'w-10/12 mr-auto ml-1 sm:max-w-md';
  } else if (oneHanded === 'right') {
    alignmentClass = 'w-10/12 ml-auto mr-1 sm:max-w-md';
  }

  return (
    <div className={`flex flex-col gap-1.5 p-2 bg-black/85 rounded-xl border border-zinc-900 z-40 transition-all duration-300 select-none ${alignmentClass}`}>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-1">
          {/* Offset spaces for symmetric layout */}
          {rowIdx === 1 && <div className="w-[1.5%]" />}
          {rowIdx === 2 && <div className="w-[3%]" />}

          {row.map(key => {
            const isHighlighted = highlights.has(key);
            let btnClass = 'border-zinc-800 text-zinc-500 bg-zinc-950/20 active:bg-zinc-900';

            if (isHighlighted) {
              if (isPrimaryLock) {
                // Highlighting the exact targeted letter
                btnClass = `${getThemeActiveBgClass()} animate-pulse scale-102 font-bold`;
              } else {
                // Highlighting possible startup options
                btnClass = `${getThemeTextClass()} font-semibold`;
              }
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => onKeyPress(caseInsensitive ? key.toLowerCase() : key)}
                className={`flex-1 h-9 sm:h-10 text-[11px] sm:text-xs font-mono rounded border flex items-center justify-center transition-all cursor-pointer hover:border-zinc-700/80 ${btnClass}`}
              >
                {key}
              </button>
            );
          })}

          {rowIdx === 1 && <div className="w-[1.5%]" />}
          {rowIdx === 2 && <div className="w-[3%]" />}
        </div>
      ))}
    </div>
  );
};
