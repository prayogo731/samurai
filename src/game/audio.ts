// Procedural Web Audio API sound synthesizer and 8-bit Chiptune Music Engine for Samurai Duel

// Note frequencies in Hz
const NOTES: Record<string, number> = {
  '---': 0,
  'A1': 55.00, 'B1': 61.74, 'C2': 65.41, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00,
  'A2': 110.00, 'B2': 123.47, 'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00,
  'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
  'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99,
  'A5': 880.00, 'B5': 987.77, 'C6': 1046.50
};

// 32-step Chiptune sequences
// Menu Theme: "Way of the Ronin" (Mystic Japanese Pentatonic)
const MENU_LEAD = [
  'A4', '---', 'C5', '---', 'B4', '---', 'A4', '---',
  'F4', '---', 'E4', '---', 'F4', '---', 'A4', '---',
  'C5', '---', 'E5', '---', 'F5', '---', 'E5', '---',
  'C5', '---', 'B4', '---', 'A4', '---', '---', '---',
];

const MENU_BASS = [
  'A2', '---', 'E3', '---', 'A2', '---', 'E3', '---',
  'F2', '---', 'C3', '---', 'E2', '---', 'B2', '---',
  'A2', '---', 'E3', '---', 'D2', '---', 'A2', '---',
  'F2', '---', 'G2', '---', 'A2', '---', 'E2', '---',
];

// Battle Theme: "Duel of Honor" (Fast, Adrenaline-pumping Bushido Clash)
const BATTLE_LEAD = [
  'D4', 'D4', 'F4', '---', 'G4', '---', 'A4', '---',
  'C5', '---', 'A4', '---', 'F4', 'G4', 'A4', '---',
  'D5', '---', 'C5', '---', 'A4', '---', 'G4', '---',
  'F4', '---', 'E4', '---', 'D4', '---', 'D4', '---',
  'A4', '---', 'C5', '---', 'D5', '---', 'F5', '---',
  'E5', '---', 'D5', '---', 'C5', '---', 'A4', '---',
  'G4', 'A4', 'C5', '---', 'A4', 'G4', 'F4', '---',
  'D4', '---', 'D4', '---', 'D4', '---', '---', '---',
];

