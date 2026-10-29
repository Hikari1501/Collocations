import React from 'react';
import { EducationalFeedback } from '../types/game';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface FeedbackBannerProps {
  feedback: EducationalFeedback | null;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ feedback }) => {
  if (!feedback) return null;

  const isCorrect = feedback.type === 'CORRECT' || feedback.type === 'BOSS_HIT';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none max-w-lg w-[90%] px-2">
      <div
        className={`px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-200 transform animate-in fade-in slide-in-from-top-3 flex items-start gap-3 ${
          isCorrect
            ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
            : 'bg-rose-950/95 border-rose-500/90 text-rose-100 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-shake'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black tracking-wider uppercase ${
                isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {feedback.title}
            </span>
            {isCorrect && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Valid Collocation
              </span>
            )}
          </div>

          <p className="text-sm font-medium leading-snug mt-0.5">
            {feedback.detail}
          </p>
        </div>
      </div>
    </div>
  );
};
