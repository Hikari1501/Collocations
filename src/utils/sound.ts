// Procedural audio & BGM synthesizer using Web Audio API
// 100% self-contained, zero external audio assets required.

export type BGMTrack = 'title' | 'gameplay' | 'boss';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicEnabled: boolean = true;
  private currentTrack: BGMTrack | null = null;
  private bgmIntervalId: number | null = null;
  private bgmGain: GainNode | null = null;
  private noteStep: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('collocation_blaster_muted');
        if (savedMute !== null) {
          this.muted = savedMute === 'true';
        }
        const savedMusic = localStorage.getItem('collocation_blaster_music');
        if (savedMusic !== null) {
          this.musicEnabled = savedMusic === 'true';
        }
      } catch {
        // Storage restricted in sandbox/iframe
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch {
        // AudioContext restricted
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume();
      } catch {
        // Ignore
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public isMusicOn(): boolean {
    return this.musicEnabled && !this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('collocation_blaster_muted', String(this.muted));
      } catch {
        // Ignore
      }
    }

    if (this.muted) {
      this.stopMusic();
    } else if (this.musicEnabled && this.currentTrack) {
      this.startMusic(this.currentTrack);
    }
    return this.muted;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('collocation_blaster_music', String(this.musicEnabled));
      } catch {
        // Ignore
      }
    }

    if (!this.musicEnabled || this.muted) {
      this.stopMusic();
    } else if (this.currentTrack) {
      this.startMusic(this.currentTrack);
    }
    return this.musicEnabled;
  }

  // --- Background Music (BGM) Engine ---
  public startMusic(track: BGMTrack): void {
    this.currentTrack = track;
    if (this.muted || !this.musicEnabled) return;

    this.initContext();
    if (!this.ctx) return;

    // Stop any existing loop
    this.stopMusic(false);

    // Create main BGM gain node
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // gentle background level
    this.bgmGain.connect(this.ctx.destination);

    // Track melody and bassline patterns (frequencies in Hz)
    // Gameplay: A-minor / D-minor synth driving arpeggio (125 BPM -> 120ms step)
    // Title: Dreamy C-maj7 / F-maj7 ambient pulse (180ms step)
    // Boss: Fast aggressive E-phrygian driving attack (90ms step)
    const patterns: Record<BGMTrack, { notes: number[]; bass: number[]; stepTime: number }> = {
      title: {
        notes: [261.63, 329.63, 392.0, 493.88, 392.0, 329.63, 220.0, 329.63, 392.0, 440.0, 392.0, 329.63],
        bass: [130.81, 130.81, 110.0, 110.0],
        stepTime: 220,
      },
      gameplay: {
        notes: [220.0, 261.63, 329.63, 440.0, 392.0, 329.63, 261.63, 293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 293.66],
        bass: [110.0, 110.0, 146.83, 146.83, 110.0, 110.0, 164.81, 164.81],
        stepTime: 140,
      },
      boss: {
        notes: [164.81, 174.61, 196.0, 220.0, 246.94, 220.0, 196.0, 174.61, 164.81, 329.63, 349.23, 392.0],
        bass: [82.41, 82.41, 87.31, 87.31, 82.41, 82.41, 98.0, 98.0],
        stepTime: 105,
      },
    };

    const pattern = patterns[track];
    this.noteStep = 0;

    const tick = () => {
      if (!this.ctx || !this.bgmGain || this.muted || !this.musicEnabled) return;

      const now = this.ctx.currentTime;
      const noteFreq = pattern.notes[this.noteStep % pattern.notes.length];
      const bassFreq = pattern.bass[Math.floor(this.noteStep / 2) % pattern.bass.length];

      // Play lead arpeggio note (soft triangle/sine)
      try {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();

        leadOsc.type = track === 'boss' ? 'sawtooth' : 'triangle';
        leadOsc.frequency.setValueAtTime(noteFreq, now);

        leadGain.gain.setValueAtTime(track === 'boss' ? 0.05 : 0.08, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + pattern.stepTime / 1000);

        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);

        leadOsc.start(now);
        leadOsc.stop(now + pattern.stepTime / 1000);

        // Every 2 steps play pulsing bass
        if (this.noteStep % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();

          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.12, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + (pattern.stepTime * 2) / 1000);

          bassOsc.connect(bassGain);
          bassGain.connect(this.bgmGain);

          bassOsc.start(now);
          bassOsc.stop(now + (pattern.stepTime * 2) / 1000);
        }
      } catch {
        // Fallback
      }

      this.noteStep++;
    };

    // Run interval
    this.bgmIntervalId = window.setInterval(tick, pattern.stepTime);
    tick();
  }

  public stopMusic(clearTrack: boolean = true): void {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch {
        // Ignore
      }
      this.bgmGain = null;
    }
    if (clearTrack) {
      this.currentTrack = null;
    }
  }

  // --- Sound Effects ---

  // Laser shot sound (pew!)
  public playLaser(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio fallback silent
    }
  }

  // Correct collocation hit (cheerful arcade chime)
  public playHitCorrect(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Incorrect choice / shield ricochet buzz
  public playHitWrong(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(85, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fallback silent
    }
  }

  // Boss took heavy damage
  public playBossHit(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Deep rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback silent
    }
  }

  // Boss defeated fanfare
  public playBossDefeated(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Round cleared fanfare
  public playWaveClear(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99]; // C5, E5, G5

      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Game over sound
  public playGameOver(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [330, 311.13, 293.66, 261.63]; // E4, Eb4, D4, C4

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.15;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // Audio fallback silent
    }
  }
}

export const sound = new SoundSystem();
