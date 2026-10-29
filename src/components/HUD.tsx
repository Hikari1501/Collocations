import React from 'react';
import { PlayerStats, GameState } from '../types/game';
import { Volume2, VolumeX, Flame, Heart, BookOpen, Pause, Play, RefreshCw } from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  gameState: GameState;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenTeacherStudio: () => void;
  onRestart: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  gameState,
  isMuted,
  onToggleMute,
  onTogglePause,
  onOpenTeacherStudio,
  onRestart,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-25 bg-slate-950/80 border-b border-cyan-900/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-base sm:text-lg font-black tracking-wider text-cyan-400 font-arcade drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
          COLLOCATION BLASTER
        </span>
      </div>

      {/* Center Game HUD Meters */}
      {gameState !== 'TEACHER_STUDIO' && gameState !== 'TITLE' && (
        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          {/* Score */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              SCORE
            </span>
            <span className="text-base sm:text-xl font-black text-amber-400 tabular-nums drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Combo Multiplier */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              MULTIPLIER
            </span>
            <div className="flex items-center gap-0.5">
              <span
                className={`text-sm sm:text-base font-black tabular-nums ${
                  stats.combo > 2
                    ? 'text-orange-400 drop-shadow-[0_0_8px_#f97316]'
                    : 'text-cyan-300'
                }`}
              >
                x{stats.combo}
              </span>
              {stats.combo >= 3 && (
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
              )}
            </div>
          </div>

          {/* Level / Wave */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              SECTOR
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-200 tabular-nums">
              LVL {stats.level}
            </span>
          </div>

          {/* Lives / Energy Hearts */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              SHIELDS
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: stats.maxLives }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 transition-all ${
                    idx < stats.lives
                      ? 'text-rose-500 fill-rose-500 filter drop-shadow-[0_0_4px_#ef4444]'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Restart Quick Button during play */}
        {gameState === 'PLAYING' && (
          <button
            onClick={onRestart}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Restart Wave"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Audio Toggle */}
        <button
          onClick={onToggleMute}
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Pause Toggle */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <button
            onClick={onTogglePause}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title={gameState === 'PAUSED' ? 'Resume Game' : 'Pause Game'}
          >
            {gameState === 'PAUSED' ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        )}

        {/* Teacher Studio Button */}
        <button
          onClick={onOpenTeacherStudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/80 hover:border-cyan-500 transition-colors shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Teacher Studio</span>
        </button>
      </div>
    </header>
  );
};
