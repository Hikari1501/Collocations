import React from 'react';
import { BossState } from '../types/game';
import { Shield, Zap, Skull } from 'lucide-react';

interface BossBattleDisplayProps {
  boss: BossState;
  isHitFlash: boolean;
}

export const BossBattleDisplay: React.FC<BossBattleDisplayProps> = ({ boss, isHitFlash }) => {
  const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);

  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none pointer-events-none">
      {/* Boss Ship & Shield Container */}
      <div
        className={`relative flex flex-col items-center p-3 rounded-2xl transition-all duration-150 ${
          isHitFlash
            ? 'scale-105 filter drop-shadow-[0_0_30px_#ef4444]'
            : 'filter drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]'
        }`}
      >
        {/* Pulsing Shield Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-rose-500/60 animate-pulse pointer-events-none" />

        {/* Boss Header & Avatar */}
        <div className="flex items-center gap-3 bg-slate-950/90 border border-rose-500/80 px-5 py-2.5 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="text-3xl animate-bounce">{boss.avatarIcon}</div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-rose-400 uppercase font-arcade flex items-center gap-1">
                <Skull className="w-3.5 h-3.5 text-rose-500" />
                BOSS: {boss.name}
              </span>
              <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-700/60 px-1.5 py-0.5 rounded font-bold">
                {boss.currentHp} / {boss.maxHp} HP
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              {boss.subtitle} · Shoot valid collocations for <span className="font-bold text-rose-300">{boss.baseWord}</span>!
            </p>
          </div>
        </div>

        {/* Multi-hit Boss Health Bar */}
        <div className="mt-2 w-72 sm:w-96 bg-slate-950 border border-rose-800/80 rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              hpPercent > 50
                ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                : 'bg-gradient-to-r from-red-600 to-rose-400'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Hit Segment Indicators */}
        <div className="flex gap-1.5 mt-1.5">
          {Array.from({ length: boss.maxHp }).map((_, idx) => (
            <div
              key={idx}
              className={`w-5 h-1.5 rounded-sm transition-all ${
                idx < boss.currentHp
                  ? 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
