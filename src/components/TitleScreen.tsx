import React, { useState } from 'react';
import { GameMode, CollocationDeck, HighScoreRecord } from '../types/game';
import { 
  Play, BookOpen, Trophy, Shield, Crosshair, 
  Flame, Skull, Zap, Sparkles 
} from 'lucide-react';

interface TitleScreenProps {
  decks: CollocationDeck[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onStartGame: (mode: GameMode) => void;
  onOpenTeacherStudio: () => void;
  highScores: HighScoreRecord[];
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  decks,
  selectedDeckId,
  onSelectDeck,
  onStartGame,
  onOpenTeacherStudio,
  highScores,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('ADVENTURE');

  const modes: Array<{
    id: GameMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    tag: string;
  }> = [
    {
      id: 'ADVENTURE',
      title: 'Adventure Campaign',
      description: 'Progression through waves with increasing speed, distractor density, and multi-hit Boss Battles!',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      tag: 'Recommended',
    },
    {
      id: 'BOSS_RUSH',
      title: 'Titan Boss Battle',
      description: 'Challenge the multi-hit Collocation Titans directly! Test your precision under pressure.',
      icon: <Skull className="w-5 h-5 text-rose-400" />,
      tag: 'Multi-Hit Boss',
    },
    {
      id: 'RAPID_FIRE',
      title: 'Rapid Speed Drill',
      description: 'Fast-paced continuous flight waves designed for quick classroom warmups and speed reflex drills.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      tag: 'Speed Focus',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 pt-20 relative overflow-hidden select-none">
      {/* Background Neon Grid Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        {/* Arcade Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ARCADE ENGLISH VOCABULARY DEFENDER
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-400 font-arcade drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]">
          COLLOCATION BLASTER
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
          Aim your turret and blast flying words that form natural English collocations.
          Featuring instant educational tips, multi-hit Boss Titans, and teacher curriculum control.
        </p>

        {/* Quick Instructions Visual Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 font-bold shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase">Check Base Word</div>
              <div className="text-[11px] text-slate-400">Word loaded in bottom turret (e.g. MAKE)</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 font-bold shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase">Shoot Matches</div>
              <div className="text-[11px] text-slate-400">Click words like "a decision" or "progress"</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 font-bold shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase">Defeat Boss Titans</div>
              <div className="text-[11px] text-slate-400">Bosses take multiple hits to destroy!</div>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="w-full max-w-2xl mt-8">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left mb-3">
            Select Game Mission:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {modes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-950/80">{mode.icon}</div>
                    <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                      {mode.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-arcade">{mode.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Curriculum Deck Selector */}
        <div className="w-full max-w-2xl mt-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Curriculum Deck
            </span>
            <span className="text-xs text-slate-300">
              Select preset CEFR level or your custom teacher deck
            </span>
          </div>

          <select
            value={selectedDeckId}
            onChange={(e) => onSelectDeck(e.target.value)}
            className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title} ({deck.level})
              </option>
            ))}
          </select>
        </div>

        {/* Big Launch Mission Action */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <button
            onClick={() => onStartGame(selectedMode)}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black tracking-widest text-sm uppercase rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-arcade"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            START MISSION
          </button>

          <button
            onClick={onOpenTeacherStudio}
            className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Teacher Studio
          </button>
        </div>

        {/* High Score Hall of Fame */}
        {highScores.length > 0 && (
          <div className="w-full max-w-2xl mt-10 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Cadet Hall of Fame (Top Scores)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {highScores.slice(0, 3).map((record, idx) => (
                <div
                  key={record.id || idx}
                  className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-white truncate max-w-[90px]">
                      {record.playerName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-400 tabular-nums">
                      {record.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Lvl {record.level} · {record.accuracy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-500">
        English Collocation Blaster · Multi-Direction Wave Engine & Synthesized Audio
      </footer>
    </div>
  );
};
