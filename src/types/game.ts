export type GameMode = 'ADVENTURE' | 'RAPID_FIRE' | 'BOSS_RUSH' | 'TEACHER_DECK';

export type GameState = 
  | 'TITLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_CLEAR'
  | 'BOSS_WARNING'
  | 'BOSS_BATTLE'
  | 'GAME_OVER'
  | 'VICTORY'
  | 'TEACHER_STUDIO';

export interface DistractorItem {
  word: string;
  tip: string; // e.g. "We say 'do homework', never 'make homework'!"
}

export interface CollocationRound {
  id: string;
  baseWord: string; // e.g. "MAKE", "TAKE", "HEAVY"
  category: string; // e.g. "Everyday Verbs", "Adjectives", "Academic"
  level: 'A2' | 'B1' | 'B2' | 'C1';
  targetCollocations: string[]; // words that correctly collocate with baseWord
  distractors: DistractorItem[]; // words that do NOT collocate, with educational tips
  exampleSentence?: string; // e.g. "I need to make a decision quickly."
}

export interface CollocationDeck {
  id: string;
  title: string;
  description: string;
  level: 'A2' | 'B1' | 'B2' | 'C1' | 'MIXED';
  isDefault: boolean;
  rounds: CollocationRound[];
}

export type WordOrigin = 'TOP' | 'LEFT' | 'RIGHT';

export interface FlyingWord {
  id: string;
  text: string;
  isCorrect: boolean;
  tip?: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  vx: number; // horizontal velocity per tick
  vy: number; // vertical velocity per tick
  rotation: number;
  origin: WordOrigin;
  isHit?: boolean;
  isMissed?: boolean;
  hitType?: 'CORRECT' | 'WRONG';
}

export interface BossState {
  name: string;
  subtitle: string;
  maxHp: number;
  currentHp: number;
  baseWord: string;
  validTargetsNeeded: string[];
  distractors: DistractorItem[];
  hitsTaken: number;
  avatarIcon: string;
}

export interface LaserBeam {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  timestamp: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface PlayerStats {
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  maxLives: number;
  level: number;
  roundIndex: number;
  correctHits: number;
  wrongHits: number;
  bossesDefeated: number;
  learnedCollocations: { phrase: string; baseWord: string }[];
  mistakesMade: { baseWord: string; word: string; tip: string }[];
}

export interface HighScoreRecord {
  id: string;
  playerName: string;
  score: number;
  level: number;
  maxCombo: number;
  accuracy: number;
  date: string;
}

export interface EducationalFeedback {
  id: string;
  type: 'CORRECT' | 'WRONG' | 'BOSS_HIT' | 'LEVEL_UP';
  title: string;
  detail: string;
  baseWord: string;
  word: string;
  timestamp: number;
}
