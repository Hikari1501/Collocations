import React, { useState } from 'react';
import { PlayerStats, GameState } from '../types/game';
import { 
  Volume2, VolumeX, Music, Flame, Heart, BookOpen, 
  Pause, Play, LogOut, AlertCircle 
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  gameState: GameState;
  isMuted: boolean;
  isMusicOn: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onTogglePause: () => void;
  onOpenTeacherStudio: () => void;
  onQuitMission: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  gameState,
  isMuted,
  isMusicOn,
  onToggleMute,
  onToggleMusic,
  onTogglePause,
  onOpenTeacherStudio,
  onQuitMission,
}) => {
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const isPlayingView =
    gameState === 'PLAYING' ||
    gameState === 'PAUSED' ||
    gameState === 'BOSS_BATTLE' ||
    gameState === 'ROUND_CLEAR';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 z-25 bg-slate-950/80 border-b border-cyan-900/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
        {/* Brand Title */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base sm:text-lg font-black tracking-wider text-cyan-400 font-arcade drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            COLLOCATION BLASTER
          </span>
        </div>

        {/* Center Game HUD Meters */}
        {isPlayingView && (
          <div className="flex items-center gap-4 sm:gap-7 shrink-0">
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
                COMBO
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
          {/* Music Toggle */}
          <button
            onClick={onToggleMusic}
            className={`p-2 rounded-lg border transition-colors ${
              isMusicOn
                ? 'text-cyan-300 bg-cyan-950/60 border-cyan-700/60'
                : 'text-slate-500 hover:text-slate-300 bg-slate-900 border-transparent hover:border-slate-800'
            }`}
            title={isMusicOn ? 'Mute Background Music' : 'Play Background Music'}
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Pause Toggle */}
          {isPlayingView && (
            <button
              onClick={onTogglePause}
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title={gameState === 'PAUSED' ? 'Resume Game' : 'Pause Game'}
            >
              {gameState === 'PAUSED' ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          {/* Quit Mission Button during gameplay */}
          {isPlayingView && (
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/80 hover:bg-rose-900/70 hover:border-rose-500 transition-colors"
              title="Quit to Home"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quit</span>
            </button>
          )}

          {/* Teacher Studio Button */}
          {gameState !== 'TEACHER_STUDIO' && (
            <button
              onClick={onOpenTeacherStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/80 hover:border-cyan-500 transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Teacher Studio</span>
            </button>
          )}
        </div>
      </header>

      {/* Quit Mission Confirmation Dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white font-arcade uppercase mb-1">
              Abort Current Mission?
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              Your current progress in this round will be lost and you will return to the Mission Select screen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  setShowQuitConfirm(false);
                  onQuitMission();
                }}
                className="flex-1 py-2 text-xs font-black uppercase text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg"
              >
                Quit to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
