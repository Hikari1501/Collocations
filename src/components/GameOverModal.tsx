import React, { useState } from 'react';
import { PlayerStats, CollocationDeck } from '../types/game';
import { 
  RotateCcw, Trophy, Award, BookOpen, AlertTriangle, 
  CheckCircle2, Home, Mail, Copy, Check, Download, Send, Loader2 
} from 'lucide-react';

interface GameOverModalProps {
  stats: PlayerStats;
  isVictory: boolean;
  deck: CollocationDeck;
  onRestart: () => void;
  onReturnHome: () => void;
  onOpenTeacherStudio: () => void;
  onSaveHighScore: (name: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isVictory,
  deck,
  onRestart,
  onReturnHome,
  onOpenTeacherStudio,
  onSaveHighScore,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [hasSaved, setHasSaved] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [teacherEmailInput, setTeacherEmailInput] = useState(deck.teacherEmail || '');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const totalAttempts = stats.correctHits + stats.wrongHits;
  const accuracy = totalAttempts > 0 ? Math.round((stats.correctHits / totalAttempts) * 100) : 0;

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || hasSaved) return;
    onSaveHighScore(playerName.trim());
    setHasSaved(true);
  };

  const generateReportText = () => {
    const student = playerName.trim() || 'Student';
    const dateStr = new Date().toLocaleDateString();
    
    let text = `====================================\n`;
    text += `ENGLISH COLLOCATION BLASTER REPORT\n`;
    text += `====================================\n`;
    text += `Student Name: ${student}\n`;
    text += `Deck / Topic: ${deck.title} (${deck.level})\n`;
    text += `Date Completed: ${dateStr}\n`;
    text += `Final Score: ${stats.score.toLocaleString()} pts\n`;
    text += `Accuracy: ${accuracy}%\n`;
    text += `Max Combo Streak: x${stats.maxCombo}\n`;
    text += `Sector Reached: Level ${stats.level}\n`;
    text += `Bosses Defeated: ${stats.bossesDefeated}\n\n`;

    text += `--- MASTERED COLLOCATIONS (${stats.learnedCollocations.length}) ---\n`;
    if (stats.learnedCollocations.length > 0) {
      stats.learnedCollocations.forEach((item) => {
        text += `✓ ${item.phrase}\n`;
      });
    } else {
      text += `None recorded.\n`;
    }

    text += `\n--- AREAS TO REVIEW & TEACHER TIPS (${stats.mistakesMade.length}) ---\n`;
    if (stats.mistakesMade.length > 0) {
      stats.mistakesMade.forEach((m) => {
        text += `✗ Attempted: ${m.baseWord} + ${m.word} --> Correction Tip: ${m.tip}\n`;
      });
    } else {
      text += `Flawless run! Zero collocation mistakes!\n`;
    }
    text += `====================================\n`;
    return text;
  };

  const handleCopyReport = () => {
    const report = generateReportText();
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Direct Async In-App Email Dispatch (Never opens blank mailto page)
  const handleDirectEmail = async () => {
    const student = playerName.trim() || 'Student';
    const email = teacherEmailInput.trim();
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid teacher email address.');
      return;
    }

    setEmailSending(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `Collocation Blaster Results: ${student} - ${deck.title}`,
          StudentName: student,
          CurriculumDeck: `${deck.title} (${deck.level})`,
          FinalScore: `${stats.score.toLocaleString()} pts`,
          Accuracy: `${accuracy}%`,
          MaxCombo: `x${stats.maxCombo}`,
          Sector: `Level ${stats.level}`,
          MasteredPhrases: stats.learnedCollocations.map((c) => c.phrase).join(', ') || 'None',
          MistakesReview: stats.mistakesMade.map((m) => `${m.baseWord} + ${m.word} [Tip: ${m.tip}]`).join('; ') || 'None',
          CompleteReport: generateReportText(),
        }),
      });

      if (response.ok) {
        setEmailSuccess(`Results successfully sent directly to ${email}!`);
      } else {
        throw new Error('Direct dispatch failed');
      }
    } catch {
      handleCopyReport();
      setEmailError(`Could not reach email service directly. Report copied to clipboard for Google Classroom!`);
    } finally {
      setEmailSending(false);
    }
  };

  const handleDownloadReport = () => {
    const report = generateReportText();
    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${(playerName.trim() || 'student').toLowerCase()}_collocations_report.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
              : 'Deflector shields depleted! Great effort — review your vocabulary below and send your report to your teacher!'}
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

        {/* Leaderboard Submission & Student Name */}
        <form onSubmit={handleSaveScore} className="mb-6 flex gap-2">
          <input
            type="text"
            maxLength={20}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter student name..."
            className="flex-1 bg-slate-950 border border-cyan-500/40 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-400"
          />
          {!hasSaved ? (
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              Save Record
            </button>
          ) : (
            <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Saved!
            </div>
          )}
        </form>

        {/* Teacher Report Dispatch Section (Direct Sending) */}
        <div className="mb-6 bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              Send Results Directly to Teacher
            </span>
            <span className="text-[10px] text-slate-400">Direct In-App Delivery</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="email"
              value={teacherEmailInput}
              onChange={(e) => setTeacherEmailInput(e.target.value)}
              placeholder="Teacher's email (e.g. teacher@school.edu)..."
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleDirectEmail}
              disabled={emailSending}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap"
            >
              {emailSending ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Mail className="w-4 h-4 text-slate-950" />
              )}
              {emailSending ? 'Sending...' : 'Send Directly'}
            </button>
          </div>

          {/* Success or Error Feedback */}
          {emailSuccess && (
            <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{emailSuccess}</span>
            </div>
          )}

          {emailError && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/70 text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              {copiedReport ? 'Copied to Clipboard!' : 'Copy for Google Classroom'}
            </button>
            <button
              onClick={handleDownloadReport}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Download text report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download .txt
            </button>
          </div>
        </div>

        {/* Learning Review Section */}
        <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-1">
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

          {stats.learnedCollocations.length > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Collocations Blasted ({stats.learnedCollocations.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {stats.learnedCollocations.slice(0, 12).map((item, idx) => (
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

        {/* Action Buttons: Play Again / Return Home / Teacher Studio */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={onRestart}
            className="w-full sm:flex-1 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black tracking-wider uppercase text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 fill-slate-950" />
            Play Again
          </button>

          <button
            onClick={onReturnHome}
            className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            Return to Home
          </button>

          <button
            onClick={onOpenTeacherStudio}
            className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Teacher Studio
          </button>
        </div>
      </div>
    </div>
  );
};
