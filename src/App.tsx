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
import { BossBattleDisplay } from './components/BossBattleDisplay';
import { FeedbackBanner } from './components/FeedbackBanner';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { TeacherStudio } from './components/TeacherStudio';
import { Sparkles, Trophy, Skull } from 'lucide-react';

export default function App() {
  // Game states
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('ADVENTURE');
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  // Decks & Curriculum
  const [decks, setDecks] = useState<CollocationDeck[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collocation_blaster_decks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback to defaults
        }
      }
    }
    return DEFAULT_DECKS;
  });

  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || 'deck-everyday-verbs');

  // Active round pointers
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const currentRound: CollocationRound = activeDeck.rounds[currentRoundIndex] || activeDeck.rounds[0];

  // Remaining targets in current round
  const [unfoundTargets, setUnfoundTargets] = useState<string[]>([]);

  // Flying words in current flight arena
  const [flyingWords, setFlyingWords] = useState<FlyingWord[]>([]);

  // Visual effects: laser beams & screen shake
  const [laserBeams, setLaserBeams] = useState<LaserBeam[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [bossHitFlash, setBossHitFlash] = useState<boolean>(false);

  // Boss Battle state
  const [bossState, setBossState] = useState<BossState | null>(null);

  // Instant educational feedback toast
  const [feedback, setFeedback] = useState<EducationalFeedback | null>(null);

  // Player Stats
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

  // High Scores leaderboard
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collocation_blaster_highscores');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      { id: '1', playerName: 'StarCadet', score: 4800, level: 4, maxCombo: 9, accuracy: 92, date: '2026-10-28' },
      { id: '2', playerName: 'LexiconAce', score: 3200, level: 3, maxCombo: 6, accuracy: 88, date: '2026-10-27' },
      { id: '3', playerName: 'GrammarPilot', score: 1950, level: 2, maxCombo: 5, accuracy: 84, date: '2026-10-25' },
    ];
  });

  // Save decks to localStorage whenever updated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('collocation_blaster_decks', JSON.stringify(decks));
      } catch {
        // Ignore if storage is blocked
      }
    }
  }, [decks]);

  // Audio mute toggle handler
  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  // Helper to show educational feedback with auto-dismiss
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

  // Clear feedback after 3.2 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Start or restart a game
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
      // Start directly on Boss Titan
      initiateBossBattle(0);
    } else {
      setBossState(null);
      setCurrentRoundIndex(0);
      initiateRound(activeDeck.rounds[0] || DEFAULT_DECKS[0].rounds[0]);
    }
  };

  // Initiate normal round
  const initiateRound = (round: CollocationRound) => {
    setBossState(null);
    setUnfoundTargets([...round.targetCollocations]);
    setFlyingWords([]);
    setGameState('PLAYING');
  };

  // Initiate Boss Battle
  const initiateBossBattle = (bossIndex: number = 0) => {
    const bossTemplate = BOSS_ENCOUNTERS[bossIndex % BOSS_ENCOUNTERS.length];
    const newBoss: BossState = {
      ...bossTemplate,
      currentHp: bossTemplate.maxHp,
      hitsTaken: 0,
    };
    setBossState(newBoss);
    setUnfoundTargets([...newBoss.validTargetsNeeded]);
    setFlyingWords([]);
    setGameState('BOSS_BATTLE');

    showFeedback(
      'BOSS_HIT',
      'WARNING: BOSS APPROACHING!',
      `Defeat ${newBoss.name}! Shoot valid collocations for "${newBoss.baseWord}" to breach shields!`,
      newBoss.baseWord,
      ''
    );
  };

  // Spawn word engine
  const spawnWord = useCallback(() => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_BATTLE') return;

    // Pick origin: TOP, LEFT, or RIGHT
    const origins: WordOrigin[] = ['TOP', 'LEFT', 'RIGHT'];
    const origin = origins[Math.floor(Math.random() * origins.length)];

    const isBoss = gameState === 'BOSS_BATTLE' && bossState !== null;
    const currentBaseWord = isBoss ? bossState.baseWord : currentRound.baseWord;
    const availableTargets = isBoss ? bossState.validTargetsNeeded : unfoundTargets;
    const availableDistractors = isBoss ? bossState.distractors : currentRound.distractors;

    // Determine whether to spawn a target collocation or a distractor
    // ~55% chance of correct collocation if targets remain
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

    // Determine initial coordinates and velocities based on origin and level
    // Speeds scale smoothly with level for increasing difficulty
    const speedMultiplier = 1 + (stats.level - 1) * 0.22;
    let x = 50;
    let y = 15;
    let vx = 0;
    let vy = 0;

    switch (origin) {
      case 'TOP':
        x = Math.random() * 70 + 15; // 15% to 85%
        y = 12;
        vy = (Math.random() * 0.12 + 0.14) * speedMultiplier;
        vx = (Math.random() - 0.5) * 0.08 * speedMultiplier;
        break;
      case 'LEFT':
        x = 5;
        y = Math.random() * 45 + 18; // 18% to 63%
        vx = (Math.random() * 0.14 + 0.15) * speedMultiplier;
        vy = (Math.random() * 0.08 - 0.02) * speedMultiplier;
        break;
      case 'RIGHT':
        x = 95;
        y = Math.random() * 45 + 18; // 18% to 63%
        vx = -(Math.random() * 0.14 + 0.15) * speedMultiplier;
        vy = (Math.random() * 0.08 - 0.02) * speedMultiplier;
        break;
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
      // Limit concurrent words on screen according to level (3 to 6 words)
      const maxConcurrent = Math.min(6, 3 + Math.floor(stats.level / 2));
      if (prev.length >= maxConcurrent) return prev;
      return [...prev, newWord];
    });
  }, [gameState, bossState, currentRound, unfoundTargets, stats.level]);

  // Game loop interval for moving words and spawning
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_BATTLE') return;

    // Movement loop ~60 ticks per sec
    const moveInterval = setInterval(() => {
      setFlyingWords((prevWords) => {
        return prevWords
          .map((w) => {
            if (w.isHit) return w; // hit words stay momentarily for animation
            return {
              ...w,
              x: w.x + w.vx,
              y: w.y + w.vy,
            };
          })
          .filter((w) => {
            // Keep word if inside flight boundaries (allow slight margins)
            // If it falls too close to bottom turret (y > 85), word leaves
            const isInside = w.x >= 0 && w.x <= 100 && w.y <= 84;
            return isInside || w.isHit;
          });
      });
    }, 16);

    // Spawn ticker interval
    const spawnRate = Math.max(1400, 2600 - stats.level * 250);
    const spawnInterval = setInterval(() => {
      spawnWord();
    }, spawnRate);

    return () => {
      clearInterval(moveInterval);
      clearInterval(spawnInterval);
    };
  }, [gameState, stats.level, spawnWord]);

  // Check if unfound targets is empty in normal wave -> Trigger Round Clear
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

      // Every 3rd level triggers a Boss Battle!
      const isBossTime = nextLevel % 3 === 0;

      setTimeout(() => {
        if (isBossTime) {
          initiateBossBattle(Math.floor(nextLevel / 3) - 1);
          setStats((prev) => ({
            ...prev,
            level: nextLevel,
            score: prev.score + 500, // round clear bonus
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
          // Deck finished! Victory!
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

  // Handle shooting a word
  const handleShootWord = (word: FlyingWord, elementRect: DOMRect) => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_BATTLE') return;

    // Calculate turret cannon muzzle coordinates
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

    // Laser beam color: Cyan for correct, Crimson for wrong
    const laserColor = word.isCorrect ? '#22d3ee' : '#ef4444';

    // Play laser firing sound
    sound.playLaser();

    // Add laser beam
    const beamId = `beam-${Date.now()}`;
    setLaserBeams((prev) => [
      ...prev,
      {
        id: beamId,
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
      // Mark word as hit correct
      setFlyingWords((prev) =>
        prev.map((w) => (w.id === word.id ? { ...w, isHit: true, hitType: 'CORRECT' } : w))
      );

      // Remove after brief flash
      setTimeout(() => {
        setFlyingWords((prev) => prev.filter((w) => w.id !== word.id));
      }, 200);

      // Correct hit sound
      sound.playHitCorrect();

      // Update remaining targets
      const remaining = unfoundTargets.filter((t) => t.toLowerCase() !== word.text.toLowerCase());
      setUnfoundTargets(remaining);

      // Score calculation with combo
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

      // Show immediate educational positive reinforcement
      showFeedback(
        'CORRECT',
        'VALID COLLOCATION BLASTED!',
        `"${activeBaseWord} ${word.text.toUpperCase()}" (+${pointsGained} pts · x${comboMult} combo)`,
        activeBaseWord,
        word.text
      );

      // If in Boss Battle -> Boss takes direct multi-hit damage!
      if (bossState) {
        sound.playBossHit();
        setBossHitFlash(true);
        setTimeout(() => setBossHitFlash(false), 250);

        const newHp = bossState.currentHp - 1;
        setBossState({
          ...bossState,
          currentHp: newHp,
          hitsTaken: bossState.hitsTaken + 1,
        });

        if (newHp <= 0) {
          // Boss Defeated!
          sound.playBossDefeated();
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.3 },
          });

          setStats((prev) => ({
            ...prev,
            score: prev.score + 1500,
            bossesDefeated: prev.bossesDefeated + 1,
          }));

          showFeedback(
            'BOSS_HIT',
            'TITAN DESTROYED!',
            `Magnificent! ${bossState.name} was defeated! +1,500 Bonus Points!`,
            activeBaseWord,
            ''
          );

          setGameState('ROUND_CLEAR');

          setTimeout(() => {
            if (gameMode === 'BOSS_RUSH') {
              setGameState('VICTORY');
            } else {
              // Advance to next wave
              const nextRoundIdx = currentRoundIndex + 1;
              if (nextRoundIdx < activeDeck.rounds.length) {
                setCurrentRoundIndex(nextRoundIdx);
                initiateRound(activeDeck.rounds[nextRoundIdx]);
              } else {
                setGameState('VICTORY');
              }
            }
          }, 2400);
          return;
        }
      }

      // If normal wave, check if round completed
      if (!bossState) {
        handleCheckRoundCompletion(remaining);
      }
    } else {
      // INCORRECT COLLOCATION / DISTRACTOR HIT
      sound.playHitWrong();

      // Screen shake animation
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 350);

      // Mark word as wrong hit
      setFlyingWords((prev) =>
        prev.map((w) => (w.id === word.id ? { ...w, isHit: true, hitType: 'WRONG' } : w))
      );

      // Remove after bounce
      setTimeout(() => {
        setFlyingWords((prev) => prev.filter((w) => w.id !== word.id));
      }, 300);

      // Reset combo, deduct 1 life
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

      // Instant educational feedback explaining WHY it's wrong!
      showFeedback(
        'WRONG',
        'DEFLECTOR SHIELD HIT!',
        `❌ "${activeBaseWord} ${word.text}" is incorrect! ${word.tip}`,
        activeBaseWord,
        word.text
      );

      // Game Over check
      if (newLives <= 0) {
        sound.playGameOver();
        setGameState('GAME_OVER');
      }
    }
  };

  // Remove expired laser beam from canvas
  const handleRemoveLaser = (id: string) => {
    setLaserBeams((prev) => prev.filter((b) => b.id !== id));
  };

  // Save score to local high scores
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
        // Storage restricted
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

      {/* Global Top Bar HUD */}
      <HUD
        stats={stats}
        gameState={gameState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTogglePause={() => {
          if (gameState === 'PLAYING') setGameState('PAUSED');
          else if (gameState === 'PAUSED') setGameState('PLAYING');
        }}
        onOpenTeacherStudio={() => setGameState('TEACHER_STUDIO')}
        onRestart={() => handleStartGame(gameMode)}
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
          {/* Boss Battle Display if active */}
          {bossState && (
            <BossBattleDisplay
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

          {/* Paused Screen Overlay */}
          {gameState === 'PAUSED' && (
            <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 border border-cyan-500/60 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <h3 className="text-2xl font-black text-white font-arcade tracking-wider mb-2">
                  SIMULATION PAUSED
                </h3>
                <p className="text-xs text-slate-400 mb-6">Take a breath and review your collocations.</p>
                <button
                  onClick={() => setGameState(bossState ? 'BOSS_BATTLE' : 'PLAYING')}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg"
                >
                  Resume Mission
                </button>
              </div>
            </div>
          )}

          {/* Bottom Turret Station with active base word */}
          <TurretStation
            baseWord={bossState ? bossState.baseWord : currentRound.baseWord}
            category={bossState ? 'Titan Boss Battle' : currentRound.category}
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

      {/* Game Over / Victory Screen */}
      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <GameOverModal
          stats={stats}
          isVictory={gameState === 'VICTORY'}
          onRestart={() => handleStartGame(gameMode)}
          onOpenTeacherStudio={() => setGameState('TEACHER_STUDIO')}
          onSaveHighScore={handleSaveHighScore}
        />
      )}
    </div>
  );
}
