import React, { useRef } from 'react';
import { FlyingWord } from '../types/game';
import { Crosshair } from 'lucide-react';

interface WordTargetProps {
  word: FlyingWord;
  onShoot: (word: FlyingWord, elementRect: DOMRect) => void;
}

export const WordTarget: React.FC<WordTargetProps> = ({ word, onShoot }) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (word.isHit || word.isMissed) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      onShoot(word, rect);
    }
  };

  let stateClasses = 'bg-slate-900/85 border-slate-700/80 text-slate-100 hover:border-cyan-400 hover:text-cyan-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)]';

  if (word.isHit) {
    if (word.hitType === 'CORRECT') {
      stateClasses = 'bg-emerald-950/90 border-emerald-400 text-emerald-200 scale-110 shadow-[0_0_25px_#10b981]';
    } else {
      stateClasses = 'bg-rose-950/90 border-rose-500 text-rose-200 animate-shake shadow-[0_0_25px_#ef4444]';
    }
  }

  const getThrusterStyle = () => {
    switch (word.origin) {
      case 'TOP':
        return 'before:absolute before:-top-1.5 before:left-1/2 before:-translate-x-1/2 before:w-3 before:h-1.5 before:bg-cyan-400/60 before:rounded-t-full before:blur-[1px]';
      case 'LEFT':
        return 'before:absolute before:-left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-3 before:bg-cyan-400/60 before:rounded-l-full before:blur-[1px]';
      case 'RIGHT':
        return 'before:absolute before:-right-1.5 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-3 before:bg-cyan-400/60 before:rounded-r-full before:blur-[1px]';
      case 'BOSS':
        return 'before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:w-4 before:h-2 before:bg-rose-500/80 before:rounded-t-full before:blur-[2px] shadow-[0_0_15px_rgba(244,63,94,0.4)]';
    }
  };

  return (
    <div
      className="fixed z-15 pointer-events-auto select-none transition-transform duration-75"
      style={{
        left: `${word.x}%`,
        top: `${word.y}%`,
        transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
      }}
    >
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={word.isHit}
        className={`group relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border-2 font-bold text-sm sm:text-base tracking-wide flex items-center gap-2 cursor-crosshair transition-all active:scale-95 backdrop-blur-md ${stateClasses} ${getThrusterStyle()}`}
      >
        <Crosshair className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-cyan-400 transition-opacity" />
        <span className="whitespace-nowrap font-semibold">
          {word.text}
        </span>
      </button>
    </div>
  );
};
