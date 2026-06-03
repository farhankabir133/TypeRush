/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Word, GameStats, Difficulty, WordCategory, GameMode, LeaderboardEntry } from './types';
import { gameAudio } from './audio';
import { getRandomWord, WORD_BANKS } from './words';
import { HUD } from './components/HUD';
import { WordEntity } from './components/WordEntity';
import { EffectsLayer, EffectsLayerRef } from './components/EffectsLayer';
import { EndScreen } from './components/EndScreen';

// Lucide icon integrations
import { 
  Shield, Play, Terminal, HelpCircle, Layers, Zap, Info, 
  RotateCcw, Sparkles, User, LogOut, Radio, Send, Sword, 
  Tv, Crosshair, HelpCircle as HelpIcon, Trophy, Plus, CheckCircle, Flame
} from 'lucide-react';

// Firebase integrations
import { auth, db, googleProvider, signInWithPopup, signOut } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, doc, setDoc, addDoc, onSnapshot, getDocs, 
  query, where, orderBy, limit, deleteDoc, updateDoc, writeBatch 
} from 'firebase/firestore';

export default function App() {
  // Game State Lifecycle
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'ended'>('lobby');
  
  // Custom Settings (Configurable in lobby)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [category, setCategory] = useState<WordCategory | string>('cinematic');
  const [neonThemeColor, setNeonThemeColor] = useState<string>('cyan');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [caseInsensitive, setCaseInsensitive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [laserStyle, setLaserStyle] = useState<'ring' | 'crosshair' | 'quantum'>('quantum');

  // Gameplay Mode Settings
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  
  // Simulation values (Combat Shield + Active Tracking refs)
  const [shieldHealth, setShieldHealth] = useState<number>(100);
  const [words, setWords] = useState<Word[]>([]);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  // Active Glitch state flag
  const [localGlitchEffect, setLocalGlitchEffect] = useState<boolean>(false);
  const [opponentName, setOpponentName] = useState<string>('Rogue Core AI');
  const [opponentWpm, setOpponentWpm] = useState<number>(0);
  const [opponentStreak, setOpponentStreak] = useState<number>(0);
  const [opponentShield, setOpponentShield] = useState<number>(100);

  // Co-op containment P2 simulated telemetry
  const [p2Score, setP2Score] = useState<number>(0);

  // Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    maxStreak: 0,
    correctChars: 0,
    incorrectChars: 0,
    totalKeystrokes: 0,
    wordsTyped: 0,
    wordsMissed: 0,
    wpm: 0,
    accuracy: 0,
  });

  // Safe timers list & frame tracking refs
  const wordsRef = useRef<Word[]>([]);
  const activeWordIdRef = useRef<string | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const effectsRef = useRef<EffectsLayerRef | null>(null);
  const shakeIntensityRef = useRef<number>(0);
  const [shakeActive, setShakeActive] = useState<boolean>(false);

  // --- Algorithmic Theme Synthesis (AI Lexicon) attributes ---
  const [themePrompt, setThemePrompt] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesizedTheme, setSynthesizedTheme] = useState<{
    name: string;
    description: string;
    words: { word: string; overlay: string; tier: string }[];
  } | null>(null);

  // --- Firebase authentication states ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [localHistory, setLocalHistory] = useState<LeaderboardEntry[]>([]);
  const [isLinkingAuth, setIsLinkingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // --- Real-time Multiplayer room states ---
  const [roomIdInput, setRoomIdInput] = useState<string>('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomHostName, setRoomHostName] = useState<string>('');
  const [roomGuestName, setRoomGuestName] = useState<string>('');
  const [isRoomOwner, setIsRoomOwner] = useState<boolean>(false);
  const [roomMatchmakingStatus, setRoomMatchmakingStatus] = useState<'idle' | 'creating' | 'joining' | 'lobby' | 'countdown' | 'fight'>('idle');
  const [multiplayerCountdown, setMultiplayerCountdown] = useState<number>(5);

  // High Scores local state helper
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('cinematic_typing_high_score')) || 0;
    } catch {
      return 0;
    }
  });

  // Track key activities for Regenerative Phrase restoration check
  const lastKeyTimeRef = useRef<number>(Date.now());

  // Set up Firebase Auth listener & Load telemetry summaries
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load settings and diagnostic results from Cloud DB
        loadCloudHistory(user.uid);
      } else {
        // Fallback to local highscore
        setLocalHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const anonymousAuth = async () => {
    setIsLinkingAuth(true);
    setAuthError('');
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication firewall rejected anonymous connection.');
    } finally {
      setIsLinkingAuth(false);
    }
  };

  const googleAuth = async () => {
    setIsLinkingAuth(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication firewall rejected Google sync.');
    } finally {
      setIsLinkingAuth(false);
    }
  };

  const logoutAuth = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const loadCloudHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, `users/${uid}/diagnostics`),
        orderBy('timestamp', 'desc'),
        limit(15)
      );
      const snapshot = await getDocs(q);
      const items: LeaderboardEntry[] = [];
      snapshot.forEach(doc => {
        items.push(doc.data() as LeaderboardEntry);
      });
      setLocalHistory(items);
    } catch (err) {
      console.warn('Cloud leaderboard loading limited or bypassed:', err);
    }
  };

  // Sync state mute to audio engine
  useEffect(() => {
    gameAudio.setMuted(isMuted);
  }, [isMuted]);

  // Map difficulty levels to configuration values
  const getDifficultySettings = useCallback((diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return { spawnInterval: 3100, baseSpeed: 4.8, damage: 8 };
      case 'medium':
        return { spawnInterval: 2300, baseSpeed: 7.2, damage: 12 };
      case 'hard':
        return { spawnInterval: 1600, baseSpeed: 10.8, damage: 18 };
      case 'chaos':
        return { spawnInterval: 1050, baseSpeed: 13.5, damage: 24 };
    }
  }, []);

  // Sync references to prevent re-entering state mismatches during animation frames
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    activeWordIdRef.current = activeWordId;
  }, [activeWordId]);

  // Dynamic colors mapper
  const getThemeHexColor = useCallback((name: string = neonThemeColor) => {
    switch (name) {
      case 'cyan': return '#06b6d4';
      case 'purple': return '#a855f7';
      case 'green': return '#10b981';
      case 'pink': return '#f43f5e';
      default: return '#06b6d4';
    }
  }, [neonThemeColor]);

  // Trigger algorithmic AI Theme Synthesis
  const handleSynthesizeTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themePrompt || themePrompt.trim().length === 0) return;

    setIsSynthesizing(true);
    gameAudio.init();
    gameAudio.playGlitch();

    try {
      const response = await fetch('/api/gemini/lexicon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: themePrompt }),
      });

      if (!response.ok) {
        throw new Error('Neural generator returned connection breakdown.');
      }

      const rawData = await response.json();
      if (rawData.words && rawData.words.length > 0) {
        setSynthesizedTheme({
          name: rawData.themeName || themePrompt,
          description: rawData.description || 'Holographically compiled dynamic database.',
          words: rawData.words,
        });
        setCategory(rawData.themeName);
        if (rawData.neonAccent) {
          setNeonThemeColor(rawData.neonAccent);
        }
        gameAudio.playLevelUp();
      }
    } catch (err: any) {
      console.warn('Synthesis fallbacks employed:', err);
      // Construct robust local fallback based on their prompt prefix
      const dummyThemedWords = [
        { word: 'QUANTUMPULSE', overlay: 'Microscopic wave packets', tier: 'legendary' },
        { word: 'NEURALDRIVE', overlay: 'Sync cognitive core', tier: 'rare' },
        { word: 'GRAVITON', overlay: 'Bends light pathways', tier: 'common' },
        { word: 'SPECTRAL', overlay: 'Holographic dust dispersion', tier: 'rare' },
        { word: 'ORBITAL', overlay: 'Centripetal energy node', tier: 'common' }
      ];
      setSynthesizedTheme({
        name: `FALLBACK // ${themePrompt.toUpperCase()}`,
        description: 'Bypassed offline local synthesization.',
        words: dummyThemedWords
      });
      setCategory(`FALLBACK // ${themePrompt.toUpperCase()}`);
      setNeonThemeColor('purple');
      gameAudio.playLevelUp();
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Clean custom synthesize theme
  const clearSynthesizedTheme = () => {
    setSynthesizedTheme(null);
    setCategory('cinematic');
    setNeonThemeColor('cyan');
  };

  // Real-time Online Room Matchmaking listeners
  useEffect(() => {
    if (!activeRoomId) return;

    const roomRef = doc(db, 'matchrooms', activeRoomId);
    let opponentCheckTimer: any = null;

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setActiveRoomId(null);
        setRoomMatchmakingStatus('idle');
        return;
      }

      const roomData = snapshot.data();
      setRoomHostName(roomData.hostName || '');
      setRoomGuestName(roomData.guestName || '');

      // Handle Guest Joinee
      if (roomData.guestId && roomMatchmakingStatus === 'creating') {
        setRoomMatchmakingStatus('lobby');
      }

      // Handle Real-time Duel Status changes
      if (roomData.status === 'active' && roomMatchmakingStatus === 'lobby') {
        setRoomMatchmakingStatus('countdown');
        setMultiplayerCountdown(5);
      }

      // Read live telemetry updates of opponent
      if (isRoomOwner) {
        if (roomData.guestId) {
          setOpponentName(roomData.guestName || 'Secure Node');
          setOpponentWpm(roomData.guestWpm || 0);
          setOpponentStreak(roomData.guestStreak || 0);
          setOpponentShield(roomData.guestShieldHealth !== undefined ? roomData.guestShieldHealth : 100);
        }
        // Guest sends glitch to Host
        if (roomData.guestGlitch) {
          triggerGlitchHit(roomData.guestGlitch);
          updateDoc(roomRef, { guestGlitch: '' }).catch(console.error); // Reset field
        }
      } else {
        setOpponentName(roomData.hostName || 'Terminal Host');
        setOpponentWpm(roomData.hostWpm || 0);
        setOpponentStreak(roomData.hostStreak || 0);
        setOpponentShield(roomData.hostShieldHealth !== undefined ? roomData.hostShieldHealth : 100);

        // Host sends glitch to Guest
        if (roomData.hostGlitch) {
          triggerGlitchHit(roomData.hostGlitch);
          updateDoc(roomRef, { hostGlitch: '' }).catch(console.error); // Reset field
        }
      }

      // Remote shutdown
      if (roomData.status === 'ended' && gameState === 'playing') {
        setGameState('ended');
      }
    }, (err) => {
      console.error('Room subscription failure:', err);
    });

    return () => {
      unsubscribe();
      if (opponentCheckTimer) clearInterval(opponentCheckTimer);
    };
  }, [activeRoomId, isRoomOwner, roomMatchmakingStatus, gameState]);

  // Triggers visual scrambled cloaking overlay and sound distortion on screen
  const triggerGlitchHit = (type: string) => {
    setLocalGlitchEffect(true);
    gameAudio.playGlitch();
    shakeIntensityRef.current = 18;
    setShakeActive(true);
    setTimeout(() => {
      setLocalGlitchEffect(false);
      setShakeActive(false);
    }, 1500);
  };

  // Countdown timer trigger
  useEffect(() => {
    let timer: any = null;
    if (roomMatchmakingStatus === 'countdown') {
      timer = setInterval(() => {
        setMultiplayerCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            launchMultiplayerGame();
            return 0;
          }
          gameAudio.playKeypress(2.0);
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [roomMatchmakingStatus]);

  const launchMultiplayerGame = () => {
    setRoomMatchmakingStatus('fight');
    startGame();
  };

  // Create an Online Room doc
  const handleCreateRoom = async () => {
    if (!currentUser) return;
    setRoomMatchmakingStatus('creating');
    const newRoomId = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
    setIsRoomOwner(true);
    setActiveRoomId(newRoomId);

    try {
      await setDoc(doc(db, 'matchrooms', newRoomId), {
        roomId: newRoomId,
        hostId: currentUser.uid,
        hostName: currentUser.displayName || `NEURAL-UNIT-${newRoomId.split('-')[1]}`,
        hostWpm: 0,
        hostStreak: 0,
        hostShieldHealth: 100,
        hostGlitch: '',
        status: 'waiting',
        gameMode: 'duel',
        selectedLexicon: synthesizedTheme ? JSON.stringify(synthesizedTheme.words) : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setRoomMatchmakingStatus('creating');
    } catch (err: any) {
      console.error('Room creation failure:', err);
      setRoomMatchmakingStatus('idle');
      setActiveRoomId(null);
    }
  };

  // Join existing Online Room doc
  const handleJoinRoom = async () => {
    if (!currentUser || !roomIdInput) return;
    const cleanRoomId = roomIdInput.trim().toUpperCase();
    setRoomMatchmakingStatus('joining');

    try {
      const roomRef = doc(db, 'matchrooms', cleanRoomId);
      await updateDoc(roomRef, {
        guestId: currentUser.uid,
        guestName: currentUser.displayName || `GUEST-${cleanRoomId.split('-')[1] || '404'}`,
        guestWpm: 0,
        guestStreak: 0,
        guestShieldHealth: 100,
        guestGlitch: '',
        status: 'active', // Trigger countdown for both sides!
        updatedAt: new Date().toISOString()
      });
      setIsRoomOwner(false);
      setActiveRoomId(cleanRoomId);
      setRoomMatchmakingStatus('countdown');
      setMultiplayerCountdown(5);
    } catch (err) {
      console.error('Room join failed:', err);
      setRoomMatchmakingStatus('idle');
      setRoomIdInput('');
    }
  };

  const handleAbortMatchmaking = async () => {
    if (activeRoomId && isRoomOwner) {
      try {
        await deleteDoc(doc(db, 'matchrooms', activeRoomId));
      } catch (e) {}
    }
    setActiveRoomId(null);
    setRoomMatchmakingStatus('idle');
  };

  // Spawn an individual floating word entity
  const spawnWord = useCallback(() => {
    let text = '';
    let wordClass: 'standard' | 'cloaked' | 'regenerative' | 'shield_charger' = 'standard';

    // 1. Synthesized word override vs Standard word banks access
    if (synthesizedTheme && synthesizedTheme.words.length > 0) {
      const bank = synthesizedTheme.words;
      const index = Math.floor(Math.random() * bank.length);
      text = bank[index].word;
    } else {
      text = getRandomWord(category as WordCategory);
    }

    // 2. Map word to tactical threat profiles based on random metrics
    const rand = Math.random();
    if (rand < 0.14) {
      wordClass = 'cloaked';
    } else if (rand >= 0.14 && rand < 0.28) {
      wordClass = 'regenerative';
    } else if (rand >= 0.28 && rand < 0.38) {
      wordClass = 'shield_charger';
    }

    const settings = getDifficultySettings(difficulty);

    // Speed varies slightly (+/- 20% for random drift) to feel organic
    const speedVariation = 0.8 + Math.random() * 0.4;
    const finalSpeed = settings.baseSpeed * speedVariation;

    // Boss Giant phrases in co-op mode or with 6% chance in chaos solo
    const isBossSpawn = gameMode === 'coop_containment' && Math.random() < 0.15;
    if (isBossSpawn) {
      text = 'CONTAINMENT_OVERLOAD';
      wordClass = 'standard';
    }

    // Choose a random x percentage position to avoid sticking near edges
    const x = 15 + Math.random() * 70; 

    const newWord: Word = {
      id: `${Date.now()}-${Math.random()}`,
      text: localGlitchEffect && Math.random() < 0.3 ? text.split('').reverse().join('') : text, // Glitched scrambling
      x,
      y: -5, // Start slightly offscreen top
      speed: isBossSpawn ? finalSpeed * 0.4 : finalSpeed,
      typedCharCount: 0,
      category,
      class: wordClass,
      isStealth: false,
      lastActivity: Date.now(),
      isBoss: isBossSpawn
    };

    setWords(prev => [...prev, newWord]);
  }, [category, difficulty, getDifficultySettings, gameMode, synthesizedTheme, localGlitchEffect]);

  // Main high-precision animation physics frame loops running at 60fps
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      return;
    }

    let lastTick = performance.now();
    let cloakingTimer = 0;

    const loop = (now: number) => {
      const deltaSeconds = (now - lastTick) / 1000;
      lastTick = now;

      // Handle Cloaked flashing intermittently
      cloakingTimer += deltaSeconds;
      const isStealthTick = Math.sin(cloakingTimer * 4) > 0;

      // AI Opponent simulation (duel vs AI chatbot)
      if (gameMode === 'duel_vs_ai') {
        setOpponentWpm(prevWpm => {
          const targetWpm = stats.wpm > 0 ? stats.wpm * (difficulty === 'easy' ? 0.75 : difficulty === 'medium' ? 0.95 : 1.25) : 35;
          return prevWpm + (targetWpm - prevWpm) * 0.04;
        });
        setOpponentStreak(prev => {
          if (Math.random() < 0.01) return 0; // AI Miss loop
          return prev + (Math.random() < 0.12 ? 1 : 0);
        });
        // Opponent shield decay slightly matching difficulty
        setOpponentShield(prev => {
          const hazard = difficulty === 'easy' ? 0.05 : difficulty === 'medium' ? 0.1 : 0.25;
          const decay = Math.random() < hazard ? 0.5 : 0;
          return Math.max(10, prev - decay);
        });
      }

      // Co-op containment partner simulation
      if (gameMode === 'coop_containment') {
        setP2Score(prev => prev + (Math.random() < 0.05 ? 15 : 0));
      }

      setWords(prevWords => {
        const nextWords: Word[] = [];

        prevWords.forEach(word => {
          // Calculate movement increment based on exact delta-seconds
          const movement = word.speed * deltaSeconds;
          const nextY = word.y + movement;

          // Repair regenerative words if idle for more than 2s
          let updatedTypedCount = word.typedCharCount;
          if (word.class === 'regenerative' && updatedTypedCount > 0 && word.lastActivity) {
            const idleSec = (now - word.lastActivity) / 1000;
            if (idleSec > 2.0) {
              updatedTypedCount = 0; // Word repairs its protective shields
              gameAudio.playGlitch();
            }
          }

          if (nextY >= 85) {
            // Collision containment breach with the active danger shield barrier!
            if (activeWordIdRef.current === word.id) {
              setActiveWordId(null);
            }
            
            // Strike statistics deduction
            setStats(prev => ({
              ...prev,
              streak: 0,
              wordsMissed: prev.wordsMissed + 1,
            }));

            // Hit primary systems shield (boss does double damage!)
            const settings = getDifficultySettings(difficulty);
            const rawDamage = word.isBoss ? settings.damage * 2.5 : settings.damage;
            setShieldHealth(health => {
              const currentHealth = Math.max(0, health - rawDamage);
              if (currentHealth <= 0) {
                // Critical hull breakdown -> game ended!
                setGameState('ended');
                handleRunFinished();
                gameAudio.playMiss();
              }
              return currentHealth;
            });

            // Trigger alarms on Effects canvas & deep audio hits
            gameAudio.playMiss();
            if (effectsRef.current) {
              effectsRef.current.triggerShieldStrikeEvent();
              effectsRef.current.triggerStreakBreakGlitch();
            }

            // Screen shake triggering
            shakeIntensityRef.current = 15;
            setShakeActive(true);
            setTimeout(() => setShakeActive(false), 350);

          } else {
            nextWords.push({
              ...word,
              y: nextY,
              typedCharCount: updatedTypedCount,
              isStealth: isStealthTick
            });
          }
        });

        // Track danger proximity (proximity of the highest word to shield line)
        if (nextWords.length > 0) {
          const maxGrad = Math.max(...nextWords.map(w => w.y));
          // Scale proximity ratio between y=50% and y=85%
          const scaleProximity = maxGrad > 50 ? (maxGrad - 50) / 35 : 0;
          gameAudio.setDangerProximity(scaleProximity);
        } else {
          gameAudio.setDangerProximity(0);
        }

        return nextWords;
      });

      // Live update of background drone pitches using active WPM and combo streaks
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      setStats(prev => {
        const correct = prev.correctChars;
        const total = prev.totalKeystrokes;
        const currentWpm = elapsedSec > 2 ? (correct / 5) / (elapsedSec / 60) : 0;
        const calculatedAcc = total > 0 ? (correct / total) * 100 : 0;

        // Feedback sound context dynamics
        gameAudio.updateAmbientDrone(prev.streak, currentWpm);

        return {
          ...prev,
          wpm: currentWpm,
          accuracy: calculatedAcc,
        };
      });

      // Clear shake intensity
      if (shakeIntensityRef.current > 0) {
        shakeIntensityRef.current -= 0.5;
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState, difficulty, getDifficultySettings, gameMode, stats.wpm]);

  // Hook and update real-time multiplayer lobbies
  useEffect(() => {
    if (gameState !== 'playing' || !activeRoomId) return;

    // Send constant telemetry reports to room document
    const timer = setInterval(() => {
      const roomRef = doc(db, 'matchrooms', activeRoomId);
      const updates = isRoomOwner ? {
        hostWpm: stats.wpm,
        hostStreak: stats.streak,
        hostShieldHealth: shieldHealth,
        updatedAt: new Date().toISOString()
      } : {
        guestWpm: stats.wpm,
        guestStreak: stats.streak,
        guestShieldHealth: shieldHealth,
        updatedAt: new Date().toISOString()
      };
      
      updateDoc(roomRef, updates).catch(console.error);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, activeRoomId, stats.wpm, stats.streak, shieldHealth, isRoomOwner]);

  // Interval timer for spawning drifting items
  useEffect(() => {
    if (gameState !== 'playing') return;

    const settings = getDifficultySettings(difficulty);
    
    // Spawn immediate initial words to start fluidly
    spawnWord();
    setTimeout(spawnWord, 1000);

    const intervalId = setInterval(spawnWord, settings.spawnInterval);
    return () => clearInterval(intervalId);
  }, [gameState, difficulty, spawnWord, getDifficultySettings]);

  // Securely upload telemetry of game finished metrics to Cloud
  const handleRunFinished = async () => {
    if (activeRoomId) {
      // Abrupt ending sync
      const roomRef = doc(db, 'matchrooms', activeRoomId);
      updateDoc(roomRef, { status: 'ended' }).catch(console.error);
    }

    if (currentUser) {
      try {
        const runData = {
          wpm: stats.wpm,
          accuracy: stats.accuracy,
          score: stats.score,
          maxStreak: stats.maxStreak,
          category: String(category),
          difficulty,
          timestamp: new Date().toISOString()
        };
        await addDoc(collection(db, `users/${currentUser.uid}/diagnostics`), runData);
        // Refresh local graph layout metrics
        loadCloudHistory(currentUser.uid);
      } catch (err) {
        console.error('Cloud archive synchronization error:', err);
      }
    }
  };

  // Real-time tracking system for keystroke events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Fast-bypass inputs on modifier keys or menus
    if (gameState !== 'playing') return;
    if (e.key === 'Escape' || e.metaKey || e.ctrlKey || e.altKey) return;

    // Filter valid typed characters (alphanumerics, syntax operators, etc)
    const typedChar = e.key;
    if (typedChar.length !== 1) return;

    // Wake and initialize audio engine under explicit player permission gesture
    gameAudio.init();

    lastKeyTimeRef.current = performance.now();

    setStats(prev => ({
      ...prev,
      totalKeystrokes: prev.totalKeystrokes + 1,
    }));

    const currentWords = wordsRef.current;
    const currentActiveId = activeWordIdRef.current;

    if (currentActiveId) {
      // Locking target active! Verify character alignment
      const activeWord = currentWords.find(w => w.id === currentActiveId);
      if (!activeWord) {
        setActiveWordId(null);
        return;
      }

      // Check for Regenerative Phrase activity timestamp update
      if (activeWord.class === 'regenerative') {
        activeWord.lastActivity = performance.now();
      }

      const nextExpectedChar = activeWord.text[activeWord.typedCharCount];
      const isMatch = caseInsensitive
        ? typedChar.toLowerCase() === nextExpectedChar.toLowerCase()
        : typedChar === nextExpectedChar;

      if (isMatch) {
         // Correct progression
         const updatedTypedCount = activeWord.typedCharCount + 1;
         
         // Tick sound
         const wpmSpeedFactor = stats.wpm / 100;
         gameAudio.playKeypress(1.0 + wpmSpeedFactor);

         // Flash laser reticle based on laserStyle
         effectsRef.current?.triggerKeyFlash(neonThemeColor);

         setStats(prev => ({
           ...prev,
           correctChars: prev.correctChars + 1,
         }));

         if (updatedTypedCount === activeWord.text.length) {
           // Complete elimination of target word!
           gameAudio.playSuccess();
           effectsRef.current?.spawnWordExplosion(
             activeWord.x,
             activeWord.y,
             activeWord.text,
             neonThemeColor
           );

           // Extra features check: Shield Charger health restoration
           if (activeWord.class === 'shield_charger') {
             setShieldHealth(h => Math.min(100, h + 12));
             effectsRef.current?.triggerShieldStrikeEvent(); // Golden sparkles burst effect
           }

           // Duel Payload Glitch trigger to opponent
           if (activeWord.text.length >= 6 && (gameMode === 'duel_vs_ai' || gameMode === 'online_duel')) {
             triggerGlitchToOpponent();
           }

           // Clear word from listing
           setWords(prev => prev.filter(w => w.id !== currentActiveId));
           setActiveWordId(null);

           // Update game stats score (+length*15 * multiplier combo)
           setStats(prev => {
             const wordLengthScore = activeWord.text.length * 15;
             const streakBonus = Math.floor(prev.streak / 5) * 10;
             const finalIncrement = wordLengthScore + streakBonus;
             const updatedScore = prev.score + finalIncrement;
             const nextStreak = prev.streak + 1;
             const maxStk = Math.max(prev.maxStreak, nextStreak);

             // High score persistence
             if (updatedScore > highScore) {
               setHighScore(updatedScore);
               try {
                 localStorage.setItem('cinematic_typing_high_score', String(updatedScore));
               } catch (_) {}
             }

             return {
               ...prev,
               score: updatedScore,
               streak: nextStreak,
               maxStreak: maxStk,
               wordsTyped: prev.wordsTyped + 1,
             };
           });

         } else {
           // Increment partial target matches
           setWords(prev =>
             prev.map(w => (w.id === currentActiveId ? { ...w, typedCharCount: updatedTypedCount } : w))
           );
         }

      } else {
        // Strike mismatch glitch
        gameAudio.playGlitch();
        effectsRef.current?.triggerStreakBreakGlitch();
        setStats(prev => ({
          ...prev,
          streak: 0,
          incorrectChars: prev.incorrectChars + 1,
        }));
      }

    } else {
      // No active target lock! Look for matching start character
      const candidates = currentWords.filter(word => {
        const firstChar = word.text[0];
        return caseInsensitive
          ? typedChar.toLowerCase() === firstChar.toLowerCase()
          : typedChar === firstChar;
      });

      if (candidates.length > 0) {
        // Target acquisition lock! Prioritize closest (highest Y coordinate)
        candidates.sort((a, b) => b.y - a.y);
        const targetedWord = candidates[0];

        setActiveWordId(targetedWord.id);
        
        // Progress primary character
        setWords(prev =>
          prev.map(w => (w.id === targetedWord.id ? { ...w, typedCharCount: 1 } : w))
        );

        // Sound & FX
        gameAudio.playKeypress(1.2);
        effectsRef.current?.triggerKeyFlash(neonThemeColor);

        setStats(prev => ({
          ...prev,
          correctChars: prev.correctChars + 1,
        }));

        // Special: single letter words cleared immediately
        if (targetedWord.text.length === 1) {
          gameAudio.playSuccess();
          effectsRef.current?.spawnWordExplosion(
            targetedWord.x,
            targetedWord.y,
            targetedWord.text,
            neonThemeColor
          );
          setWords(prev => prev.filter(w => w.id !== targetedWord.id));
          setActiveWordId(null);
          setStats(prev => {
            const nextScore = prev.score + 25;
            const nextStreak = prev.streak + 1;
            return {
              ...prev,
              score: nextScore,
              streak: nextStreak,
              maxStreak: Math.max(prev.maxStreak, nextStreak),
              wordsTyped: prev.wordsTyped + 1,
            };
          });
        }

      } else {
        // Typed random key with no target locks (non-damaging high-pitch hum tick)
        gameAudio.playKeypress(0.7);
        setStats(prev => ({
          ...prev,
          incorrectChars: prev.incorrectChars + 1,
        }));
      }
    }
  }, [gameState, caseInsensitive, neonThemeColor, stats.wpm, highScore, gameMode]);

  // Handle Payload Glitch trigger across Firestore or local AI
  const triggerGlitchToOpponent = () => {
    if (effectsRef.current) {
      effectsRef.current.triggerKeyFlash('pink'); // Burst notification
    }
    gameAudio.playGlitch();

    if (gameMode === 'duel_vs_ai') {
      // Trigger temporary degradation on Bot AI
      setOpponentWpm(prev => Math.max(10, prev - 15));
      setOpponentShield(prev => Math.max(10, prev - 8));
    } else if (gameMode === 'online_duel' && activeRoomId) {
      const roomRef = doc(db, 'matchrooms', activeRoomId);
      const updateData = isRoomOwner ? { hostGlitch: 'scramble' } : { guestGlitch: 'scramble' };
      updateDoc(roomRef, updateData).catch(console.error);
    }
  };

  // Hook typing events listeners to global window scope
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startGame = () => {
    // Wipe stats
    setStats({
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctChars: 0,
      incorrectChars: 0,
      totalKeystrokes: 0,
      wordsTyped: 0,
      wordsMissed: 0,
      wpm: 0,
      accuracy: 0,
    });
    setShieldHealth(100);
    setWords([]);
    setActiveWordId(null);
    setGameState('playing');
    startTimeRef.current = performance.now();
    lastSpawnTimeRef.current = performance.now();

    // Trigger audio wake-up chime
    gameAudio.init();
    if (gameAudio.getMuted() !== isMuted) {
      gameAudio.setMuted(isMuted);
    }
    setTimeout(() => {
      gameAudio.playLevelUp();
    }, 100);
  };

  const backToMenu = () => {
    setGameState('lobby');
    setRoomMatchmakingStatus('idle');
    setActiveRoomId(null);
  };

  // Colors mapping styles
  const getThemeTextClass = (name: string = neonThemeColor) => {
    switch (name) {
      case 'cyan': return 'text-cyan-400';
      case 'purple': return 'text-purple-400';
      case 'green': return 'text-emerald-400';
      case 'pink': return 'text-rose-400';
      default: return 'text-cyan-400';
    }
  };

  const getThemeBorderClass = (name: string = neonThemeColor) => {
    switch (name) {
      case 'cyan': return 'border-cyan-500/40 text-cyan-400';
      case 'purple': return 'border-purple-500/40 text-purple-400';
      case 'green': return 'border-emerald-500/40 text-emerald-400';
      case 'pink': return 'border-rose-500/40 text-rose-400';
      default: return 'border-cyan-500/40 text-cyan-400';
    }
  };

  const getThemeBgClass = (name: string = neonThemeColor) => {
    switch (name) {
      case 'cyan': return 'bg-cyan-950/20';
      case 'purple': return 'bg-purple-950/20';
      case 'green': return 'bg-emerald-950/20';
      case 'pink': return 'bg-rose-950/20';
      default: return 'bg-cyan-950/20';
    }
  };

  const getThemeTextGlowClass = (name: string = neonThemeColor) => {
    switch (name) {
      case 'cyan': return 'text-cyan-400 glow-cyan border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-900/30';
      case 'purple': return 'text-purple-400 glow-purple border-purple-500/30 bg-purple-950/10 hover:bg-purple-900/30';
      case 'green': return 'text-emerald-400 glow-green border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-900/30';
      case 'pink': return 'text-rose-400 glow-pink border-rose-500/30 bg-rose-950/10 hover:bg-rose-900/30';
      default: return 'text-cyan-400 glow-cyan border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-900/30';
    }
  };

  const getThemeAmbientGlows = () => {
    switch (neonThemeColor) {
      case 'cyan': return { top: 'bg-cyan-500/10', bottom: 'bg-purple-500/10' };
      case 'purple': return { top: 'bg-purple-500/10', bottom: 'bg-pink-500/10' };
      case 'green': return { top: 'bg-emerald-500/10', bottom: 'bg-cyan-500/10' };
      case 'pink': return { top: 'bg-rose-500/10', bottom: 'bg-amber-500/10' };
      default: return { top: 'bg-cyan-500/10', bottom: 'bg-purple-500/10' };
    }
  };

  const getThemeReticleClass = () => {
    switch (neonThemeColor) {
      case 'cyan': return { border: 'border-cyan-400/20', text: 'text-cyan-400/40', activeGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' };
      case 'purple': return { border: 'border-purple-400/20', text: 'text-purple-400/40', activeGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' };
      case 'green': return { border: 'border-emerald-400/20', text: 'text-emerald-400/40', activeGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' };
      case 'pink': return { border: 'border-rose-400/20', text: 'text-rose-400/40', activeGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' };
      default: return { border: 'border-cyan-400/20', text: 'text-cyan-400/40', activeGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' };
    }
  };

  const glows = getThemeAmbientGlows();
  const reticle = getThemeReticleClass();

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-[#030304] text-zinc-100 font-sans flex flex-col antialiased select-none ${localGlitchEffect ? 'animate-pulse' : ''}`}>
      
      {/* Cinematic CRT scanlines overlay */}
      <div className="absolute inset-0 scanline-bg opacity-20 pointer-events-none z-30" />

      {/* Grid line matrix backdrop */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* Theme specific blur gradients */}
      <div className={`absolute top-[-10%] left-[-15%] w-[50%] h-[50%] ${glows.top} rounded-full blur-[140px] pointer-events-none z-0`} />
      <div className={`absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] ${glows.bottom} rounded-full blur-[140px] pointer-events-none z-0`} />

      {/* Floating debris cloud */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl bg-zinc-900/10 animate-float-dust z-0" />

      <div className={`relative w-full h-full flex flex-col z-20 ${shakeActive ? 'animate-shake' : ''}`}>
        
        {/* ==================== 1. COGNITIVE TERMINAL LOBBY ==================== */}
        {gameState === 'lobby' && (
          <div className="flex-grow flex flex-col items-center justify-start overflow-y-auto px-4 py-8 md:py-12 z-40">
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Profile Link and Cloud sync panel */}
              <div className="lg:col-span-12 flex flex-col sm:flex-row justify-between items-center bg-[#070709]/85 border border-white/[0.03] backdrop-blur-md rounded-xl p-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${getThemeBorderClass()}`}>
                    <User size={14} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] font-mono tracking-widest text-zinc-500">OPERATIVE ID:</span>
                    <span className="block font-mono text-xs font-semibold text-zinc-300">
                      {currentUser ? (currentUser.displayName || currentUser.uid.slice(0, 12)) : 'OFFLINE_SANDBOX_MODE'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!currentUser ? (
                    <>
                      <button 
                        onClick={anonymousAuth} 
                        disabled={isLinkingAuth}
                        className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 transition duration-150 cursor-pointer"
                      >
                        ANON BYPASS
                      </button>
                      <button 
                        onClick={googleAuth} 
                        disabled={isLinkingAuth}
                        className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-1.5 transition duration-150 cursor-pointer"
                      >
                        <Sparkles size={11} className="text-amber-400" />
                        LINK GOOGLE SYNC
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={logoutAuth}
                      className="px-3 py-1.5 rounded bg-zinc-950 border border-zinc-900 text-[10px] font-mono text-zinc-500 hover:text-red-400 hover:border-red-950/50 flex items-center gap-1.5 transition duration-150 cursor-pointer"
                    >
                      <LogOut size={11} /> SIGNOUT COGNITIVE LINK
                    </button>
                  )}
                </div>
              </div>

              {/* Lobby Columns Configuration */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Main Console Branding Area */}
                <div className={`bg-[#070709]/75 border border-white/[0.02] rounded-2xl p-6 backdrop-blur-md shadow-2xl box-glow-${neonThemeColor} transition-all duration-300`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800/80 mb-3 text-[9px] tracking-[0.2em] font-mono text-zinc-500">
                      <Terminal size={12} className={getThemeTextClass()} /> METRIC SYNAPSE SYSTEMS v1.8
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-white uppercase">
                      TYPE<span className={getThemeTextClass()}>RUSH</span>
                    </h1>
                    
                    <p className="text-zinc-500 text-xs font-mono mt-2 leading-relaxed max-w-lg">
                      Defend your primary containment shield metrics against flying thematic debris. Engage laser buffers, survive high velocities, and hack orbital duels.
                    </p>
                  </div>
                </div>

                {/* Algorithmic Theme Synthesis Form (Gemini Integration) */}
                <div className="bg-[#070709]/75 border border-white/[0.02] rounded-2xl p-6 backdrop-blur-md">
                  <h2 className="font-mono text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500 animate-pulse" /> ALGORITHMIC THEME SYNTHESIS (GEMINI POWERED)
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono mb-4 leading-relaxed">
                    Type an abstract prompt below. Our generative core will forge custom vocabularies, ambient accent colors, and sensory dictionary definitions on-demand.
                  </p>
                  
                  <form onSubmit={handleSynthesizeTheme} className="flex gap-2 mb-3">
                    <input 
                      type="text"
                      placeholder="e.g. quantum entanglement calculus, 1980s retro cyber grid, hyperborean maritime tales"
                      value={themePrompt}
                      onChange={(e) => setThemePrompt(e.target.value)}
                      disabled={isSynthesizing}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-800 transition"
                    />
                    <button 
                      type="submit"
                      disabled={isSynthesizing}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-zinc-900 border border-emerald-950/50 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 text-zinc-100 cursor-pointer"
                    >
                      {isSynthesizing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin" />
                          <span>FORGING...</span>
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          <span>SYNAPSE</span>
                        </>
                      )}
                    </button>
                  </form>

                  {synthesizedTheme ? (
                    <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="block text-[8px] font-mono tracking-widest text-emerald-500 font-bold uppercase">SYNTH_CORE ACTIVE</span>
                        <span className="block text-xs font-mono font-semibold text-zinc-300">{synthesizedTheme.name}</span>
                        <span className="block text-[10px] text-zinc-500 font-mono italic mt-0.5">{synthesizedTheme.description}</span>
                      </div>
                      <button 
                        onClick={clearSynthesizedTheme}
                        className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-zinc-400 hover:text-red-400 hover:border-red-950 transition duration-150 cursor-pointer"
                      >
                        [RESET]
                      </button>
                    </div>
                  ) : (
                    <span className="block text-[9px] text-zinc-600 font-mono text-center">Awaiting prompt input to synthesize atmospheric grid assets...</span>
                  )}
                </div>

                {/* Multiplayer Mode Switcher Terminal */}
                <div className="bg-[#070709]/75 border border-white/[0.02] rounded-2xl p-6 backdrop-blur-md">
                  <h2 className="font-mono text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-4 flex items-center gap-1.5">
                    <Sword size={14} className={getThemeTextClass()} /> PLAY MODE MATCHMAKING CENTER
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 font-mono text-[11px]">
                    <button 
                      onClick={() => { setGameMode('solo'); handleAbortMatchmaking(); }}
                      className={`px-3 py-2.5 border rounded-lg text-center transition cursor-pointer ${gameMode === 'solo' ? getThemeBorderClass() + ' ' + getThemeBgClass() : 'border-zinc-800 bg-zinc-950/20 text-zinc-500'}`}
                    >
                      ● SOLO PRACTICE
                    </button>
                    <button 
                      onClick={() => { setGameMode('duel_vs_ai'); handleAbortMatchmaking(); }}
                      className={`px-3 py-2.5 border rounded-lg text-center transition cursor-pointer ${gameMode === 'duel_vs_ai' ? getThemeBorderClass() + ' ' + getThemeBgClass() : 'border-zinc-800 bg-zinc-950/20 text-zinc-500'}`}
                    >
                      ● VS CORE AI BOT
                    </button>
                    <button 
                      onClick={() => setGameMode('online_duel')}
                      className={`px-3 py-2.5 border rounded-lg text-center transition cursor-pointer ${gameMode === 'online_duel' ? 'border-pink-500/50 bg-pink-950/10 text-pink-400 font-semibold' : 'border-zinc-800 bg-zinc-950/20 text-zinc-500'}`}
                    >
                      🛰️ ONLINE PVP DUEL
                    </button>
                  </div>

                  {gameMode === 'online_duel' && (
                    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl font-mono text-xs">
                      {!currentUser ? (
                        <div className="text-center py-2 text-zinc-500">
                          <Info size={16} className="mx-auto mb-2 text-amber-500 animate-pulse" />
                          <span>Multiplayer requires signed auth. Please click Anonymously Bypass or Google Link above.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-2">
                            <span>ONLINE CONDUIT ACTIVE</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> STABLE</span>
                          </div>

                          {roomMatchmakingStatus === 'idle' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1 text-left">
                                <span className="text-[10px] text-zinc-500">OPTION A: ORIGINATE ROOM</span>
                                <button
                                  onClick={handleCreateRoom}
                                  className="mt-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg text-[11px] font-bold text-zinc-100 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Plus size={12} /> SPITFIRE CREATE ROOM
                                </button>
                              </div>

                              <div className="flex flex-col gap-1 text-left">
                                <span className="text-[10px] text-zinc-500">OPTION B: INPUT SYNC TERMINAL ID</span>
                                <div className="flex gap-1.5 mt-1">
                                  <input 
                                    type="text" 
                                    placeholder="SYNC-1234"
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value)}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-center text-xs text-zinc-200 uppercase focus:outline-none focus:border-pink-800"
                                  />
                                  <button
                                    onClick={handleJoinRoom}
                                    className="px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-bold text-pink-400 cursor-pointer"
                                  >
                                    SYNC
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {roomMatchmakingStatus === 'creating' && (
                            <div className="text-center py-4">
                              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                              <span className="text-zinc-400 block font-semibold mb-1">AWAITING ADVERSARY JOINEE...</span>
                              <span className="text-[10px] block text-zinc-500 uppercase tracking-widest">ROOM IDENTIFIER: <b className="text-pink-400 select-all">{activeRoomId}</b></span>
                              <p className="text-[10px] text-zinc-600 italic mt-3 max-w-sm mx-auto">
                                Tip: Copy this roomId or open this app in another window/tab, input the ID to test real-time typing glitches!
                              </p>
                              <button 
                                onClick={handleAbortMatchmaking}
                                className="mt-4 px-3 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded text-[9px] text-zinc-500 cursor-pointer"
                              >
                                ABORT
                              </button>
                            </div>
                          )}

                          {roomMatchmakingStatus === 'countdown' && (
                            <div className="text-center py-4">
                              <Radio className="mx-auto mb-3 text-pink-500 animate-ping" size={28} />
                              <span className="text-pink-400 font-bold text-lg block">ENGAGING DUAL SYSTEMS IN {multiplayerCountdown}s</span>
                              <span className="text-[9px] text-zinc-500 tracking-wider">HOST: {roomHostName} VS GUEST: {roomGuestName}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Sidebar: Preferences & Personal cloud database history */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Visual Laser and Control Customization Settings */}
                <div className="bg-[#070709]/75 border border-white/[0.02] rounded-2xl p-6 backdrop-blur-md">
                  <h2 className="font-mono text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Crosshair size={14} className={getThemeTextClass()} /> METRIC SETTINGS & WEAPON STYLE
                  </h2>

                  <div className="flex flex-col gap-4 font-mono text-[11px]">
                    
                    {/* Laser selection type */}
                    <div>
                      <span className="block text-[10px] text-zinc-500 mb-2 font-bold tracking-wider">LASER RETICLE TARGETING:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['quantum', 'ring', 'crosshair'].map(style => (
                          <button
                            key={style}
                            onClick={() => setLaserStyle(style as any)}
                            className={`px-2 py-1.5 border rounded-lg text-center uppercase cursor-pointer ${laserStyle === style ? 'border-cyan-500 bg-cyan-950/10 text-cyan-400' : 'border-zinc-800 text-zinc-500 bg-zinc-950/20'}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aura accent selection */}
                    <div>
                      <span className="block text-[10px] text-zinc-500 mb-2 font-bold tracking-wider">PRIMARY ACCENT WEAPON:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'cyan', label: 'CYAN BEAM' },
                          { id: 'purple', label: 'VIOLET NET' },
                          { id: 'green', label: 'EMERALD NET' },
                          { id: 'pink', label: 'ROSE IMPULSE' }
                        ].map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setNeonThemeColor(theme.id)}
                            className={`px-3 py-1.5 border rounded-lg text-left cursor-pointer ${neonThemeColor === theme.id ? `${getThemeBorderClass(theme.id)} ${getThemeBgClass(theme.id)} font-bold` : 'border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:text-zinc-300'}`}
                          >
                            ● {theme.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Classic dictionary categories */}
                    {!synthesizedTheme && (
                      <div>
                        <span className="block text-[10px] text-zinc-500 mb-2 font-bold tracking-wider font-mono">STANDARDIZED DICTIONARY PACK:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'common', label: 'COMMON DIALOG' },
                            { id: 'tech', label: 'CYBER CODE' },
                            { id: 'cinematic', label: 'STELLAR EPIC' },
                            { id: 'chaos', label: 'CHAOS DRIFT' }
                          ].map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => setCategory(cat.id as WordCategory)}
                              className={`px-2 py-1.5 border rounded-lg text-left capitalize cursor-pointer ${category === cat.id ? `${getThemeBorderClass()} ${getThemeBgClass()} font-bold` : 'border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:text-zinc-300'}`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gravity difficulty */}
                    <div>
                      <span className="block text-[10px] text-zinc-500 mb-2 font-bold tracking-wider">GRAVITY ACCELERATION DIFFICULTY:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'easy', label: 'EASY SYSTEM' },
                          { id: 'medium', label: 'STABLE CORE' },
                          { id: 'hard', label: 'OVERLOAD' },
                          { id: 'chaos', label: 'SINGULARITY' }
                        ].map(diff => (
                          <button
                            key={diff.id}
                            onClick={() => setDifficulty(diff.id as Difficulty)}
                            className={`px-2 py-1.5 border rounded-lg text-center uppercase cursor-pointer ${difficulty === diff.id ? 'border-red-500 bg-red-950/20 text-red-400 font-bold' : 'border-zinc-800 text-zinc-500 bg-zinc-950/20'}`}
                          >
                            {diff.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-zinc-900">
                      <button
                        onClick={() => setCaseInsensitive(!caseInsensitive)}
                        className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-zinc-950 cursor-pointer"
                      >
                        <span className="text-zinc-500">CASE INSENSITIVE MODE</span>
                        <span className={caseInsensitive ? 'text-zinc-300 font-bold' : 'text-zinc-600'}>{caseInsensitive ? 'ACTIVE' : 'STRICT'}</span>
                      </button>
                      <button
                        onClick={() => setFocusMode(!focusMode)}
                        className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-zinc-950 cursor-pointer"
                      >
                        <span className="text-zinc-500">FOCUS CHROME HIDE HUD</span>
                        <span className={focusMode ? 'text-zinc-300 font-bold' : 'text-zinc-600'}>{focusMode ? 'ACTIVE' : 'MUTED'}</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* SVG Live Diagnostic/Leaderboard history */}
                <div className="bg-[#070709]/75 border border-white/[0.02] rounded-2xl p-6 backdrop-blur-md text-left font-mono">
                  <h2 className="text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" /> HISTORIC DIAGNOSTICS GRAPHS
                  </h2>

                  {localHistory && localHistory.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {/* Breathtaking SVG Telemetry graph representation */}
                      <div className="w-full h-24 border border-zinc-800/40 rounded bg-black/40 relative overflow-hidden p-1">
                        <span className="absolute top-1 left-2 text-[8px] text-zinc-600">HISTORIC WPM VELOCITY VECTOR</span>
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke={getThemeHexColor()}
                            strokeWidth="1.5"
                            points={localHistory.map((h, i) => {
                              const x = (i / (localHistory.length - 1)) * 96 + 2;
                              // Scale wpm between 0 and 120 limits
                              const y = 90 - Math.min(90, (h.wpm / 120) * 80);
                              return `${x},${y}`;
                            }).join(' ')}
                          />
                        </svg>
                      </div>

                      <div className="max-h-24 overflow-y-auto flex flex-col gap-1 pr-1">
                        {localHistory.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] bg-zinc-950/40 border border-zinc-900 px-2 py-1 rounded">
                            <span className="text-zinc-400 font-bold">{Math.round(item.wpm)} WPM</span>
                            <span className="text-zinc-600 font-semibold">{item.accuracy}% Acc</span>
                            <span className="text-zinc-500 uppercase">{item.difficulty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-600 text-[10px]">
                      <Info size={16} className="mx-auto mb-2 text-zinc-700" />
                      <span>NO RUNS RECORDED YET. ENGAGE CHIME AUTHENTICATION OVER CLOUD TO INITIATE CHRONOLOGICAL DIAGNOSTIC TELEMETRY GRAPHS.</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Lobby footer: Start run action */}
              <div className="lg:col-span-12 border-t border-zinc-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="font-mono text-xs text-zinc-500 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-500" /> SYSTEM HIGH SCORE DIAGNOSTIC: 
                  <span className="font-bold text-zinc-300 ml-1">{highScore.toLocaleString()} PTS</span>
                </div>
                
                {roomMatchmakingStatus !== 'countdown' && (
                  <button
                    onClick={startGame}
                    className={`w-full sm:w-auto px-10 py-3 rounded-xl font-display font-medium border flex items-center justify-center gap-2 text-md transition-all duration-300 hover:scale-[1.03] shadow-lg cursor-pointer ${getThemeTextGlowClass()}`}
                  >
                    <Play size={16} />
                    <span>LAUNCH COGNITIVE THRESHOLD</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== 2. ACTIVE COMBAT PLAYING GRID ==================== */}
        {gameState === 'playing' && (
          <div className="flex-grow flex flex-col relative">
            
            {/* Top HUD elements */}
            <HUD
              stats={stats}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              neonThemeColor={neonThemeColor}
              category={category}
              difficulty={difficulty}
            />

            {/* In-Game Dual Cockpits Panel for Real-time battles (VS AI or Online PvP) */}
            {(gameMode === 'duel_vs_ai' || gameMode === 'online_duel') && (
              <div className="absolute top-18 right-6 w-56 font-mono text-[10px] select-none pointer-events-none z-30 flex flex-col gap-2 p-2.5 bg-black/75 border border-zinc-800/60 rounded-lg">
                <span className="text-zinc-400 font-bold flex items-center gap-1 uppercase tracking-wider text-pink-400">
                  <Sword size={11} /> ADVERSARY OVERLAY:
                </span>
                <div className="text-zinc-200">
                  <span className="block text-zinc-400 font-semibold">{opponentName}</span>
                  <div className="flex justify-between mt-1 text-[9px] text-zinc-500">
                    <span>SPEED: <b className="text-zinc-300">{Math.round(opponentWpm)} WPM</b></span>
                    <span>COMBO: <b className="text-zinc-300">x{opponentStreak}</b></span>
                  </div>
                </div>

                {/* Opponent Shield Indicator */}
                <div className="flex flex-col gap-0.5 mt-1">
                  <div className="flex justify-between items-center text-[8px] text-zinc-6s00">
                    <span>SHIELD STRUCTURE</span>
                    <span>{Math.round(opponentShield)}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${opponentShield}%` }}
                      className="h-full bg-pink-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shield Status integrity bar (holographic container) */}
            <div className="absolute top-18 left-6 right-6 max-w-sm flex items-center gap-3 z-30 font-mono text-[9px] select-none pointer-events-none transition-all">
              <span className="text-zinc-500 flex items-center gap-1 uppercase tracking-widest font-semibold">
                <Shield size={12} className={shieldHealth > 30 ? 'text-zinc-400' : 'text-red-500 animate-pulse'} /> SHIELD
              </span>
              <div className="flex-1 h-[3px] bg-zinc-900 border border-zinc-800/40 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${shieldHealth}%`,
                    transition: 'width 0.2s cubic-bezier(0.1, 0.8, 0.25, 1)'
                  }}
                  className={`h-full rounded-full ${
                    shieldHealth > 50
                      ? `bg-cyan-400`
                      : shieldHealth > 25
                        ? 'bg-amber-500'
                        : 'bg-red-500 animate-pulse'
                  }`}
                />
              </div>
              <span className={`font-bold ${shieldHealth < 30 ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`}>
                {shieldHealth}%
              </span>
            </div>

            {/* Dynamic Center Focus Element (The Reticle options) */}
            <div className="absolute inset-0 z-0 select-none flex items-center justify-center pointer-events-none">
              
              {laserStyle === 'quantum' && (
                <div className="w-72 h-72 border border-white/[0.02] rounded-full flex items-center justify-center relative">
                  <div className={`absolute inset-0 border-t-2 ${reticle.border} rounded-full rotate-45 animate-[spin_20s_linear_infinite] rounded-full ${reticle.activeGlow}`}></div>
                  <div className="absolute inset-4 border border-white/[0.01] rounded-full"></div>
                  <div className={`font-mono text-[8px] absolute top-10 tracking-[0.5em] uppercase ${reticle.text}`}>
                    FOCUS RANGE BOUNDS
                  </div>
                  <div className="text-[12vw] font-display font-black text-white/[0.02] uppercase tracking-tighter absolute">
                    {category.slice(0, 8)}
                  </div>
                </div>
              )}

              {laserStyle === 'ring' && (
                <div className="w-60 h-60 border-2 border-dashed border-white/[0.01] rounded-full flex items-center justify-center relative animate-[spin_32s_linear_infinite]">
                  <div className={`w-full h-full border ${reticle.border} rounded-full`}></div>
                </div>
              )}

              {laserStyle === 'crosshair' && (
                <div className="relative w-48 h-48 select-none pointer-events-none flex items-center justify-center">
                  <div className="absolute top-0 bottom-0 w-[1px] bg-white/[0.03]"></div>
                  <div className="absolute left-0 right-0 h-[1px] bg-white/[0.03]"></div>
                  <div className={`w-8 h-8 border ${reticle.border} rounded-full animate-ping opacity-25`}></div>
                </div>
              )}

            </div>

            {/* Word Entities Floating Container */}
            <div className="flex-grow relative w-full overflow-hidden">
              {words.map(w => (
                <WordEntity
                  key={w.id}
                  word={w}
                  isActive={activeWordId === w.id}
                  neonThemeColor={neonThemeColor}
                />
              ))}
            </div>

            {/* Bottom active cockpit typing visual threshold boundary (Danger Line) */}
            <div className="relative h-28 border-t border-zinc-900/40 bg-zinc-950/50 backdrop-blur-md flex flex-col items-center justify-center px-4 py-3 z-30">
              
              {/* Floating laser barrier (Shield barrier wall representation) */}
              <div className="absolute top-0 left-0 w-full h-[1px] flex justify-between items-center">
                <div className={`w-full h-full opacity-20 bg-current ${getThemeTextClass()} animate-pulse`} />
                <span className="absolute right-6 -top-2 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-[8px] text-zinc-600 font-mono tracking-widest uppercase">
                  DANGER LINE LIMIT
                </span>
              </div>

              {/* Minimalist floating input prompt feedback */}
              <div className="w-full max-w-md flex flex-col items-center gap-1.5 pointer-events-none">
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> TERRESTRIAL COGNITIVE LINK
                </div>
                
                {/* Visual diagnostic bar typing buffer */}
                <div className={`w-full h-10 rounded-lg bg-zinc-950/80 border border-zinc-900 flex items-center justify-center px-4 font-mono text-sm leading-none text-zinc-300 select-none box-glow-${neonThemeColor}`}>
                  {activeWordId ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-600">LOCKED:</span>
                      <span className={`font-semibold ${getThemeTextClass()}`}>
                        {words.find(w => w.id === activeWordId)?.text.slice(0, words.find(w => w.id === activeWordId)?.typedCharCount || 0)}
                      </span>
                      <span className="text-zinc-500 border-b border-zinc-600 border-dashed animate-pulse">
                        {words.find(w => w.id === activeWordId)?.text.slice(words.find(w => w.id === activeWordId)?.typedCharCount || 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600 animate-pulse uppercase tracking-widest font-light">
                      Capture target... Type incoming word first character
                    </span>
                  )}
                </div>

                <div className="flex gap-4 text-[9px] text-zinc-600 font-mono">
                  <span>VELOCITY (WPM): <b className="text-zinc-500">{Math.round(stats.wpm)}</b></span>
                  <span>ACCURACY: <b className="text-zinc-500">{Math.round(stats.accuracy)}%</b></span>
                  <span>STREAK COMBO: <b className={`font-bold ${stats.streak >= 10 ? getThemeTextClass() : 'text-zinc-500'}`}>x{stats.streak}</b></span>
                </div>
              </div>

              {/* Pause/Abort simulations links in the bottom corner */}
              <div className="absolute right-6 bottom-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    setGameState('ended');
                    handleRunFinished();
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-900 font-mono text-[9px] text-zinc-600 hover:text-zinc-300 transition-all cursor-pointer"
                >
                  [ABORT SIMULATION]
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ==================== 3. GAME OVER SUMMARY PANEL ==================== */}
        {gameState === 'ended' && (
          <EndScreen
            stats={stats}
            difficulty={difficulty}
            category={category}
            onRestart={startGame}
            onBackToMenu={backToMenu}
            neonThemeColor={neonThemeColor}
          />
        )}

        {/* Dynamic Canvas Special Effects Overlay */}
        <EffectsLayer
          ref={effectsRef}
          neonThemeColor={neonThemeColor}
          streak={stats.streak}
          wpm={stats.wpm}
        />

      </div>
    </div>
  );
}
