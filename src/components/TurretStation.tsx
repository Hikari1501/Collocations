import React, { useEffect, useState, useRef } from 'react';
import { Target, HelpCircle, Shield } from 'lucide-react';

interface TurretStationProps {
  baseWord: string;
  category: string;
  level: string;
  exampleSentence?: string;
  remainingTargets: number;
  totalTargetsInRound: number;
  isBossActive: boolean;
  bossHp?: number;
  bossMaxHp?: number;
}

export const TurretStation: React.FC<TurretStationProps> = ({
  baseWord,
  category,
  level,
  exampleSentence,
  remainingTargets,
  totalTargetsInRound,
  isBossActive,
  bossHp,
  bossMaxHp,
}) => {
  const [aimAngle, setAimAngle] = useState<number>(-90); // in degrees (-90 = pointing straight up)
  const [showHint, setShowHint] = useState<boolean>(false);
  const turretRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!turretRef.current) return;
      const rect = turretRef.current.getBoundingClientRect();
      const turretCenterX = rect.left + rect.width / 2;
      const turretCenterY = rect.top + rect.height / 2;

      const deltaX = e.clientX - turretCenterX;
      const deltaY = e.clientY - turretCenterY;
      const rad = Math.atan2(deltaY, deltaX);
      const deg = (rad * 180) / Math.PI;

      // Limit barrel rotation so it doesn't aim downwards into the floor
      const clampedDeg = Math.max(-160, Math.min(-20, deg));
      setAimAngle(clampedDeg + 90); // relative to straight up
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const progressPercent = Math.round(
    ((totalTargetsInRound - remainingTargets) / Math.max(1, totalTargetsInRound)) * 100
  );

  return (
    <div
      ref={turretRef}
      id="turret-station-anchor"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none"
    >
      {/* Optional Hint Tooltip */}
      {showHint && exampleSentence && (
        <div className="mb-2 px-4 py-2 bg-slate-900/95 border border-cyan-500/50 rounded-xl shadow-xl backdrop-blur-md text-xs text-cyan-200 max-w-sm text-center animate-fade-in">
          <span className="font-semibold text-cyan-400">Example Usage:</span> "{exampleSentence}"
        </div>
      )}

      {/* Turret Cannon Barrel */}
      <div className="relative w-16 h-12 flex items-center justify-center -mb-2">
        <div
          className="w-4 h-14 bg-gradient-to-t from-cyan-600 via-cyan-400 to-white rounded-t-sm shadow-[0_0_15px_#06b6d4] transition-transform duration-75 origin-bottom"
          style={{ transform: `rotate(${aimAngle}deg)` }}
        >
          {/* Muzzle ring */}
          <div className="w-6 h-2 -ml-1 -mt-1 bg-cyan-200 rounded-sm shadow-[0_0_8px_#22d3ee]" />
        </div>
      </div>

      {/* Turret Base Station Console */}
      <div className="relative w-[340px] sm:w-[460px] bg-slate-900/90 border-t-2 border-x-2 border-cyan-500/70 rounded-t-3xl px-6 py-4 shadow-[0_-10px_35px_rgba(6,182,212,0.25)] backdrop-blur-lg">
        {/* Subtle glowing energy line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

        <div className="flex items-center justify-between gap-3">
          {/* Left Metadata */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] tracking-wider font-semibold uppercase text-cyan-400/90 flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              {isBossActive ? 'BOSS TARGET' : 'BASE WORD'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {category} · {level}
            </span>
          </div>

          {/* Center Main Base Word Spotlight */}
          <div className="flex flex-col items-center">
            <div className="px-5 py-1.5 bg-gradient-to-b from-cyan-950/80 to-slate-900 rounded-xl border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-widest text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] font-arcade">
                {baseWord}
              </span>
            </div>
          </div>

          {/* Right Progress / Boss Status */}
          <div className="flex flex-col items-end">
            {isBossActive ? (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3 text-rose-400" />
                  BOSS SHIELD
                </span>
                <span className="text-sm font-bold text-rose-300 tabular-nums">
                  {bossHp ?? 0} / {bossMaxHp ?? 4} HP
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">
                  PROGRESS
                </span>
                <span className="text-sm font-bold text-cyan-300 tabular-nums">
                  {totalTargetsInRound - remainingTargets} / {totalTargetsInRound}
                </span>
              </div>
            )}

            {/* Hint toggle if example available */}
            {exampleSentence && (
              <button
                onClick={() => setShowHint((prev) => !prev)}
                className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                title="Toggle example sentence hint"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar under console */}
        {!isBossActive && (
          <div className="mt-3 w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_8px_#06b6d4]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