const BATTLE_BASS = [
  'D2', 'D2', 'D3', 'D2', 'D2', 'D3', 'D2', 'D3',
  'F2', 'F2', 'F3', 'F2', 'G2', 'G2', 'G3', 'G2',
  'A2', 'A2', 'A3', 'A2', 'G2', 'G2', 'G3', 'G2',
  'F2', 'F2', 'F3', 'F2', 'D2', 'D2', 'A2', '---',
  'D2', 'D2', 'D3', 'D2', 'D2', 'D3', 'D2', 'D3',
  'A2', 'A2', 'A3', 'A2', 'C3', 'C3', 'C4', 'C3',
  'G2', 'G2', 'G3', 'G2', 'F2', 'F2', 'F3', 'F2',
  'D2', 'D2', 'D3', 'D2', 'D2', 'D2', 'D2', '---',
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private sfxVolume: number = 0.55;
  private musicVolume: number = 0.22;

  // Music sequencer state
  private currentTrack: 'none' | 'menu' | 'battle' = 'none';
  private musicTimer: number | null = null;
  private musicStep: number = 0;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- AUDIO SETTINGS ---
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    } else {
      if (this.currentTrack !== 'none') {
        this.playMusic(this.currentTrack);
      }
    }
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.stopMusic();
    } else if (this.currentTrack !== 'none') {
      this.playMusic(this.currentTrack);
    }
    return !this.isMusicMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  public setVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  // --- 8-BIT CHIPTUNE MUSIC ENGINE ---
  public playMusic(track: 'menu' | 'battle') {
    this.currentTrack = track;
    if (this.isMuted || this.isMusicMuted) return;

    this.initCtx();
    if (!this.ctx) return;

    // Clear previous timer
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    this.musicStep = 0;
    const bpm = track === 'battle' ? 140 : 106;
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th note in ms

    this.musicTimer = window.setInterval(() => {
      this.tickMusicStep(track);
    }, stepDurationMs);
  }

  public stopMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private tickMusicStep(track: 'menu' | 'battle') {
    if (!this.ctx || this.isMuted || this.isMusicMuted) return;

    const t = this.ctx.currentTime;
    const isBattle = track === 'battle';
    const leadArr = isBattle ? BATTLE_LEAD : MENU_LEAD;
    const bassArr = isBattle ? BATTLE_BASS : MENU_BASS;

    const step = this.musicStep % leadArr.length;
    const leadNote = leadArr[step];
    const bassNote = bassArr[step];

    // 1. Lead Melody (Pulse/Square wave with vintage duty cycle)
    if (leadNote && leadNote !== '---' && NOTES[leadNote]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isBattle ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(NOTES[leadNote], t);

      // Subtle vibrato
      if (!isBattle) {
        osc.frequency.linearRampToValueAtTime(NOTES[leadNote] * 1.015, t + 0.12);
      }

      const noteLen = isBattle ? 0.11 : 0.18;
      gain.gain.setValueAtTime(this.musicVolume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + noteLen + 0.02);
    }

    // 2. Bassline (Deep triangle or saw wave)
    if (bassNote && bassNote !== '---' && NOTES[bassNote]) {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = isBattle ? 'sawtooth' : 'triangle';
      bOsc.frequency.setValueAtTime(NOTES[bassNote], t);

      const bLen = isBattle ? 0.09 : 0.22;
      bGain.gain.setValueAtTime(this.musicVolume * (isBattle ? 0.35 : 0.45), t);
      bGain.gain.exponentialRampToValueAtTime(0.001, t + bLen);

      bOsc.connect(bGain);
      bGain.connect(this.ctx.destination);

      bOsc.start(t);
      bOsc.stop(t + bLen + 0.02);
    }

    // 3. 8-Bit Drum Beats (Noise burst snare & kick)
    // Snare on 4, 12, 20, 28
    if (step % 8 === 4) {
      this.playChiptuneSnare(t);
    } else if (step % 8 === 0) {
      // Kick on 0, 8, 16, 24
      this.playChiptuneKick(t);
    } else if (isBattle && step % 2 === 1) {
      // Hi-hat ticking
      this.playChiptuneHiHat(t);
    }

    this.musicStep++;
  }

  private playChiptuneKick(t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(this.musicVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  private playChiptuneSnare(t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);

    gain.gain.setValueAtTime(this.musicVolume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  private playChiptuneHiHat(t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.025);

    gain.gain.setValueAtTime(this.musicVolume * 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // --- SOUND EFFECTS (SFX) ---
  public playSlashLight() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(3, t);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playSlashHeavy() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const mainGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);

    mainGain.gain.setValueAtTime(this.sfxVolume * 0.6, t);
    mainGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playParry() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2200, t);
    osc1.frequency.exponentialRampToValueAtTime(1600, t + 0.35);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3300, t);
    osc2.frequency.exponentialRampToValueAtTime(2400, t + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.4);
    osc2.stop(t + 0.4);
  }

  public playBlock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);

    gain.gain.setValueAtTime(this.sfxVolume * 0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playSkill() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, t);
    osc1.frequency.linearRampToValueAtTime(800, t + 0.25);
    osc1.frequency.exponentialRampToValueAtTime(90, t + 0.6);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(300, t);
    osc2.frequency.linearRampToValueAtTime(1200, t + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(120, t + 0.6);

    gain.gain.setValueAtTime(this.sfxVolume * 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.68);
    osc2.stop(t + 0.68);
  }

  public playGong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.8);

    gain.gain.setValueAtTime(this.sfxVolume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  public playUiClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }
}

export const sounds = new SoundEngine();
