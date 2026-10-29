# Collocation Blaster: Retro Arcade English Review

An arcade-style space defender game where students shoot flying words from multi-directional waves that form valid English collocations with a base word, featuring instant educational feedback, progressive speed levels, high scores, and a teacher customization suite.

### User Review & Critical Decisions

> [!IMPORTANT]
> The game design incorporates all three confirmed preferences from the interactive clarification phase:
> 1. **Visual Style**: Retro arcade space defender with dark neon aesthetics, laser blaster animations, and synthesized audio.
> 2. **Word Flight Dynamics**: Multi-directional waves entering fluidly from top, left, and right trajectories.
> 3. **Teacher Capabilities**: Full suite with preloaded CEFR levels (A2, B1, B2, C1, Academic), custom deck editor, and CSV/JSON export & import.

- **Confirmed Decision 1 (Theme)**: 80s synth-arcade space defense aesthetic with dark slate nebula canvas, glowing vector laser trails, and particle bursts.
- **Confirmed Decision 2 (Wave Physics)**: 60 FPS smooth canvas loop where target words glide from the top, left, and right toward the perimeter, with speed scaling by level.
- **Confirmed Decision 3 (Pedagogical Feedback)**: Shooting an incorrect word triggers an instant educational tip (e.g. *"'make homework' is wrong — use 'do homework'"*) rather than just a penalty, reinforcing vocabulary acquisition.

---

### 1. Overview & Core Concept

- **What It Does**: Students control a bottom-anchored Collocation Turret loaded with a target base word (e.g., **MAKE**, **TAKE**, **HEAVY**, **PAY**). Floating words glide onto the screen from top, left, and right vectors. Students click on matching words that form natural collocations (e.g., *a decision*, *progress*, *sense*). Blasting correct words yields laser beams, particle explosions, combo multipliers, and phrase confirmation. Incorrect choices trigger shield deflections and instant corrective tips.
- **Target Audience / Persona**: ESL/EFL students (primary to adult learners) practicing collocation fluency, plus English language teachers preparing engaging classroom drills and customized vocabulary units.
- **Key Value**: Replaces dry flashcard memorization with fast-paced, high-engagement arcade action while delivering immediate corrective grammar feedback.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Title & Mission Select**: View instructions, high score table, select game mode (Adventure Mode with progressive speed, Rapid Drill, or Custom Teacher Deck), and start game.
  2. **Active Arcade Gameplay**:
     - Base word displayed prominently in the bottom turret station (e.g. `BASE: "PAY"`).
     - Target words spawn and drift inward from top, left, and right with soft thruster trails.
     - Student clicks or taps a word: laser fires from the turret tip directly to the clicked word coordinates.
     - **On Correct Hit**: Word explodes into neon sparks, chime sounds, combo meter ticks up (+100 × combo), and collocation banner displays (e.g., `"PAY ATTENTION!"`).
     - **On Incorrect Hit**: Laser ricochets with a dull thud, combo breaks, life is lost, and a quick educational toast appears explaining the correct collocation (e.g., *"❌ 'Pay homework' → You 'do homework'"*).
     - Once all target collocations for a base word are cleared, the round completes with bonus points, and the turret reloads a new base word.
  3. **Level Progression**: Every wave increases target speed, spawn density, and distractor difficulty.
  4. **Game Over / Victory Debrief**: Complete review of words encountered, collocations mastered, mistake explanations, final score, and name entry for the arcade leaderboard.
  5. **Teacher Dashboard & Deck Editor**:
     - Switch between preloaded decks (A2-B1 Fundamentals, B2 Everyday Collocations, C1 Advanced & Academic, Business English).
     - Add, edit, or delete custom base words and their collocations + distractors + explanation hints.
     - One-click CSV Export and CSV Import for easy lesson distribution across classes.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Retro Arcade Space Defender (clean vector sci-fi, deep space grid, glowing laser beams, arcade typography).
  - *Color Palette & Mood*:
    - Background Canvas: Deep space navy/slate (`#090D16` and `#0F172A`) with subtle distant star points.
    - Turret & Player HUD: Cyan neon (`#06B6D4` / `#22D3EE`).
    - Valid Collocation Flash: Bright emerald green (`#10B981` / `#34D399`).
    - Distractor / Error Warning: Crimson coral (`#EF4444` / `#F87171`).
    - Score & Combo Accent: Retro arcade amber (`#F59E0B`).
  - *Typography*:
    - Display / HUD Headings: Bold geometric sans (`Outfit` / `Plus Jakarta Sans`) with arcade styling.
    - Target Words: Large, high-contrast, easily clickable sans-serif cards with tabular numerals.
  - *Audio Feedback (Web Audio API Synthesizer)*:
    - Pew laser shot sound on click.
    - Satisfying crisp blast chord on correct collocation.
    - Low shield deflection buzz on mistake.
    - Ascending arpeggio on round clear / level up.
    - Toggleable mute button in the top bar.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: HTML5 Canvas + DOM Hybrid vs Pure Canvas**:
  - *Chosen Approach*: Hybrid architecture where a responsive HTML5 Canvas renders background stars, turret laser beams, and explosion particle bursts, while interactive words are rendered as smoothly positioned DOM elements.
  - *Why*: Ensures crisp text rendering, effortless accessibility, seamless click/touch hit detection, and clean CSS hover/transition states without complex canvas font rasterization issues.
