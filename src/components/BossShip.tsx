import React from 'react';
import { BossState } from '../types/game';
import { Skull, Zap } from 'lucide-react';

interface BossShipProps {
  boss: BossState;
  isHitFlash: boolean;
}

export const BossShip: React.FC<BossShipProps> = ({ boss, isHitFlash }) => {
  const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);
  const bankAngle = Math.max(-14, Math.min(14, boss.vx * 35));
  const isTitan = boss.name.includes('TITAN');
  const isDefeated = boss.isDefeated;
  const defeatProgress = boss.defeatStage ?? 0;

  return (
    <div
      id="flying-boss-ship"
      className={`fixed z-20 pointer-events-none select-none transition-transform duration-75 ${
        isDefeated ? 'animate-boss-tremble' : ''
      }`}
      style={{
        left: `${boss.x}%`,
        top: `${boss.y}%`,
        transform: isDefeated
          ? undefined
          : `translate(-50%, -50%) rotate(${bankAngle}deg)`,
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Floating Monster Health & Status Badge (Compact Nameplate Above Monster) */}
        <div className="mb-1 flex flex-col items-center gap-1 z-30">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full shadow-lg backdrop-blur-md transition-colors ${
              isDefeated
                ? 'bg-rose-950 border-2 border-red-500 animate-pulse shadow-[0_0_25px_#ef4444]'
                : 'bg-slate-950/90 border border-rose-500/80'
            }`}
          >
            <Skull className={`w-3.5 h-3.5 ${isDefeated ? 'text-amber-400 animate-spin' : 'text-rose-500 animate-pulse'}`} />
            <span className="text-[11px] font-black tracking-wider text-rose-300 uppercase font-arcade">
              {isDefeated ? 'CORE COLLAPSE IN PROGRESS!' : boss.name}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isDefeated 
                ? 'bg-red-900 text-yellow-300 border-red-500 animate-ping'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}>
              {boss.currentHp} / {boss.maxHp} HP
            </span>
          </div>

          {/* Monster Health Bar */}
          <div className="w-48 sm:w-60 bg-slate-950 border border-rose-900 rounded-full h-2.5 overflow-hidden p-0.5 shadow-md">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isDefeated
                  ? 'bg-red-600 animate-pulse'
                  : hpPercent > 50
                  ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300'
                  : 'bg-gradient-to-r from-red-600 to-rose-500'
              }`}
              style={{ width: `${isDefeated ? 0 : hpPercent}%` }}
            />
          </div>

          {/* Target Base Word Hint */}
          {!isDefeated && (
            <div className="px-2.5 py-0.5 bg-slate-900/95 border border-cyan-400/60 rounded-full flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[10px] text-slate-300 font-medium">
                Shoot <span className="font-bold text-cyan-300">{boss.baseWord}</span> collocations!
              </span>
            </div>
          )}
        </div>

        {/* --- ACTUAL MONSTER CREATURE SPRITE (NOT A TEXT BOX) --- */}
        <div
          className={`relative transition-all duration-150 ${
            isDefeated
              ? defeatProgress > 0.85
                ? 'scale-150 opacity-0 filter brightness-300 blur-sm duration-500'
                : 'scale-110 filter brightness-200 contrast-150 drop-shadow-[0_0_60px_#ef4444]'
              : isHitFlash
              ? 'scale-115 filter brightness-200 drop-shadow-[0_0_50px_#ef4444]'
              : 'filter drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]'
          }`}
        >
          {/* Forcefield Aura */}
          <div
            className={`absolute -inset-3 rounded-full border-2 transition-all duration-200 pointer-events-none animate-pulse ${
              isDefeated
                ? 'border-yellow-400 bg-red-600/30'
                : isHitFlash
                ? 'border-white bg-white/20'
                : 'border-rose-500/60 bg-rose-500/10'
            }`}
          />

          {isTitan ? (
            /* MONSTER 1: THE COSMIC TITAN (Multi-Tentacled Alien Beholder with glowing eye and mandibles) */
            <svg
              width="240"
              height="200"
              viewBox="0 0 240 200"
              className="overflow-visible"
            >
              <defs>
                {/* Body gradients */}
                <radialGradient id="titanGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#881337" />
                  <stop offset="60%" stopColor="#4c0519" />
                  <stop offset="100%" stopColor="#1e0209" />
                </radialGradient>
                <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#dc2626" />
                </radialGradient>
                <linearGradient id="hornGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Undulating Alien Tentacles (Back Layer) */}
              <g className="animate-pulse">
                <path
                  d="M50 120 Q30 160 40 190 Q30 170 45 130"
                  fill="none"
                  stroke="#be123c"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M190 120 Q210 160 200 190 Q210 170 195 130"
                  fill="none"
                  stroke="#be123c"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M80 135 Q70 175 85 195 Q75 170 85 140"
                  fill="none"
                  stroke="#9f1239"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M160 135 Q170 175 155 195 Q165 170 155 140"
                  fill="none"
                  stroke="#9f1239"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </g>

              {/* Plasma Horns / Antennae */}
              <path
                d="M70 50 Q40 20 25 10 Q50 30 75 55"
                fill="url(#hornGrad)"
                stroke="#22d3ee"
                strokeWidth="2"
              />
              <path
                d="M170 50 Q200 20 215 10 Q190 30 165 55"
                fill="url(#hornGrad)"
                stroke="#22d3ee"
                strokeWidth="2"
              />
              <circle cx="25" cy="10" r="5" fill="#22d3ee" className="animate-ping" />
              <circle cx="215" cy="10" r="5" fill="#22d3ee" className="animate-ping" />

              {/* Monster Main Chitin Head / Body */}
              <ellipse
                cx="120"
                cy="90"
                rx="70"
                ry="55"
                fill="url(#titanGlow)"
                stroke="#f43f5e"
                strokeWidth="4"
              />

              {/* Spiked Armor Ridges */}
              <path
                d="M60 70 L70 55 L85 68 L100 50 L120 65 L140 50 L155 68 L170 55 L180 70"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Giant Fiery Cyclops Eye */}
              <circle cx="120" cy="85" r="26" fill="#000000" stroke="#f43f5e" strokeWidth="3" />
              <circle cx="120" cy="85" r="22" fill="url(#eyeGlow)" />
              {/* Slit Monster Pupil */}
              <ellipse cx="120" cy="85" rx="5" ry="18" fill="#18181b" />
              {/* Eye Glint */}
              <circle cx="115" cy="78" r="4" fill="#ffffff" opacity="0.8" />

              {/* Secondary Creepy Eyes */}
              <circle cx="75" cy="85" r="7" fill="#facc15" stroke="#dc2626" strokeWidth="2" />
              <circle cx="75" cy="85" r="2.5" fill="#000" />
              <circle cx="165" cy="85" r="7" fill="#facc15" stroke="#dc2626" strokeWidth="2" />
              <circle cx="165" cy="85" r="2.5" fill="#000" />

              {/* Open Maw with Sharp Monster Teeth (Spits Words from Here!) */}
              <g className="transition-transform duration-100">
                <path
                  d="M85 115 Q120 145 155 115 Q120 125 85 115"
                  fill="#000000"
                  stroke="#ef4444"
                  strokeWidth="3"
                />
                {/* Sharp Teeth */}
                <polygon points="95,117 100,126 105,118" fill="#ffffff" />
                <polygon points="110,120 115,130 120,120" fill="#ffffff" />
                <polygon points="125,120 130,130 135,120" fill="#ffffff" />
                <polygon points="140,118 145,126 150,117" fill="#ffffff" />

                {/* Glowing Plasma Charge in Maw (Pulsates when shooting) */}
                <circle
                  cx="120"
                  cy="125"
                  r={boss.isFiring ? 12 : 7}
                  fill="#22d3ee"
                  className={boss.isFiring ? 'animate-ping' : 'animate-pulse'}
                />
              </g>

              {/* Front Undulating Tentacles */}
              <path
                d="M100 135 Q90 170 105 195 Q95 170 105 140"
                fill="none"
                stroke="#e11d48"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M140 135 Q150 170 135 195 Q145 170 135 140"
                fill="none"
                stroke="#e11d48"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            /* MONSTER 2: VOID OVERLORD (Winged Cyber-Dragon Demon with flaming maw) */
            <svg
              width="260"
              height="200"
              viewBox="0 0 260 200"
              className="overflow-visible"
            >
              <defs>
                <radialGradient id="dragonBody" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4c0519" />
                  <stop offset="80%" stopColor="#1c0a1a" />
                  <stop offset="100%" stopColor="#090514" />
                </radialGradient>
                <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#991b1b" />
                  <stop offset="100%" stopColor="#450a0a" />
                </linearGradient>
              </defs>

              {/* Dragon Wings (Flapping Animated) */}
              <g className="animate-pulse origin-center">
                {/* Left Wing */}
                <path
                  d="M90 70 Q30 20 10 50 Q40 80 85 95 Z"
                  fill="url(#wingGrad)"
                  stroke="#ef4444"
                  strokeWidth="3"
                />
                <path d="M10 50 L85 95 M40 80 L85 95" stroke="#fca5a5" strokeWidth="1.5" />
                {/* Right Wing */}
                <path
                  d="M170 70 Q230 20 250 50 Q220 80 175 95 Z"
                  fill="url(#wingGrad)"
                  stroke="#ef4444"
                  strokeWidth="3"
                />
                <path d="M250 50 L175 95 M220 80 L175 95" stroke="#fca5a5" strokeWidth="1.5" />
              </g>

              {/* Demonic Curved Horns */}
              <path
                d="M95 55 Q70 10 45 15 Q65 35 90 65"
                fill="#f59e0b"
                stroke="#b45309"
                strokeWidth="2"
              />
              <path
                d="M165 55 Q190 10 215 15 Q195 35 170 65"
                fill="#f59e0b"
                stroke="#b45309"
                strokeWidth="2"
              />

              {/* Dragon Monster Head */}
              <polygon
                points="130,135 85,85 100,50 160,50 175,85"
                fill="url(#dragonBody)"
                stroke="#ef4444"
                strokeWidth="4"
              />

              {/* Glowing Red Dragon Eyes */}
              <polygon points="105,75 118,72 114,80" fill="#facc15" stroke="#dc2626" strokeWidth="2" />
              <polygon points="155,75 142,72 146,80" fill="#facc15" stroke="#dc2626" strokeWidth="2" />
              <circle cx="112" cy="76" r="2" fill="#000" />
              <circle cx="148" cy="76" r="2" fill="#000" />

              {/* Scaled Armor Snout & Open Fiery Maw */}
              <path
                d="M110 95 L130 115 L150 95 L140 125 L120 125 Z"
                fill="#000"
                stroke="#f43f5e"
                strokeWidth="2.5"
              />

              {/* Dragon Fangs */}
              <polygon points="115,96 118,106 122,96" fill="#fff" />
              <polygon points="138,96 142,106 145,96" fill="#fff" />
              <polygon points="124,124 128,114 132,124" fill="#fff" />

              {/* Fiery Blast Core in Jaw (Shoots Words from Here!) */}
              <circle
                cx="130"
                cy="108"
                r={boss.isFiring ? 14 : 8}
                fill="#f97316"
                className={boss.isFiring ? 'animate-ping' : 'animate-pulse'}
              />
            </svg>
          )}

          {/* Muzzle Flash Shockwave When Firing Words */}
          {boss.isFiring && (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 w-16 h-16 bg-cyan-400/40 rounded-full animate-ping pointer-events-none" />
          )}

          {/* --- CASCADING DEFEAT EXPLOSION BURSTS --- */}
          {isDefeated && boss.defeatBursts && boss.defeatBursts.map((burst) => (
            <div
              key={burst.id}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-explosion-pop z-40"
              style={{
                left: `calc(50% + ${burst.x}px)`,
                top: `calc(50% + ${burst.y}px)`,
                width: `${burst.size}px`,
                height: `${burst.size}px`,
              }}
            >
              {/* Outer Fiery Blast Glow */}
              <div
                className="w-full h-full rounded-full border-2 opacity-95 shadow-2xl"
                style={{
                  borderColor: burst.color,
                  backgroundColor: `${burst.color}99`,
                  boxShadow: `0 0 45px ${burst.color}`,
                }}
              />
              {/* White Hot Flash Spark */}
              <div className="absolute inset-1/4 rounded-full bg-white animate-ping" />
            </div>
          ))}

          {/* Expanding Mega Shockwave Rings on Final Shatter */}
          {isDefeated && defeatProgress > 0.65 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border-4 border-amber-300 animate-mega-ring pointer-events-none z-30" />
          )}
          {isDefeated && defeatProgress > 0.82 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-4 border-cyan-400 animate-mega-ring pointer-events-none z-30" />
          )}
        </div>
      </div>
    </div>
  );
};
