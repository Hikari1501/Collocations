/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  GameState, GameMode, CollocationDeck, CollocationRound, 
  FlyingWord, BossState, LaserBeam, PlayerStats, HighScoreRecord, 
  EducationalFeedback, WordOrigin 
} from './types/game';
import { DEFAULT_DECKS, BOSS_ENCOUNTERS } from './data/defaultDecks';
import { sound } from './utils/sound';
import { HUD } from './components/HUD';
import { ArcadeCanvas } from './components/ArcadeCanvas';
import { TurretStation } from './components/TurretStation';
import { WordTarget } from './components/WordTarget';
import { BossShip } from './components/BossShip';
import { FeedbackBanner } from './components/FeedbackBanner';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { TeacherStudio } from './components/TeacherStudio';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('ADVENTURE');
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());
  const [isMusicOn, setIsMusicOn] = useState<boolean>(sound.isMusicOn());

  // Decks & Curriculum
  const [decks, setDecks] = useState<CollocationDeck[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('collocation_blaster_decks');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_DECKS;
  });

  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || 'deck-everyday-verbs');

  // Check URL on mount for shared teacher deck (#deck=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('#deck=')) {
        const encoded = hash.split('#deck=')[1];
        if (encoded) {
          const jsonStr = decodeURIComponent(escape(atob(encoded)));
          const sharedDeck: CollocationDeck = JSON.parse(jsonStr);
          if (sharedDeck && sharedDeck.id && sharedDeck.rounds?.length) {
            setDecks((prev) => {
              const exists = prev.some((d) => d.id === sharedDeck.id);
              if (exists) return prev.map((d) => (d.id === sharedDeck.id ? sharedDeck : d));
              return [sharedDeck, ...prev];
            });
            setActiveDeckId(sharedDeck.id);
            showFeedback(
              'LEVEL_UP',
              'TEACHER DECK LOADED!',
              `Loaded shared curriculum: "${sharedDeck.title}". Good luck!`,
              sharedDeck.rounds[0]?.baseWord || '',
              ''
            );
          }
        }
      }
    } catch {
      // Ignore if malformed
    }
  }, []);

  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const currentRound: CollocationRound = activeDeck.rounds[currentRoundIndex] || activeDeck.rounds[0];

  const [unfoundTargets, setUnfoundTargets] = useState<string[]>([]);
  const [flyingWords, setFlyingWords] = useState<FlyingWord[]>([]);
  const [laserBeams, setLaserBeams] = useState<LaserBeam[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [bossHitFlash, setBossHitFlash] = useState<boolean>(false);

  // Flying Boss State
  const [bossState, setBossState] = useState<BossState | null>(null);
  const bossStateRef = useRef<BossState | null>(null);

  useEffect(() => {
    bossStateRef.current = bossState;
  }, [bossState]);

  const [feedback, setFeedback] = useState<EducationalFeedback | null>(null);

  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    combo: 1,
    maxCombo: 1,
    lives: 3,
    maxLives: 3,
    level: 1,
    roundIndex: 0,
    correctHits: 0,
    wrongHits: 0,
    bossesDefeated: 0,
    learnedCollocations: [],
    mistakesMade: [],
  });

  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('collocation_blaster_highscores');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // fallback
      }
    }
    return [
      { id: '1', playerName: 'StarCadet', score: 4800, level: 4, maxCombo: 9, accuracy: 92, date: '2026-10-28' },
      { id: '2', playerName: 'LexiconAce', score: 3200, level: 3, maxCombo: 6, accuracy: 88, date: '2026-10-27' },
      { id: '3', playerName: 'GrammarPilot', score: 1950, level: 2, maxCombo: 5, accuracy: 84, date: '2026-10-25' },
    ];
  });

  // Save decks to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('collocation_blaster_decks', JSON.stringify(decks));
      } catch {
        // storage restricted
      }
    }
  }, [decks]);

  // Audio and Music Handlers
  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
    setIsMusicOn(sound.isMusicOn());
  };

  const handleToggleMusic = () => {
    const next = sound.toggleMusic();
    setIsMusicOn(next && !isMuted);
  };

  // Synchronize Background Music with Game State
  useEffect(() => {
    if (gameState === 'TITLE') {
      sound.startMusic('title');
    } else if (gameState === 'PLAYING') {
      sound.startMusic('gameplay');
    } else if (gameState === 'BOSS_BATTLE') {
      sound.startMusic('boss');
    } else if (gameState === 'PAUSED' || gameState === 'GAME_OVER' || gameState === 'VICTORY' || gameState === 'TEACHER_STUDIO') {
      sound.stopMusic(false);
    }
  }, [gameState]);

  const showFeedback = useCallback((
    type: 'CORRECT' | 'WRONG' | 'BOSS_HIT' | 'LEVEL_UP',
    title: string,
    detail: string,
    baseWord: string,
    word: string
  ) => {
    const newFeedback: EducationalFeedback = {
      id: `fb-${Date.now()}`,
      type,
      title,
      detail,
      baseWord,
      word,
      timestamp: Date.now(),
    };
    setFeedback(newFeedback);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Start Game
  const handleStartGame = (mode: GameMode = 'ADVENTURE') => {
    setGameMode(mode);
    setStats({
      score: 0,
      combo: 1,
      maxCombo: 1,
      lives: 3,
      maxLives: 3,
      level: 1,
      roundIndex: 0,
      correctHits: 0,
      wrongHits: 0,
      bossesDefeated: 0,
      learnedCollocations: [],
      mistakesMade: [],
    });

    setFlyingWords([]);
    setLaserBeams([]);
    setFeedback(null);

    if (mode === 'BOSS_RUSH') {
      initiateBossBattle(0);
    } else {
      setBossState(null);
      setCurrentRoundIndex(0);
      initiateRound(activeDeck.rounds[0] || DEFAULT_DECKS[0].rounds[0]);
    }
  };

  // Quit / Abandon current level while playing
  const handleQuitMission = () => {
    setFlyingWords([]);
    setLaserBeams([]);
    setBossState(null);
    setGameState('TITLE');
    sound.startMusic('title');
  };

  // Initiate normal round
  const initiateRound = (round: CollocationRound) => {
    setBossState(null);
    setUnfoundTargets([...round.targetCollocations]);
    setFlyingWords([]);
    setGameState('PLAYING');
  };

  // Initiate Boss Battle with flying coordinates
  const initiateBossBattle = (bossIndex: number = 0) => {
    const bossTemplate = BOSS_ENCOUNTERS[bossIndex % BOSS_ENCOUNTERS.length];
    const newBoss: BossState = {
      ...bossTemplate,
      currentHp: bossTemplate.maxHp,
      hitsTaken: 0,
      x: 50,
      y: 22,
      vx: 0.16,
      vy: 0.06,
      flyAngle: 0,
      isFiring: false,
    };
    bossStateRef.current = newBoss;
    setBossState(newBoss);
    setUnfoundTargets([...newBoss.validTargetsNeeded]);
    setFlyingWords([]);
    setGameState('BOSS_BATTLE');

    showFeedback(
      'BOSS_HIT',
      'WARNING: TITAN VESSEL APPROACHING!',
      `Shoot valid collocations for "${newBoss.baseWord}" to breach ${newBoss.name}'s flight shields!`,
      newBoss.baseWord,
      ''
    );
  };

  // Dramatic Boss Defeat Animation Sequence (Cascading explosions, screen rumble, mega detonation, victory fanfare)
  const triggerBossDefeatSequence = (boss: BossState, activeBaseWord: string) => {
    // 1. Immediately halt normal enemy word spawns and clear active words
    setFlyingWords([]);
    setIsScreenShaking(true);

    const collapsingBoss: BossState = {
      ...boss,
      currentHp: 0,
      isDefeated: true,
      defeatStage: 0.1,
      defeatBursts: [],
    };
    bossStateRef.current = collapsingBoss;
    setBossState(collapsingBoss);

    sound.playBossExplosionCrunch();

    showFeedback(
      'BOSS_HIT',
      'TITAN CORE MELTDOWN!',
      `Shield breached! ${boss.name} is collapsing!`,
      activeBaseWord,
      ''
    );

    // Timeline of cascading explosions across the monster's body
    const explosionSchedule = [
      { delay: 180, x: -45, y: -25, size: 52, color: '#f59e0b' },
      { delay: 450, x: 50, y: -20, size: 58, color: '#ef4444' },
      { delay: 780, x: -30, y: 35, size: 64, color: '#06b6d4' },
      { delay: 1080, x: 35, y: 30, size: 70, color: '#ec4899' },
      { delay: 1380, x: 0, y: -10, size: 78, color: '#fbbf24' },
      { delay: 1680, x: -55, y: 15, size: 74, color: '#ef4444' },
      { delay: 1950, x: 55, y: 10, size: 76, color: '#f97316' },
    ];

    explosionSchedule.forEach((item, idx) => {
      setTimeout(() => {
        sound.playBossExplosionCrunch();
        setBossState((prev) => {
          if (!prev) return null;
          const nextBursts = [
            ...(prev.defeatBursts || []),
            {
              id: `burst-${Date.now()}-${idx}`,
              x: item.x,
              y: item.y,
              size: item.size,
              color: item.color,
            },
          ];
          const updated = {
            ...prev,
            defeatStage: 0.2 + (idx / explosionSchedule.length) * 0.5,
            defeatBursts: nextBursts,
          };
          bossStateRef.current = updated;
          return updated;
        });
      }, item.delay);
    });

    // Final Mega Detonation at t=2300ms
    setTimeout(() => {
      sound.playMegaBossDetonation();

      setBossState((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          defeatStage: 0.95,
        };
        bossStateRef.current = updated;
        return updated;
      });

      confetti({
        particleCount: 160,
        spread: 120,
        origin: { x: (boss.x || 50) / 100, y: (boss.y || 25) / 100 },
        colors: ['#ef4444', '#f59e0b', '#22d3ee', '#ffffff', '#ec4899'],
      });
    }, 2300);

    // Conclusion at t=2900ms: award points, show clear banner, transition
    setTimeout(() => {
      setIsScreenShaking(false);
      sound.playBossDefeated();

      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });

      setStats((prev) => ({
        ...prev,
        score: prev.score + 1500,
        bossesDefeated: prev.bossesDefeated + 1,
      }));

      showFeedback(
        'LEVEL_UP',
        'TITAN OBLITERATED!',
        `Magnificent! ${boss.name} was defeated! +1,500 Bonus Points!`,
        activeBaseWord,
        ''
      );

      setBossState(null);
      bossStateRef.current = null;
      setGameState('ROUND_CLEAR');

      setTimeout(() => {
        if (gameMode === 'BOSS_RUSH') {
          setGameState('VICTORY');
        } else {
          const nextRoundIdx = currentRoundIndex + 1;
          if (nextRoundIdx < activeDeck.rounds.length) {
            setCurrentRoundIndex(nextRoundIdx);
            initiateRound(activeDeck.rounds[nextRoundIdx]);
          } else {
            setGameState('VICTORY');
          }
        }
      }, 2500);
    }, 2900);
  };

  // Spawn word engine
  const spawnWord = useCallback(() => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_BATTLE') return;
    if (bossStateRef.current?.isDefeated) return;

    const isBoss = gameState === 'BOSS_BATTLE' && bossStateRef.current !== null;
    const currentBoss = bossStateRef.current;
    const currentBaseWord = isBoss && currentBoss ? currentBoss.baseWord : currentRound.baseWord;
    const availableTargets = isBoss && currentBoss ? currentBoss.validTargetsNeeded : unfoundTargets;
    const availableDistractors = isBoss && currentBoss ? currentBoss.distractors : currentRound.distractors;

    const shouldSpawnCorrect = availableTargets.length > 0 && (Math.random() < 0.55 || availableDistractors.length === 0);

    let text = '';
    let isCorrect = false;
    let tip = '';

    if (shouldSpawnCorrect) {
      text = availableTargets[Math.floor(Math.random() * availableTargets.length)];
      isCorrect = true;
    } else {
      const distractor = availableDistractors[Math.floor(Math.random() * availableDistractors.length)];
      text = distractor?.word || 'error';
      tip = distractor?.tip || `Not a collocation with ${currentBaseWord}`;
      isCorrect = false;
    }

    const speedMultiplier = 1 + (stats.level - 1) * 0.22;
    let origin: WordOrigin;
    let x = 50;
    let y = 15;
    let vx = 0;
    let vy = 0;

    if (isBoss && currentBoss) {
      // The Boss Monster fires words directly from its maw/mouth!
      origin = 'BOSS';
      x = currentBoss.x;
      y = currentBoss.y + 7;
      // Disperse downward in a cone toward the player's station
      vx = (Math.random() - 0.5) * 0.28 * speedMultiplier;
      vy = (Math.random() * 0.12 + 0.16) * speedMultiplier;

      // Pulse mouth plasma flare on monster sprite
      setBossState((prev) => (prev ? { ...prev, isFiring: true } : null));
      setTimeout(() => {
        setBossState((prev) => (prev ? { ...prev, isFiring: false } : null));
      }, 260);

      sound.playLaser();
    } else {
      const origins: WordOrigin[] = ['TOP', 'LEFT', 'RIGHT'];
      origin = origins[Math.floor(Math.random() * origins.length)];

      switch (origin) {
        case 'TOP':
          x = Math.random() * 70 + 15;
          y = 12;
          vy = (Math.random() * 0.12 + 0.14) * speedMultiplier;
          vx = (Math.random() - 0.5) * 0.08 * speedMultiplier;
          break;
        case 'LEFT':
          x = 5;
          y = Math.random() * 45 + 18;
          vx = (Math.random() * 0.14 + 0.15) * speedMultiplier;
          vy = (Math.random() * 0.08 - 0.02) * speedMultiplier;
          break;
        case 'RIGHT':
          x = 95;
          y = Math.random() * 45 + 18;
          vx = -(Math.random() * 0.14 + 0.15) * speedMultiplier;
          vy = (Math.random() * 0.08 - 0.02) * speedMultiplier;
          break;
      }
    }

    const newWord: FlyingWord = {
      id: `word-${Date.now()}-${Math.random()}`,
      text,
      isCorrect,
      tip,
      x,
      y,
      vx,
      vy,
      rotation: (Math.random() - 0.5) * 8,
      origin,
    };

    setFlyingWords((prev) => {
      const maxConcurrent = Math.min(6, 3 + Math.floor(stats.level / 2));
      if (prev.length >= maxConcurrent) return prev;
      return [...prev, newWord];
    });
  }, [gameState, currentRound, unfoundTargets, stats.level]);

  // Main 60fps Movement & Boss Flight Loop
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_BATTLE') return;

    const moveInterval = setInterval(() => {
      // 1. Move regular flying words
      setFlyingWords((prevWords) => {
        return prevWords
          .map((w) => {
            if (w.isHit) return w;
            return {
              ...w,
              x: w.x + w.vx,
              y: w.y + w.vy,
            };
          })
          .filter((w) => {
            const isInside = w.x >= -5 && w.x <= 105 && w.y <= 85;
            return isInside || w.isHit;
          });
      });

      // 2. Animate and fly Boss Ship dynamically across arena!
      setBossState((prevBoss) => {
        if (!prevBoss) return null;
        if (prevBoss.isDefeated) return prevBoss;
        let newX = prevBoss.x + prevBoss.vx;
        let newVx = prevBoss.vx;
        let newY = prevBoss.y;

        // Bounce smoothly off horizontal margins (20% to 80%)
        if (newX <= 20) {
          newX = 20;
          newVx = Math.abs(prevBoss.vx);
        } else if (newX >= 80) {
          newX = 80;
          newVx = -Math.abs(prevBoss.vx);
        }

        // Sinusoidal vertical swooping motion
        const time = Date.now() / 800;
        newY = 22 + Math.sin(time) * 6;

        const updated: BossState = {
          ...prevBoss,
          x: newX,
          y: newY,
          vx: newVx,
          flyAngle: Math.sin(time * 0.8) * 8,
        };
        bossStateRef.current = updated;
        return updated;
      });
    }, 16);

    return () => {
      clearInterval(moveInterval);
    };
  }, [gameState]);

  // Word Spawning Timer Loop (independent of 60fps animation)
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_BATTLE') return;

    // Immediately trigger a word on round/boss start
    spawnWord();

    const spawnRate = Math.max(1400, 2600 - stats.level * 250);
    const spawnInterval = setInterval(() => {
      spawnWord();
    }, spawnRate);

    return () => {
      clearInterval(spawnInterval);
    };
  }, [gameState, stats.level, spawnWord]);

  // Check Round Completion
  const handleCheckRoundCompletion = useCallback((updatedUnfound: string[]) => {
    if (updatedUnfound.length === 0) {
      sound.playWaveClear();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
      });

      setGameState('ROUND_CLEAR');

      const nextRoundIdx = currentRoundIndex + 1;
      const nextLevel = stats.level + 1;
      const isBossTime = nextLevel % 3 === 0;

      setTimeout(() => {
        if (isBossTime) {
          initiateBossBattle(Math.floor(nextLevel / 3) - 1);
          setStats((prev) => ({
            ...prev,
            level: nextLevel,
            score: prev.score + 500,
          }));
        } else if (nextRoundIdx < activeDeck.rounds.length) {
          setCurrentRoundIndex(nextRoundIdx);
          setStats((prev) => ({
            ...prev,
            level: nextLevel,
            score: prev.score + 350,
          }));
          initiateRound(activeDeck.rounds[nextRoundIdx]);
        } else {
          setGameState('VICTORY');
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        }
      }, 2000);
    }
  }, [currentRoundIndex, activeDeck, stats.level]);

  // Shoot Word Handler
  const handleShootWord = (word: FlyingWord, elementRect: DOMRect) => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_BATTLE') return;

    const anchor = document.getElementById('turret-station-anchor');
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight - 80;

    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + 10;
    }

    const targetX = elementRect.left + elementRect.width / 2;
    const targetY = elementRect.top + elementRect.height / 2;
    const laserColor = word.isCorrect ? '#22d3ee' : '#ef4444';

    sound.playLaser();

    // Beam to word
    setLaserBeams((prev) => [
      ...prev,
      {
        id: `beam-${Date.now()}`,
        startX,
        startY,
        targetX,
        targetY,
        color: laserColor,
        timestamp: Date.now(),
      },
    ]);

    const activeBaseWord = bossState ? bossState.baseWord : currentRound.baseWord;

    if (word.isCorrect) {
      setFlyingWords((prev) =>
        prev.map((w) => (w.id === word.id ? { ...w, isHit: true, hitType: 'CORRECT' } : w))
      );

      setTimeout(() => {
        setFlyingWords((prev) => prev.filter((w) => w.id !== word.id));
      }, 200);

      sound.playHitCorrect();

      const remaining = unfoundTargets.filter((t) => t.toLowerCase() !== word.text.toLowerCase());
      setUnfoundTargets(remaining);

      const comboMult = stats.combo;
      const pointsGained = 100 * comboMult;

      setStats((prev) => {
        const nextCombo = prev.combo + 1;
        return {
          ...prev,
          score: prev.score + pointsGained,
          combo: nextCombo,
          maxCombo: Math.max(prev.maxCombo, nextCombo),
          correctHits: prev.correctHits + 1,
          learnedCollocations: [
            ...prev.learnedCollocations,
            { phrase: `${activeBaseWord} ${word.text}`, baseWord: activeBaseWord },
          ],
        };
      });

      showFeedback(
        'CORRECT',
        'VALID COLLOCATION BLASTED!',
        `"${activeBaseWord} ${word.text.toUpperCase()}" (+${pointsGained} pts · x${comboMult} combo)`,
        activeBaseWord,
        word.text
      );

      // If in Boss Battle: Fire an overdrive beam from turret straight into the flying BossShip!
      if (bossState) {
        sound.playBossHit();
        setBossHitFlash(true);
        setTimeout(() => setBossHitFlash(false), 250);

        // Calculate boss screen position for laser impact
        const bossEl = document.getElementById('flying-boss-ship');
        if (bossEl) {
          const bossRect = bossEl.getBoundingClientRect();
          const bTargetX = bossRect.left + bossRect.width / 2;
          const bTargetY = bossRect.top + bossRect.height / 2;
          setLaserBeams((prev) => [
            ...prev,
            {
              id: `boss-beam-${Date.now()}`,
              startX,
              startY,
              targetX: bTargetX,
              targetY: bTargetY,
              color: '#f43f5e',
              timestamp: Date.now() + 100,
            },
          ]);
        }

        const newHp = bossState.currentHp - 1;
        const updatedBoss: BossState = {
          ...bossState,
          currentHp: newHp,
          hitsTaken: bossState.hitsTaken + 1,
        };
        bossStateRef.current = updatedBoss;
        setBossState(updatedBoss);

        if (newHp <= 0) {
          triggerBossDefeatSequence(updatedBoss, activeBaseWord);
          return;
        }
      }

      if (!bossState) {
        handleCheckRoundCompletion(remaining);
      }
    } else {
      // INCORRECT CHOICE / DISTRACTOR
      sound.playHitWrong();

      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 350);

      setFlyingWords((prev) =>
        prev.map((w) => (w.id === word.id ? { ...w, isHit: true, hitType: 'WRONG' } : w))
      );

      setTimeout(() => {
        setFlyingWords((prev) => prev.filter((w) => w.id !== word.id));
      }, 300);

      const newLives = stats.lives - 1;
      setStats((prev) => ({
        ...prev,
        combo: 1,
        lives: Math.max(0, newLives),
        wrongHits: prev.wrongHits + 1,
        mistakesMade: [
          ...prev.mistakesMade,
          { baseWord: activeBaseWord, word: word.text, tip: word.tip || 'Incorrect collocation' },
        ],
      }));

      showFeedback(
        'WRONG',
        'DEFLECTOR SHIELD HIT!',
        `❌ "${activeBaseWord} ${word.text}" is incorrect! ${word.tip}`,
        activeBaseWord,
        word.text
      );

      if (newLives <= 0) {
        sound.playGameOver();
        setGameState('GAME_OVER');
      }
    }
  };

  const handleRemoveLaser = (id: string) => {
    setLaserBeams((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSaveHighScore = (playerName: string) => {
    const totalAttempts = stats.correctHits + stats.wrongHits;
    const accuracy = totalAttempts > 0 ? Math.round((stats.correctHits / totalAttempts) * 100) : 0;

    const newRecord: HighScoreRecord = {
      id: `score-${Date.now()}`,
      playerName,
      score: stats.score,
      level: stats.level,
      maxCombo: stats.maxCombo,
      accuracy,
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [...highScores, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setHighScores(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('collocation_blaster_highscores', JSON.stringify(updated));
      } catch {
        // storage restricted
      }
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative select-none ${isScreenShaking ? 'animate-shake' : ''}`}>
      {/* Dynamic Starfield & Laser Canvas Layer */}
      <ArcadeCanvas
        laserBeams={laserBeams}
        onRemoveLaser={handleRemoveLaser}
      />

      {/* Global Top Bar HUD with BGM and Quit Mission options */}
      <HUD
        stats={stats}
        gameState={gameState}
        isMuted={isMuted}
        isMusicOn={isMusicOn}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onTogglePause={() => {
          if (gameState === 'PLAYING') setGameState('PAUSED');
          else if (gameState === 'PAUSED') setGameState('PLAYING');
        }}
        onOpenTeacherStudio={() => setGameState('TEACHER_STUDIO')}
        onQuitMission={handleQuitMission}
      />

      {/* Feedback Toast Banner */}
      <FeedbackBanner feedback={feedback} />

      {/* View Routing */}
      {gameState === 'TITLE' && (
        <TitleScreen
          decks={decks}
          selectedDeckId={activeDeckId}
          onSelectDeck={setActiveDeckId}
          onStartGame={handleStartGame}
          onOpenTeacherStudio={() => setGameState('TEACHER_STUDIO')}
          highScores={highScores}
        />
      )}

      {gameState === 'TEACHER_STUDIO' && (
        <TeacherStudio
          decks={decks}
          activeDeckId={activeDeckId}
          onSelectDeck={setActiveDeckId}
          onSaveDeck={(updatedDeck) => {
            setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
          }}
          onCreateDeck={(newDeck) => {
            setDecks((prev) => [...prev, newDeck]);
            setActiveDeckId(newDeck.id);
          }}
          onDeleteDeck={(deckId) => {
            const filtered = decks.filter((d) => d.id !== deckId);
            setDecks(filtered);
            if (activeDeckId === deckId) {
              setActiveDeckId(filtered[0]?.id || DEFAULT_DECKS[0].id);
            }
          }}
          onResetToDefaults={() => {
            if (window.confirm('Reset all decks to default curriculum?')) {
              setDecks(DEFAULT_DECKS);
              setActiveDeckId(DEFAULT_DECKS[0].id);
              localStorage.removeItem('collocation_blaster_decks');
            }
          }}
          onPlayDeck={(deck) => {
            setActiveDeckId(deck.id);
            handleStartGame('TEACHER_DECK');
          }}
          onClose={() => setGameState('TITLE')}
        />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'ROUND_CLEAR' || gameState === 'BOSS_BATTLE') && (
        <main className="relative w-full h-screen overflow-hidden pt-16">
          {/* Flying Boss Entity moving dynamically across the arena */}
          {bossState && (
            <BossShip
              boss={bossState}
              isHitFlash={bossHitFlash}
            />
          )}

          {/* Active Flying Words Container */}
          <div className="absolute inset-0 pointer-events-auto">
            {flyingWords.map((word) => (
              <WordTarget
                key={word.id}
                word={word}
                onShoot={handleShootWord}
              />
            ))}
          </div>

          {/* Round Clear Intermission Toast */}
          {gameState === 'ROUND_CLEAR' && (
            <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 border-2 border-emerald-400 rounded-3xl p-6 text-center shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-bounce backdrop-blur-md">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-arcade tracking-widest">
                SECTOR CLEARED!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-300 font-semibold mt-1">
                All Collocations Mastered! Preparing next wave...
              </p>
            </div>
          )}

          {/* Paused Screen Overlay with Resume & Quit options */}
          {gameState === 'PAUSED' && (
            <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 border border-cyan-500/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <h3 className="text-2xl font-black text-white font-arcade tracking-wider mb-2">
                  SIMULATION PAUSED
                </h3>
                <p className="text-xs text-slate-400 mb-6">Take a breath and review your collocations.</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setGameState(bossState ? 'BOSS_BATTLE' : 'PLAYING')}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg"
                  >
                    Resume Mission
                  </button>
                  <button
                    onClick={handleQuitMission}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl text-xs uppercase transition-colors"
                  >
                    Quit to Mission Select
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Turret Station with active base word */}
          <TurretStation
            baseWord={bossState ? bossState.baseWord : currentRound.baseWord}
            category={bossState ? 'Flying Titan Boss' : currentRound.category}
            level={bossState ? 'Boss' : currentRound.level}
            exampleSentence={currentRound.exampleSentence}
            remainingTargets={unfoundTargets.length}
            totalTargetsInRound={
              bossState ? bossState.validTargetsNeeded.length : currentRound.targetCollocations.length
            }
            isBossActive={bossState !== null}
            bossHp={bossState?.currentHp}
            bossMaxHp={bossState?.maxHp}
          />
        </main>
      )}

      {/* Game Over / Victory Screen with Home Return & Teacher Report */}
      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <GameOverModal
          stats={stats}
          isVictory={gameState === 'VICTORY'}
          deck={activeDeck}
          onRestart={() => handleStartGame(gameMode)}
          onReturnHome={handleQuitMission}
          onOpenTeacherStudio={() => setGameState('TEACHER_STUDIO')}
          onSaveHighScore={handleSaveHighScore}
        />
      )}
    </div>
  );
}
