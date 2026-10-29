import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { RotateCcw, Trophy, Award, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GameOverModalProps {
  stats: PlayerStats;
  isVictory: boolean;
  onRestart: () => void;
  onOpenTeacherStudio: () => void;
  onSaveHighScore: (name: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isVictory,
  onRestart,
  onOpenTeacherStudio,
  onSaveHighScore,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [hasSaved, setHasSaved] = useState(false);

  const totalAttempts = stats.correctHits + stats.wrongHits;
  const accuracy = totalAttempts > 0 ? Math.round((stats.correctHits / totalAttempts) * 100) : 0;

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || hasSaved) return;
    onSaveHighScore(playerName.trim());
    setHasSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] my-8">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800 border border-slate-700 mb-3 shadow-inner">
            {isVictory ? (
              <Trophy className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_#f59e0b]" />
            ) : (
              <Award className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_12px_#06b6d4]" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase font-arcade">
            {isVictory ? 'MISSION ACCOMPLISHED!' : 'MISSION DEBRIEF'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isVictory
              ? 'Outstanding shooting! You cleared all sectors and defeated the Collocation Titans!'
              : 'Deflector shields depleted! Great effort — review your vocabulary below and try again!'}
          </p>
        </div>

        {/* Score & Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              FINAL SCORE
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ACCURACY
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
              {accuracy}%
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              MAX COMBO
            </span>
            <div className="text-xl sm:text-2xl font-black text-cyan-300 tabular-nums">
              x{stats.maxCombo}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SECTOR REACHED
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-300 tabular-nums">
              LVL {stats.level}
            </div>
          </div>
        </div>

        {/* High Score Submission */}
        {!hasSaved ? (
          <form onSubmit={handleSaveScore} className="mb-6 flex gap-2">
            <input
              type="text"
              maxLength={15}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter cadet name for leaderboard..."
              className="flex-1 bg-slate-950 border border-cyan-500/40 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              Save Record
            </button>
          </form>
        ) : (
          <div className="mb-6 py-2 px-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-center text-xs font-semibold text-emerald-300">
            ✓ Score saved to arcade high score records!
          </div>
        )}

        {/* Learning Review Section */}
        <div className="space-y-4 mb-6 max-h-56 overflow-y-auto pr-1">
          {/* Mistakes to review */}
          {stats.mistakesMade.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vocabulary To Review ({stats.mistakesMade.length})
              </span>
              <div className="space-y-2">
                {stats.mistakesMade.slice(0, 6).map((mistake, idx) => (
                  <div key={idx} className="text-xs bg-slate-950/70 p-2.5 rounded-xl border border-rose-900/40">
                    <span className="font-bold text-rose-300">
                      ❌ {mistake.baseWord} + {mistake.word}
                    </span>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      <span className="text-slate-400 font-semibold">Correction:</span> {mistake.tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mastered collocations */}
          {stats.learnedCollocations.length > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Collocations Blasted ({stats.learnedCollocations.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {stats.learnedCollocations.slice(0, 14).map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-950/80 border border-emerald-600/40 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  >
                    {item.phrase}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRestart}
            className="w-full sm:flex-1 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black tracking-wider uppercase text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 fill-slate-950" />
            Play Again
          </button>

          <button
            onClick={onOpenTeacherStudio}
            className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Teacher Studio
          </button>
        </div>
      </div>
    </div>
  );
};
