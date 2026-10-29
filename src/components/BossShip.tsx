import React from 'react';
import { BossState } from '../types/game';
import { Shield, Skull, Zap } from 'lucide-react';

interface BossShipProps {
  boss: BossState;
  isHitFlash: boolean;
}

export const BossShip: React.FC<BossShipProps> = ({ boss, isHitFlash }) => {
  const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);

  // Bank angle based on horizontal movement
  const bankAngle = Math.max(-14, Math.min(14, boss.vx * 40));

  return (
    <div
      id="flying-boss-ship"
      className="fixed z-20 pointer-events-none select-none transition-transform duration-75"
      style={{
        left: `${boss.x}%`,
        top: `${boss.y}%`,
        transform: `translate(-50%, -50%) rotate(${bankAngle}deg)`,
      }}
    >
      <div
        className={`relative flex flex-col items-center transition-all duration-150 ${
          isHitFlash
            ? 'scale-110 filter brightness-150 drop-shadow-[0_0_40px_#ef4444]'
            : 'filter drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]'
        }`}
      >
        {/* Pulsing Energy Forcefield Dome */}
        <div
          className={`absolute -inset-4 rounded-full border-2 transition-all duration-200 pointer-events-none animate-pulse ${
            isHitFlash
              ? 'border-white bg-white/20'
              : 'border-rose-500/70 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
          }`}
        />

        {/* Orbiting Shield Rings */}
        <div className="absolute -inset-6 rounded-full border border-cyan-400/40 border-dashed animate-spin pointer-events-none" />

        {/* Boss Vessel Hull */}
        <div className="relative z-10 w-64 sm:w-80 bg-slate-950/95 border-2 border-rose-500/80 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex flex-col items-center">
          {/* Top Jet Vents */}
          <div className="flex gap-12 -mt-6 mb-1">
            <div className="w-5 h-3 bg-gradient-to-t from-cyan-400 to-transparent rounded-t-full blur-[1px] animate-pulse" />
            <div className="w-5 h-3 bg-gradient-to-t from-cyan-400 to-transparent rounded-t-full blur-[1px] animate-pulse" />
          </div>

          {/* Boss Header & Title */}
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">{boss.avatarIcon}</span>
              <div className="text-left">
                <span className="text-[11px] sm:text-xs font-black tracking-wider text-rose-400 uppercase font-arcade flex items-center gap-1">
                  <Skull className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {boss.name}
                </span>
                <p className="text-[10px] text-slate-400">{boss.subtitle}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] bg-rose-950/90 text-rose-300 border border-rose-700/80 px-2 py-0.5 rounded-full font-bold tabular-nums">
                {boss.currentHp} / {boss.maxHp} HP
              </span>
            </div>
          </div>

          {/* Multi-Hit Health Bar */}
          <div className="w-full bg-slate-900 border border-rose-800 rounded-full h-3 p-0.5 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                hpPercent > 50
                  ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300'
                  : 'bg-gradient-to-r from-red-600 to-rose-400'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {/* Hit Segments */}
          <div className="flex gap-1.5 mt-2 justify-center w-full">
            {Array.from({ length: boss.maxHp }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-sm transition-all ${
                  idx < boss.currentHp
                    ? 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Target Base Word Callout */}
          <div className="mt-2.5 px-3 py-1 bg-slate-900/90 border border-cyan-400/50 rounded-xl flex items-center gap-2">
            <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[11px] text-slate-300">
              Shoot collocations for <span className="font-black text-cyan-300 tracking-wider font-arcade">{boss.baseWord}</span>!
            </span>
          </div>
        </div>

        {/* Rear Engine Exhaust Flames */}
        <div className="flex gap-14 mt-1">
          <div className="w-4 h-6 bg-gradient-to-b from-rose-500 via-amber-400 to-transparent rounded-b-full blur-[1px] animate-pulse" />
          <div className="w-4 h-6 bg-gradient-to-b from-rose-500 via-amber-400 to-transparent rounded-b-full blur-[1px] animate-pulse" />
        </div>
      </div>
    </div>
  );
};
