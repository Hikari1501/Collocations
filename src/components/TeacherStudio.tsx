import React, { useState } from 'react';
import { CollocationDeck, CollocationRound } from '../types/game';
import { 
  ArrowLeft, Plus, Trash2, Download, Upload, Play, Check, 
  AlertCircle, BookMarked, Share2, Copy, RefreshCw, Mail, BarChart3, Users 
} from 'lucide-react';

interface TeacherStudioProps {
  decks: CollocationDeck[];
  activeDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onSaveDeck: (updatedDeck: CollocationDeck) => void;
  onCreateDeck: (newDeck: CollocationDeck) => void;
  onDeleteDeck: (deckId: string) => void;
  onResetToDefaults: () => void;
  onPlayDeck: (deck: CollocationDeck) => void;
  onClose: () => void;
}

export const TeacherStudio: React.FC<TeacherStudioProps> = ({
  decks,
  activeDeckId,
  onSelectDeck,
  onSaveDeck,
  onCreateDeck,
  onDeleteDeck,
  onResetToDefaults,
  onPlayDeck,
  onClose,
}) => {
  const currentDeck = decks.find((d) => d.id === activeDeckId) || decks[0];

  const [activeTab, setActiveTab] = useState<'EDITOR' | 'GRADEBOOK'>('EDITOR');
  const [editingRound, setEditingRound] = useState<CollocationRound | null>(
    currentDeck.rounds[0] || null
  );
  const [csvModalOpen, setCsvModalOpen] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [csvText, setCsvText] = useState<string>('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Gradebook Analyzer state
  const [pastedReports, setPastedReports] = useState<string>('');
  const [analyzedStats, setAnalyzedStats] = useState<{
    count: number;
    avgScore: number;
    avgAccuracy: number;
    mistakesRank: Array<{ error: string; count: number }>;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate shareable link
  const getShareableLink = () => {
    if (typeof window === 'undefined') return '';
    try {
      const json = JSON.stringify(currentDeck);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      const base = window.location.origin + window.location.pathname;
      return `${base}#deck=${encoded}`;
    } catch {
      return window.location.href;
    }
  };

  const handleCopyShareLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('Share link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Create a new blank deck
  const handleCreateNewDeck = () => {
    const newId = `custom-deck-${Date.now()}`;
    const newDeck: CollocationDeck = {
      id: newId,
      title: 'New Classroom Collocation Unit',
      description: 'Teacher created custom collocation set.',
      level: 'B1',
      isDefault: false,
      teacherEmail: '',
      rounds: [
        {
          id: `round-${Date.now()}`,
          baseWord: 'TAKE',
          category: 'Action Verbs',
          level: 'B1',
          targetCollocations: ['a photo', 'a break', 'notes', 'care'],
          distractors: [
            { word: 'homework', tip: "We say 'DO homework', not 'take homework'!" },
            { word: 'a mistake', tip: "We 'MAKE a mistake', not 'take a mistake'!" },
          ],
          exampleSentence: 'Take a break after finishing your exercise.',
        },
      ],
    };
    onCreateDeck(newDeck);
    onSelectDeck(newId);
    setEditingRound(newDeck.rounds[0]);
    showToast('New custom deck created!');
  };

  // Add a new base word round to current deck
  const handleAddRound = () => {
    const newRound: CollocationRound = {
      id: `round-${Date.now()}`,
      baseWord: 'NEW WORD',
      category: 'Vocabulary',
      level: currentDeck.level === 'MIXED' ? 'B1' : currentDeck.level,
      targetCollocations: ['phrase 1', 'phrase 2'],
      distractors: [
        { word: 'distractor 1', tip: "Explain why this collocation is incorrect." },
      ],
      exampleSentence: 'Example sentence featuring this collocation.',
    };

    const updatedRounds = [...currentDeck.rounds, newRound];
    const updatedDeck = { ...currentDeck, rounds: updatedRounds };
    onSaveDeck(updatedDeck);
    setEditingRound(newRound);
    showToast(`Added new base word to ${currentDeck.title}`);
  };

  // Save current editing round
  const handleSaveEditingRound = (roundToSave: CollocationRound) => {
    const updatedRounds = currentDeck.rounds.map((r) =>
      r.id === roundToSave.id ? roundToSave : r
    );
    const updatedDeck = { ...currentDeck, rounds: updatedRounds };
    onSaveDeck(updatedDeck);
    setEditingRound(roundToSave);
    showToast('Round changes saved!');
  };

  // Update deck metadata (e.g. Teacher Email)
  const handleUpdateDeckMeta = (key: keyof CollocationDeck, val: string) => {
    const updatedDeck = { ...currentDeck, [key]: val };
    onSaveDeck(updatedDeck);
  };

  // Delete round
  const handleDeleteRound = (roundId: string) => {
    if (currentDeck.rounds.length <= 1) {
      alert('A deck must have at least one base word round.');
      return;
    }
    const updatedRounds = currentDeck.rounds.filter((r) => r.id !== roundId);
    const updatedDeck = { ...currentDeck, rounds: updatedRounds };
    onSaveDeck(updatedDeck);
    if (editingRound?.id === roundId) {
      setEditingRound(updatedRounds[0]);
    }
    showToast('Word round removed');
  };

  // Export current deck to CSV
  const handleExportCSV = () => {
    const rows = [
      ['BaseWord', 'Type', 'Word', 'Explanation_Tip', 'Category', 'Level', 'ExampleSentence'],
    ];

    currentDeck.rounds.forEach((round) => {
      round.targetCollocations.forEach((word) => {
        rows.push([
          round.baseWord,
          'CORRECT',
          word,
          `Valid collocation with ${round.baseWord}`,
          round.category,
          round.level,
          round.exampleSentence || '',
        ]);
      });
      round.distractors.forEach((d) => {
        rows.push([
          round.baseWord,
          'DISTRACTOR',
          d.word,
          d.tip,
          round.category,
          round.level,
          round.exampleSentence || '',
        ]);
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentDeck.title.toLowerCase().replace(/\s+/g, '_')}_collocations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Deck exported as CSV!');
  };

  // Parse and import CSV
  const handleImportCSVSubmit = () => {
    setCsvError(null);
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setCsvError('CSV must include header and at least one data row.');
        return;
      }

      const roundsMap: { [key: string]: CollocationRound } = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          let val = match[1] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
          }
          matches.push(val.trim());
          if (regex.lastIndex >= line.length) break;
        }

        const baseWord = matches[0]?.toUpperCase();
        const type = matches[1]?.toUpperCase();
        const word = matches[2];
        const tip = matches[3] || `Incorrect collocation with ${baseWord}`;
        const category = matches[4] || 'Custom Vocabulary';
        const level = (matches[5] as 'A2' | 'B1' | 'B2' | 'C1') || 'B1';
        const exampleSentence = matches[6] || '';

        if (!baseWord || !word) continue;

        if (!roundsMap[baseWord]) {
          roundsMap[baseWord] = {
            id: `round-imported-${Date.now()}-${baseWord}`,
            baseWord,
            category,
            level,
            targetCollocations: [],
            distractors: [],
            exampleSentence,
          };
        }

        if (type === 'CORRECT') {
          if (!roundsMap[baseWord].targetCollocations.includes(word)) {
            roundsMap[baseWord].targetCollocations.push(word);
          }
        } else {
          roundsMap[baseWord].distractors.push({ word, tip });
        }
      }

      const parsedRounds = Object.values(roundsMap);
      if (parsedRounds.length === 0) {
        setCsvError('No valid collocation rows could be parsed. Check column formats.');
        return;
      }

      const importedDeck: CollocationDeck = {
        id: `imported-deck-${Date.now()}`,
        title: `Imported Unit (${parsedRounds.length} words)`,
        description: `Imported from CSV on ${new Date().toLocaleDateString()}`,
        level: 'MIXED',
        isDefault: false,
        rounds: parsedRounds,
      };

      onCreateDeck(importedDeck);
      onSelectDeck(importedDeck.id);
      setEditingRound(parsedRounds[0]);
      setCsvModalOpen(false);
      setCsvText('');
      showToast(`Successfully imported ${parsedRounds.length} base words!`);
    } catch {
      setCsvError('Failed to parse CSV. Please verify column formatting.');
    }
  };

  // Analyze pasted student reports in Gradebook
  const handleAnalyzeReports = () => {
    if (!pastedReports.trim()) return;

    const sections = pastedReports.split(/====================================/g).filter(s => s.trim().length > 20);
    const count = sections.length;
    if (count === 0) {
      showToast('No valid report sections found. Paste complete reports.');
      return;
    }

    let totalScore = 0;
    let totalAccuracy = 0;
    const mistakesMap: Record<string, number> = {};

    sections.forEach((sec) => {
      const scoreMatch = sec.match(/Final Score:\s*([\d,]+)/i);
      if (scoreMatch) {
        totalScore += parseInt(scoreMatch[1].replace(/,/g, ''), 10) || 0;
      }

      const accMatch = sec.match(/Accuracy:\s*(\d+)%/i);
      if (accMatch) {
        totalAccuracy += parseInt(accMatch[1], 10) || 0;
      }

      const mistakeLines = sec.match(/✗ Attempted:\s*(.+)/gi);
      if (mistakeLines) {
        mistakeLines.forEach((line) => {
          const clean = line.replace(/✗ Attempted:\s*/i, '').trim();
          mistakesMap[clean] = (mistakesMap[clean] || 0) + 1;
        });
      }
    });

    const mistakesRank = Object.entries(mistakesMap)
      .map(([error, cnt]) => ({ error, count: cnt }))
      .sort((a, b) => b.count - a.count);

    setAnalyzedStats({
      count,
      avgScore: Math.round(totalScore / count),
      avgAccuracy: Math.round(totalAccuracy / count),
      mistakesRank,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 pt-6 sm:pt-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-cyan-900 border border-cyan-400 text-cyan-100 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-cyan-300" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-300 transition-colors shrink-0"
            title="Return to Game"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2 font-arcade">
              <BookMarked className="w-6 h-6 text-cyan-400 shrink-0" />
              TEACHER CUSTOMIZATION & CLASSROOM SUITE
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Create and share custom collocation decks with students, and analyze their homework results.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Deck Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600 rounded-xl text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            Share With Students
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export CSV
          </button>

          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            Import CSV
          </button>

          <button
            onClick={() => onPlayDeck(currentDeck)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Play Deck
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="max-w-6xl mx-auto flex gap-2 mt-4">
        <button
          onClick={() => setActiveTab('EDITOR')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'EDITOR'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Deck & Word Editor
        </button>
        <button
          onClick={() => setActiveTab('GRADEBOOK')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'GRADEBOOK'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Classroom Results Analyzer
        </button>
      </div>

      {activeTab === 'EDITOR' ? (
        /* Main 2-Column Split: Deck & Round Selector (Left) / Detail Editor (Right) */
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Deck Selection & Rounds List (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Deck Selector Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Curriculum Deck
                </span>
                <button
                  onClick={handleCreateNewDeck}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Deck
                </button>
              </div>

              <select
                value={currentDeck.id}
                onChange={(e) => {
                  onSelectDeck(e.target.value);
                  const deck = decks.find((d) => d.id === e.target.value);
                  if (deck && deck.rounds.length > 0) {
                    setEditingRound(deck.rounds[0]);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.title} ({deck.level})
                  </option>
                ))}
              </select>

              {/* Teacher Email configuration for homework */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  Teacher Email (For student result reports)
                </label>
                <input
                  type="email"
                  value={currentDeck.teacherEmail || ''}
                  onChange={(e) => handleUpdateDeckMeta('teacherEmail', e.target.value)}
                  placeholder="e.g. teacher@school.edu"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {!currentDeck.isDefault && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[11px] text-amber-400/90 font-medium">Custom Teacher Deck</span>
                  <button
                    onClick={() => onDeleteDeck(currentDeck.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Deck
                  </button>
                </div>
              )}
            </div>

            {/* Words in Current Deck */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Base Words ({currentDeck.rounds.length})
                </span>
                <button
                  onClick={handleAddRound}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Word
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto pr-1">
                {currentDeck.rounds.map((round) => {
                  const isSelected = editingRound?.id === round.id;
                  return (
                    <button
                      key={round.id}
                      onClick={() => setEditingRound(round)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-base font-black tracking-wider uppercase font-arcade">
                          {round.baseWord}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {round.targetCollocations.length} collocations · {round.distractors.length} distractors
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                        {round.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset to defaults safety button */}
            <button
              onClick={onResetToDefaults}
              className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 py-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset all default curriculum decks
            </button>
          </div>

          {/* Right Column: Base Word & Collocation Editor (8 cols) */}
          <div className="lg:col-span-8">
            {editingRound ? (
              <RoundEditor
                round={editingRound}
                onSave={handleSaveEditingRound}
                onDelete={() => handleDeleteRound(editingRound.id)}
              />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                Select or add a base word to edit collocations.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Classroom Results Analyzer Tab */
        <div className="max-w-4xl mx-auto mt-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white font-arcade">
                CLASSROOM STUDENT REPORTS ANALYZER
              </h2>
              <p className="text-xs text-slate-400">
                Paste the report text submitted by your students (from email, Google Classroom, or Teams) to see aggregated class insights!
              </p>
            </div>
          </div>

          <textarea
            rows={7}
            value={pastedReports}
            onChange={(e) => setPastedReports(e.target.value)}
            placeholder={`Paste student reports here (you can paste multiple students' reports one after another)...\n\n====================================\nENGLISH COLLOCATION BLASTER REPORT\n====================================\nStudent Name: Alex\nDeck / Topic: Everyday Power Verbs\nFinal Score: 3,400 pts\nAccuracy: 88%\n...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 mb-4"
          />

          <div className="flex justify-end mb-6">
            <button
              onClick={handleAnalyzeReports}
              disabled={!pastedReports.trim()}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
            >
              Analyze Submissions
            </button>
          </div>

          {/* Analyzed Results */}
          {analyzedStats && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Submissions</span>
                  <div className="text-2xl font-black text-white">{analyzedStats.count}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Class Average Score</span>
                  <div className="text-2xl font-black text-amber-400">{analyzedStats.avgScore.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Class Average Accuracy</span>
                  <div className="text-2xl font-black text-emerald-400">{analyzedStats.avgAccuracy}%</div>
                </div>
              </div>

              {/* Hardest Collocations Ranking */}
              <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
                  Most Frequent Student Misconceptions (Needs Class Review)
                </h3>
                {analyzedStats.mistakesRank.length > 0 ? (
                  <div className="space-y-2">
                    {analyzedStats.mistakesRank.slice(0, 8).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-semibold text-rose-300">❌ {m.error}</span>
                        <span className="text-[11px] bg-rose-950 text-rose-300 font-bold px-2 py-0.5 rounded">
                          {m.count} student{m.count > 1 ? 's' : ''} missed
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">All submissions in this batch had zero errors!</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share With Students Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 font-arcade flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              SHARE DECK WITH STUDENTS
            </h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Students who open this link will directly load <span className="font-bold text-cyan-300">"{currentDeck.title}"</span>. After playing, they can submit their score report card to your email!
            </p>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Student Share Link:
              </span>
              <div className="text-xs font-mono text-cyan-300 break-all bg-slate-900 p-2 rounded-lg max-h-24 overflow-y-auto">
                {getShareableLink()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={handleCopyShareLink}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
                {copiedLink ? 'Copied Link!' : 'Copy Student Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 font-arcade flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              IMPORT COLLOCATION CSV
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Paste CSV contents below. Expected columns:
              <br />
              <code className="text-cyan-300">BaseWord,Type (CORRECT or DISTRACTOR),Word,Explanation_Tip,Category,Level,ExampleSentence</code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`BaseWord,Type,Word,Explanation_Tip,Category,Level,ExampleSentence\nMAKE,CORRECT,a decision,Valid collocation,Action Verbs,A2,She made a decision\nMAKE,DISTRACTOR,homework,We say 'do homework' not 'make homework',Action Verbs,A2,She made a decision`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />

            {csvError && (
              <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {csvError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setCsvModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCSVSubmit}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors"
              >
                Import Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for editing individual base word collocations and distractor hints
interface RoundEditorProps {
  round: CollocationRound;
  onSave: (updated: CollocationRound) => void;
  onDelete: () => void;
}

const RoundEditor: React.FC<RoundEditorProps> = ({ round, onSave, onDelete }) => {
  const [baseWord, setBaseWord] = useState(round.baseWord);
  const [category, setCategory] = useState(round.category);
  const [level, setLevel] = useState(round.level);
  const [exampleSentence, setExampleSentence] = useState(round.exampleSentence || '');
  const [targetCollocations, setTargetCollocations] = useState<string[]>(round.targetCollocations);
  const [newCorrectWord, setNewCorrectWord] = useState('');

  const [distractors, setDistractors] = useState<Array<{ word: string; tip: string }>>(round.distractors);
  const [newDistractorWord, setNewDistractorWord] = useState('');
  const [newDistractorTip, setNewDistractorTip] = useState('');

  React.useEffect(() => {
    setBaseWord(round.baseWord);
    setCategory(round.category);
    setLevel(round.level);
    setExampleSentence(round.exampleSentence || '');
    setTargetCollocations(round.targetCollocations);
    setDistractors(round.distractors);
  }, [round]);

  const handleAddCorrect = () => {
    const trimmed = newCorrectWord.trim().toLowerCase();
    if (!trimmed) return;
    if (targetCollocations.includes(trimmed)) return;
    const updated = [...targetCollocations, trimmed];
    setTargetCollocations(updated);
    setNewCorrectWord('');
    onSave({ ...round, targetCollocations: updated });
  };

  const handleRemoveCorrect = (index: number) => {
    const updated = targetCollocations.filter((_, i) => i !== index);
    setTargetCollocations(updated);
    onSave({ ...round, targetCollocations: updated });
  };

  const handleAddDistractor = () => {
    const word = newDistractorWord.trim().toLowerCase();
    const tip = newDistractorTip.trim() || `Incorrect collocation with ${baseWord}`;
    if (!word) return;
    const updated = [...distractors, { word, tip }];
    setDistractors(updated);
    setNewDistractorWord('');
    setNewDistractorTip('');
    onSave({ ...round, distractors: updated });
  };

  const handleRemoveDistractor = (index: number) => {
    const updated = distractors.filter((_, i) => i !== index);
    setDistractors(updated);
    onSave({ ...round, distractors: updated });
  };

  const handleMetadataChange = (key: string, value: string) => {
    if (key === 'baseWord') setBaseWord(value);
    if (key === 'category') setCategory(value);
    if (key === 'level') setLevel(value as 'A2' | 'B1' | 'B2' | 'C1');
    if (key === 'exampleSentence') setExampleSentence(value);

    onSave({
      ...round,
      baseWord: key === 'baseWord' ? value.toUpperCase() : baseWord,
      category: key === 'category' ? value : category,
      level: key === 'level' ? (value as 'A2' | 'B1' | 'B2' | 'C1') : level,
      exampleSentence: key === 'exampleSentence' ? value : exampleSentence,
      targetCollocations,
      distractors,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            BASE WORD:
          </div>
          <input
            type="text"
            value={baseWord}
            onChange={(e) => handleMetadataChange('baseWord', e.target.value)}
            className="text-2xl font-black uppercase text-cyan-300 bg-slate-950 border border-cyan-500/50 rounded-xl px-3 py-1 font-arcade tracking-wider focus:outline-none focus:border-cyan-300"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={level}
            onChange={(e) => handleMetadataChange('level', e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            <option value="A2">CEFR A2</option>
            <option value="B1">CEFR B1</option>
            <option value="B2">CEFR B2</option>
            <option value="C1">CEFR C1</option>
          </select>

          <button
            onClick={onDelete}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Delete this base word"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">
            Category / Grammar Theme
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => handleMetadataChange('category', e.target.value)}
            placeholder="e.g. Action Verbs, Business, Descriptions"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">
            Classroom Example Sentence
          </label>
          <input
            type="text"
            value={exampleSentence}
            onChange={(e) => handleMetadataChange('exampleSentence', e.target.value)}
            placeholder="e.g. He made a decision to study English."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Target Collocations */}
      <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            Correct Collocations ({targetCollocations.length}) — Shoot These!
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {targetCollocations.map((word, idx) => (
            <span
              key={idx}
              className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <span>{baseWord} + {word}</span>
              <button
                onClick={() => handleRemoveCorrect(idx)}
                className="hover:text-rose-400 transition-colors"
                title="Remove collocation"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCorrectWord}
            onChange={(e) => setNewCorrectWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCorrect()}
            placeholder="Enter matching phrase (e.g. 'a decision', 'progress', 'an effort')..."
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={handleAddCorrect}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Add Collocation
          </button>
        </div>
      </div>

      {/* Distractors & Explanations */}
      <div className="bg-slate-950/60 border border-rose-900/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Distractor Words ({distractors.length}) & Corrective Explanations
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          When students click a distractor, the game instantly displays your explanation to correct their misconception!
        </p>

        <div className="flex flex-col gap-2 mb-3">
          {distractors.map((distractor, idx) => (
            <div
              key={idx}
              className="bg-rose-950/50 border border-rose-800/60 rounded-lg p-2.5 flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-rose-300">"{distractor.word}"</span>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  <span className="text-slate-400">Teacher Tip:</span> {distractor.tip}
                </p>
              </div>
              <button
                onClick={() => handleRemoveDistractor(idx)}
                className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                title="Remove distractor"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newDistractorWord}
            onChange={(e) => setNewDistractorWord(e.target.value)}
            placeholder="Distractor word (e.g. 'homework')..."
            className="sm:w-1/3 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-400"
          />
          <input
            type="text"
            value={newDistractorTip}
            onChange={(e) => setNewDistractorTip(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDistractor()}
            placeholder="Educational tip (e.g. 'We say DO homework, not MAKE homework')..."
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-400"
          />
          <button
            onClick={handleAddDistractor}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
          >
            Add Distractor
          </button>
        </div>
      </div>
    </div>
  );
};