- **Decision 2: Instant Educational Explanations for Mistakes**:
  - *Chosen Approach*: Every distractor word includes a pre-authored explanation or hint (e.g. for base word `MAKE` and distractor `HOMEWORK`: *"We DO homework, we don't MAKE homework"*).
  - *Why*: Immediate feedback turns a penalty into an instant learning moment, which was a specific requirement of the user brief.
- **Decision 3: Zero External Audio Asset Dependencies**:
  - *Chosen Approach*: Procedural sound synthesizer using browser native `AudioContext` (sine/square oscillators, white noise bursts for explosions).
  - *Why*: Never fails due to missing MP3 files, network blocking, or CDN issues; completely hermetic and instant.
- **Decision 4: Teacher Customization Persistence & Portability**:
  - *Chosen Approach*: Persist custom decks in `localStorage` with full JSON & CSV import/export capabilities.
  - *Why*: Works completely client-side without requiring accounts or backend servers, allowing teachers to draft decks in Excel/Google Sheets and upload in seconds.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Bar & Global HUD                            │
│   Brand Wordmark  │  Score · Multiplier · Lives · Level  │ Audio/Menu  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐           ┌──────────────────────────────────┐
│      Active Arcade Battle       │           │   Teacher Customization Suite    │
│  ┌───────────────────────────┐  │           │  - Deck Selector (A2-C1)         │
│  │   Multi-Direction Words   │  │           │  - Base Word & Collocation Table │
│  │   Top, Left, Right Paths  │  │           │  - Distractors & Tip Editor      │
│  ├───────────────────────────┤  │           │  - CSV Export & Import Modal     │
│  │ Laser Beam Canvas Layer   │  │           │  - Quick Classroom Test Play     │
│  ├───────────────────────────┤  │           └──────────────────────────────────┘
│  │ Base Turret Station       │  │
│  │ Loaded: "MAKE" (3 left)   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

#### Data Entities

```typescript
interface CollocationItem {
  id: string;
  word: string;
  isCorrect: boolean;
  explanation?: string; // e.g. "We say 'do business', not 'make business'"
}

interface CollocationRound {
  id: string;
  baseWord: string;
  category: string; // e.g. "Verb + Noun", "Business", "Academic"
  level: 'A2' | 'B1' | 'B2' | 'C1';
  targetCollocations: string[]; // e.g. ["a decision", "a difference", "sense", "progress"]
  distractors: Array<{ word: string; tip: string }>;
  exampleSentence?: string; // e.g. "She made a decision to study abroad."
}

interface CollocationDeck {
  id: string;
  title: string;
  description: string;
  isDefault: boolean;
  rounds: CollocationRound[];
}

interface ActiveFlyingWord {
  id: string;
  text: string;
  isCorrect: boolean;
  tip?: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  vx: number; // horizontal velocity
  vy: number; // vertical velocity
  rotation: number;
  origin: 'TOP' | 'LEFT' | 'RIGHT';
  state: 'FLYING' | 'HIT' | 'MISSED';
}
```

#### Preloaded Curriculum Content
1. **A2-B1 Everyday Essentials**:
   - `MAKE`: *a decision, a mistake, friends, money, progress, sense* (Distractors: *homework, a photo, sports, shower*)
   - `DO`: *homework, the dishes, business, exercise, your best, research* (Distractors: *a mistake, friends, a speech*)
   - `TAKE`: *a photo, a seat, time, a break, care, notes* (Distractors: *a phone call, homework, breakfast*)
   - `HAVE`: *a party, lunch, fun, an argument, a dream, a good time* (Distractors: *the dishes, sports*)
2. **B2 Fluency Booster**:
   - `PAY`: *attention, a compliment, respect, cash, a visit* (Distractors: *a secret, an excuse*)
   - `CATCH`: *a cold, fire, a bus, someone's eye, your breath* (Distractors: *an exam, an idea*)
   - `KEEP`: *a secret, a promise, in touch, calm, a diary* (Distractors: *a joke, attention*)
   - `HEAVY`: *rain, traffic, smoker, burden, defeat* (Distractors: *speed, sound, smell*)
3. **C1 Advanced & Academic**:
   - `COMMIT`: *a crime, fraud, resources, suicide, to memory* (Distractors: *a mistake [say make], business*)
   - `DRAW`: *a conclusion, attention, a distinction, criticism, a breath* (Distractors: *an excuse, a promise*)
   - `CONDUCT`: *an investigation, research, an experiment, a survey, an interview* (Distractors: *homework, notes*)
   - `RADICAL`: *change, departure, reform, overhaul, idea* (Distractors: *rain, traffic*)

---

### 5. Verification Plan

- Run automated compilation via `compile_applet` to verify TypeScript types, component interfaces, and clean Tailwind CSS integration.
- Test interactive gameplay loops:
  - Verify laser shooting accurately points from bottom turret toward clicked target words.
  - Verify multi-directional entry trajectories (smooth entry from left, right, top).
  - Verify combo counter incrementing on correct hits and resetting on mistakes.
  - Verify educational feedback displays the exact corrective hint upon clicking a distractor.
  - Verify round completion and transitioning to the next base word.
  - Test Teacher Editor: adding custom base words, saving to localStorage, exporting CSV, and importing CSV.
