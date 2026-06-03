/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Word {
  id: string;
  text: string;
  x: number; // Percent width (e.g. 10 to 80)
  y: number; // Percent height (0 at top, drifts toward 100 at bottom)
  speed: number; // Drift speed (percent per second)
  typedCharCount: number; // How many correct characters have been typed so far
  category: WordCategory | string;
  charSpeeds?: number[]; // Timing array for letters (optional)
  
  // Tactical Word Classes
  class?: 'standard' | 'cloaked' | 'regenerative' | 'shield_charger';
  isStealth?: boolean; // For cloaked: flashes in and out
  lastActivity?: number; // For regenerative: tracks time for auto-repair
  isBoss?: boolean; // For Co-op giant boss phrases
}

export type WordCategory = 'common' | 'tech' | 'cinematic' | 'chaos';

export interface GameStats {
  score: number;
  streak: number;
  maxStreak: number;
  correctChars: number;
  incorrectChars: number;
  totalKeystrokes: number;
  wordsTyped: number;
  wordsMissed: number;
  wpm: number;
  accuracy: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'chaos';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
}

export type GameMode = 'solo' | 'duel_vs_ai' | 'online_duel' | 'coop_containment' | 'practice' | 'casual' | 'spectator' | 'challenge';

export interface LeaderboardEntry {
  wpm: number;
  accuracy: number;
  score: number;
  category: string;
  difficulty: string;
  timestamp: string;
}

export type InputMode = 'hybrid' | 'touch_keyboard' | 'assisted_tap' | 'native_mobile';

export type PerformancePreset = 'performance' | 'efficiency';

export interface AccessibilitySettings {
  oneHanded: 'none' | 'left' | 'right';
  largeText: boolean;
  reducedMotion: boolean;
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
}
