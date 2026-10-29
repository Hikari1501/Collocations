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
  private masterGain: GainNode | null = null;
  private noteStep: number = 0;
  private unlocked: boolean = false;

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

      // Automatically register user gesture unlock listeners
      const onUserGesture = () => {
        this.unlockAudio();
      };
      window.addEventListener('click', onUserGesture, { passive: true });
      window.addEventListener('touchstart', onUserGesture, { passive: true });
      window.addEventListener('keydown', onUserGesture, { passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // Explicit user gesture unlock for browser autoplay policy
  public unlockAudio(): void {
    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.unlocked = true;
        if (this.currentTrack && this.musicEnabled && !this.muted && !this.bgmIntervalId) {
          this.startMusic(this.currentTrack);
        }
      }).catch(() => {});
    } else {
      this.unlocked = true;
      if (this.currentTrack && this.musicEnabled && !this.muted && !this.bgmIntervalId) {
        this.startMusic(this.currentTrack);
      }
    }
  }

  // Test audio chirp so user can verify sound is working
  public testAudio(): void {
    this.unlockAudio();
    this.playHitCorrect();
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
      this.stopMusic(false);
    } else {
      this.unlockAudio();
      if (this.musicEnabled && this.currentTrack) {
        this.startMusic(this.currentTrack);
      }
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
      this.stopMusic(false);
    } else {
      this.unlockAudio();
      if (this.currentTrack) {
        this.startMusic(this.currentTrack);
      }
    }
    return this.musicEnabled;
  }

  // --- Background Music (BGM) Engine ---
  public startMusic(track: BGMTrack): void {
    this.currentTrack = track;
    if (this.muted || !this.musicEnabled) return;

    const ctx = this.initContext();
    if (!ctx) return;

    this.stopMusic(false);

    try {
      this.bgmGain = ctx.createGain();
      // High-clarity, loud BGM master volume (0.72 - punchy and prominently audible)
      this.bgmGain.gain.setValueAtTime(0.72, ctx.currentTime);
      this.bgmGain.connect(this.masterGain || ctx.destination);
    } catch {
      return;
    }

    // Melodic synthwave arpeggios with driving basslines
    const patterns: Record<BGMTrack, { notes: number[]; bass: number[]; stepTime: number }> = {
      title: {
        notes: [261.63, 329.63, 392.0, 523.25, 493.88, 392.0, 329.63, 261.63, 220.0, 261.63, 329.63, 440.0],
        bass: [130.81, 130.81, 110.0, 110.0, 146.83, 146.83, 130.81, 130.81],
        stepTime: 180,
      },
      gameplay: {
        notes: [220.0, 261.63, 329.63, 440.0, 392.0, 329.63, 261.63, 293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 293.66],
        bass: [110.0, 110.0, 146.83, 146.83, 110.0, 110.0, 164.81, 164.81],
        stepTime: 135,
      },
      boss: {
        notes: [164.81, 174.61, 196.0, 220.0, 246.94, 220.0, 196.0, 174.61, 164.81, 329.63, 349.23, 392.0],
        bass: [82.41, 82.41, 87.31, 87.31, 82.41, 82.41, 98.0, 98.0],
        stepTime: 110,
      },
    };

    const pattern = patterns[track];
    this.noteStep = 0;

    const tick = () => {
      if (!this.ctx || !this.bgmGain || this.muted || !this.musicEnabled) return;
      if (this.ctx.state === 'suspended') return;

      const now = this.ctx.currentTime;
      const noteFreq = pattern.notes[this.noteStep % pattern.notes.length];
      const bassFreq = pattern.bass[Math.floor(this.noteStep / 2) % pattern.bass.length];

      try {
        // 1. Primary Lead Arpeggio Synth Note (Loud & Bright)
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();

        leadOsc.type = track === 'boss' ? 'sawtooth' : 'triangle';
        leadOsc.frequency.setValueAtTime(noteFreq, now);

        const leadVol = track === 'boss' ? 0.62 : 0.58;
        leadGain.gain.setValueAtTime(leadVol, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + (pattern.stepTime * 1.05) / 1000);

        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);

        leadOsc.start(now);
        leadOsc.stop(now + (pattern.stepTime * 1.05) / 1000);

        // Shimmer unison layer for lush stereo presence
        const shimmerOsc = this.ctx.createOscillator();
        const shimmerGain = this.ctx.createGain();
        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(noteFreq * 2, now); // Upper octave harmonic
        shimmerGain.gain.setValueAtTime(leadVol * 0.35, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + (pattern.stepTime * 0.9) / 1000);
        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(this.bgmGain);
        shimmerOsc.start(now);
        shimmerOsc.stop(now + (pattern.stepTime * 0.9) / 1000);

        // 2. Punchy Bass Note on alternate beats
        if (this.noteStep % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();

          bassOsc.type = track === 'boss' ? 'sawtooth' : 'triangle';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.68, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + (pattern.stepTime * 1.9) / 1000);

          bassOsc.connect(bassGain);
          bassGain.connect(this.bgmGain);

          bassOsc.start(now);
          bassOsc.stop(now + (pattern.stepTime * 1.9) / 1000);
        }

        // 3. Driving Retro Arcade Rhythm (Punchy Kick & Hi-hat)
        if (this.noteStep % 4 === 0) {
          // Kick Drum on downbeat
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.1);
          kickGain.gain.setValueAtTime(0.55, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          kickOsc.connect(kickGain);
          kickGain.connect(this.bgmGain);
          kickOsc.start(now);
          kickOsc.stop(now + 0.1);
        } else if (this.noteStep % 2 === 1) {
          // Hi-hat tick on offbeats
          const hatOsc = this.ctx.createOscillator();
          const hatGain = this.ctx.createGain();
          hatOsc.type = 'square';
          hatOsc.frequency.setValueAtTime(6000 + Math.random() * 2000, now);
          hatGain.gain.setValueAtTime(0.18, now);
          hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          hatOsc.connect(hatGain);
          hatGain.connect(this.bgmGain);
          hatOsc.start(now);
          hatOsc.stop(now + 0.04);
        }
      } catch {
        // Fallback
      }

      this.noteStep++;
    };

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
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio fallback silent
    }
  }

  // Correct collocation hit (cheerful arcade chime)
  public playHitCorrect(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      freqs.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Incorrect choice / shield ricochet buzz
  public playHitWrong(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.24);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Audio fallback silent
    }
  }

  // Boss took heavy damage
  public playBossHit(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback silent
    }
  }

  // Secondary explosion burst during boss death sequence
  public playBossExplosionCrunch(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;

      // Low frequency crunch noise
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const startPitch = 160 + Math.random() * 80;
      osc.frequency.setValueAtTime(startPitch, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio fallback silent
    }
  }

  // Giant Mega Detonation when boss fully shatters
  public playMegaBossDetonation(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;

      // 1. Deep Sub-bass Rumbling Shockwave
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(120, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.8);

      subGain.gain.setValueAtTime(0.75, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain || ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.8);

      // 2. High crunch crackle
      const crackleOsc = ctx.createOscillator();
      const crackleGain = ctx.createGain();
      crackleOsc.type = 'sawtooth';
      crackleOsc.frequency.setValueAtTime(320, now);
      crackleOsc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

      crackleGain.gain.setValueAtTime(0.65, now);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      crackleOsc.connect(crackleGain);
      crackleGain.connect(this.masterGain || ctx.destination);
      crackleOsc.start(now);
      crackleOsc.stop(now + 0.45);
    } catch {
      // Audio fallback silent
    }
  }

  // Boss defeated fanfare
  public playBossDefeated(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5];

      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.55, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.42);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.42);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Round cleared fanfare
  public playWaveClear(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5];

      chord.forEach((freq) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Game over sound
  public playGameOver(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const notes = [330, 311.13, 293.66, 261.63];

      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.15;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // Audio fallback silent
    }
  }
}

export const sound = new SoundSystem();
