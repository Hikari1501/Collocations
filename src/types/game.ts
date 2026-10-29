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
  tip: string;
}

export interface CollocationRound {
  id: string;
  baseWord: string;
  category: string;
  level: 'A2' | 'B1' | 'B2' | 'C1';
  targetCollocations: string[];
  distractors: DistractorItem[];
  exampleSentence?: string;
}

export interface CollocationDeck {
  id: string;
  title: string;
  description: string;
  level: 'A2' | 'B1' | 'B2' | 'C1' | 'MIXED';
  isDefault: boolean;
  rounds: CollocationRound[];
  teacherEmail?: string;
  classCode?: string;
}

export type WordOrigin = 'TOP' | 'LEFT' | 'RIGHT';

export interface FlyingWord {
  id: string;
  text: string;
  isCorrect: boolean;
  tip?: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  vx: number;
  vy: number;
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
  x: number;
  y: number;
  vx: number;
  vy: number;
  flyAngle: number;
  isHitFlash?: boolean;
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

export interface StudentReport {
  studentName: string;
  deckId: string;
  deckTitle: string;
  teacherEmail?: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  levelReached: number;
  date: string;
  masteredPhrases: string[];
  mistakes: { baseWord: string; word: string; tip: string }[];
}
