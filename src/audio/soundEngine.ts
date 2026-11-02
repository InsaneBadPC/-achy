/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Procedural sound engine (Web Audio). All effects are synthesized at runtime,
 * routed through a master bus with a compressor and a short convolution reverb
 * so they sound fuller and more "produced" than raw oscillators.
 */

import { voiceEngine } from './voiceEngine';
import { PieceType } from '../types/game';

const STORAGE_KEY = 'wacky-chess-audio';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMuted = false;
  private musicTimer: number | null = null;
  private isMusicPlaying = false;
  private musicStep = 0;
  private nextNoteTime = 0;

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        this.isMuted = !!p.muted;
      }
    } catch {
      /* ignore */
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted: this.isMuted }));
    } catch {
      /* ignore */
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.2;

      this.master = ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(compressor);
      compressor.connect(ctx.destination);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 1;
      this.sfxBus.connect(this.master);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.35;
      this.musicBus.connect(this.master);

      // Small room reverb from generated impulse response
      const convolver = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 1.2);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
        }
      }
      convolver.buffer = ir;
      this.reverbSend = ctx.createGain();
      this.reverbSend.gain.value = 0.18;
      this.reverbSend.connect(convolver);
      convolver.connect(this.master);

      // White noise buffer for whooshes / impacts
      const nLen = ctx.sampleRate * 1;
      this.noiseBuffer = ctx.createBuffer(1, nLen, ctx.sampleRate);
      const nd = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  /** Returns a ready context or null when muted / unavailable */
  private ready(): AudioContext | null {
    if (this.isMuted) return null;
    return this.initCtx();
  }

  private out(node: AudioNode, reverb = true) {
    node.connect(this.sfxBus!);
    if (reverb && this.reverbSend) node.connect(this.reverbSend);
  }

  private tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    start: number,
    dur: number,
    vol: number,
    reverb = true
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, start);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + Math.min(0.015, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    this.out(g, reverb);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noise(
    start: number,
    dur: number,
    vol: number,
    filterType: BiquadFilterType,
    f0: number,
    f1: number,
    q = 1
  ) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(f0, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, f1), start + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(g);
    this.out(g);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  // Mobile Android Haptics Vibration
  public vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* ignore */
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
      voiceEngine.stop();
    }
    this.persist();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /** Unlock audio on first user gesture (required by mobile browsers) */
  public unlock() {
    if (!this.isMuted) this.initCtx();
  }

  public playFlyIn() {
    this.vibrate([30, 50, 80]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noise(t, 1.1, 0.25, 'bandpass', 300, 2500, 0.8);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone('sine', f, f, t + 0.7 + i * 0.07, 0.6, 0.12));
  }

  /** Real spoken character voice (Czech TTS) + small vocal accent */
  public speakCharacterVoice(text: string, characterType: string, force = true) {
    if (this.isMuted) return;
    voiceEngine.speak(text, characterType as PieceType, force);
  }

  public playHammerSmash() {
    this.vibrate([80, 40, 140]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noise(t, 0.12, 0.35, 'bandpass', 2000, 600, 0.7); // whoosh down
    this.tone('sine', 140, 38, t + 0.1, 0.55, 0.9, false); // sub thump
    this.tone('square', 220, 60, t + 0.1, 0.18, 0.25);
    this.noise(t + 0.1, 0.5, 0.5, 'lowpass', 3000, 200, 0.5); // debris
    // Cartoon "doiiing" afterwards
    this.tone('triangle', 900, 1400, t + 0.45, 0.25, 0.08);
  }

  public playSpeedBoost() {
    this.vibrate([40, 40, 80]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone('sawtooth', 200, 1600, t, 0.35, 0.12);
    this.noise(t, 0.4, 0.2, 'highpass', 800, 6000, 0.7);
    [880, 1108, 1318, 1760].forEach((f, i) => this.tone('sine', f, f, t + 0.25 + i * 0.05, 0.2, 0.1));
  }

  public playRocket() {
    this.vibrate([20, 20, 20, 20, 60]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noise(t, 0.7, 0.4, 'bandpass', 400, 1800, 1.2);
    this.tone('sawtooth', 90, 300, t, 0.6, 0.12);
  }

  public playMirror() {
    this.vibrate([30, 30, 90]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [1318, 1760, 2093, 2637, 3136].forEach((f, i) => this.tone('sine', f, f * 0.98, t + i * 0.035, 0.5, 0.09));
    this.noise(t, 0.3, 0.15, 'highpass', 5000, 9000, 1);
    this.tone('square', 300, 80, t + 0.05, 0.3, 0.15);
  }

  public playStun() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Twittering birds / stars
    for (let i = 0; i < 6; i++) this.tone('sine', 2200 + (i % 2) * 500, 2600, t + i * 0.08, 0.07, 0.06);
  }

  public playItemPickup() {
    this.vibrate([20, 30, 60]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [659.25, 830.61, 987.77, 1318.5].forEach((f, i) => this.tone('square', f, f, t + i * 0.06, 0.16, 0.07));
    this.tone('sine', 1975, 1975, t + 0.26, 0.4, 0.08);
  }

  /** Short vocal "grunt" used as an accent – not used for speech */
  public playCharacterVoice(characterType: string) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const base: Record<string, number> = { pawn: 620, king: 170, queen: 380, knight: 480, bishop: 300, rook: 110 };
    const f = base[characterType] || 400;
    const syll = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < syll; i++) {
      const shift = (Math.random() - 0.5) * f * 0.3;
      this.tone(characterType === 'rook' ? 'sawtooth' : 'triangle', f + shift, f + shift * 1.6, t + i * 0.085, 0.075, 0.08);
    }
  }

  public playStep() {
    this.vibrate(15);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noise(t, 0.18, 0.12, 'bandpass', 600, 2400, 1); // whoosh up
  }

  public playLand() {
    this.vibrate(25);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone('sine', 180, 70, t, 0.16, 0.35, false);
    this.noise(t, 0.08, 0.12, 'lowpass', 1500, 300, 0.7);
  }

  public playCapture() {
    this.vibrate([40, 30, 90]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone('sine', 170, 35, t, 0.35, 0.8, false);
    this.noise(t, 0.12, 0.45, 'bandpass', 3500, 900, 0.8); // slap
    this.tone('square', 900, 150, t, 0.1, 0.18);
    // Comic "fly away" whistle
    this.tone('sine', 600, 2400, t + 0.12, 0.6, 0.07);
  }

  public playBanana() {
    this.vibrate([30, 40, 30, 40, 90]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone('sine', 800, 880, t, 0.08, 0.25);
    this.tone('sine', 880, 140, t + 0.08, 0.45, 0.25);
  }

  public playSadTrombone() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [233.08, 220.0, 207.65, 196.0];
    let off = 0.15;
    notes.forEach((f, i) => {
      const d = i === 3 ? 0.7 : 0.26;
      const osc = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + off);
      if (i === 3) {
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = 6;
        lg.gain.value = 5;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        lfo.start(t + off);
        lfo.stop(t + off + d);
      }
      filt.type = 'lowpass';
      filt.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.14, t + off + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + d);
      osc.connect(filt);
      filt.connect(g);
      this.out(g);
      osc.start(t + off);
      osc.stop(t + off + d + 0.02);
      off += d * 0.92;
    });
  }

  public playSpring() {
    this.vibrate([60, 40, 80]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.25);
    lfo.frequency.value = 24;
    lg.gain.setValueAtTime(60, t);
    lg.gain.exponentialRampToValueAtTime(3, t + 0.5);
    lfo.connect(lg);
    lg.connect(osc.frequency);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(g);
    this.out(g);
    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.56);
    osc.stop(t + 0.56);
  }

  public playTeleport() {
    this.vibrate([40, 30, 40, 30, 40]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [440, 554, 659, 880, 1108, 1318, 1760].forEach((f, i) => this.tone('triangle', f, f * 1.02, t + i * 0.045, 0.18, 0.1));
    this.noise(t, 0.5, 0.15, 'bandpass', 4000, 800, 3);
  }

  public playFreeze() {
    this.vibrate([80, 50, 80]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noise(t, 0.35, 0.3, 'highpass', 3000, 7000, 2);
    for (let i = 0; i < 5; i++) this.tone('sine', 1800 + i * 420, 1700 + i * 400, t + i * 0.04, 0.4, 0.06);
    this.tone('square', 200, 90, t + 0.02, 0.08, 0.15); // crack
  }

  public playShield() {
    this.vibrate([40, 60]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone('sine', 320, 700, t, 0.09, 0.3);
    this.tone('sine', 700, 420, t + 0.09, 0.22, 0.25);
    this.tone('triangle', 1400, 1400, t, 0.3, 0.05);
  }

  public playCheck() {
    this.vibrate([90, 60, 120]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [293.66, 349.23, 440].forEach((f) => this.tone('sawtooth', f, f, t, 0.5, 0.1));
    [293.66, 349.23, 466.16].forEach((f) => this.tone('sawtooth', f, f, t + 0.22, 0.5, 0.1));
  }

  public playVictory() {
    this.vibrate([100, 50, 100, 50, 200]);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const seq = [
      { f: 523.25, dt: 0, d: 0.14 },
      { f: 659.25, dt: 0.14, d: 0.14 },
      { f: 783.99, dt: 0.28, d: 0.14 },
      { f: 1046.5, dt: 0.42, d: 0.7 },
      { f: 783.99, dt: 0.42, d: 0.7 },
      { f: 659.25, dt: 0.42, d: 0.7 },
    ];
    seq.forEach(({ f, dt, d }) => {
      this.tone('square', f, f, t + dt, d, 0.07);
      this.tone('triangle', f, f, t + dt, d, 0.12);
    });
  }

  public playDefeat() {
    this.playSadTrombone();
  }

  public playSelect() {
    this.vibrate(10);
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone('sine', 700, 1050, t, 0.06, 0.15, false);
    this.tone('triangle', 1400, 1400, t + 0.03, 0.05, 0.04, false);
  }

  // --- Background music: light chiptune-jazz loop with bass, chords and melody ---
  public toggleMusic(enable?: boolean) {
    const next = enable !== undefined ? enable : !this.isMusicPlaying;
    if (next) this.startMusic();
    else this.stopMusic();
    return this.isMusicPlaying;
  }

  public isMusicOn(): boolean {
    return this.isMusicPlaying;
  }

  private startMusic() {
    const ctx = this.ready();
    if (!ctx) return;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.isMusicPlaying = true;
    this.musicStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.1;

    const bpm = 112;
    const sixteenth = 60 / bpm / 4;
    // Chord roots per bar (C – Am – F – G)
    const bass = [130.81, 110.0, 87.31, 98.0];
    const chords = [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
    ];
    const melody = [
      659.25, 0, 783.99, 0, 880, 783.99, 659.25, 0, 587.33, 0, 523.25, 0, 587.33, 659.25, 0, 0,
      523.25, 0, 659.25, 0, 783.99, 0, 659.25, 587.33, 523.25, 0, 440, 0, 523.25, 0, 0, 0,
      698.46, 0, 659.25, 0, 587.33, 0, 523.25, 0, 587.33, 0, 659.25, 698.46, 783.99, 0, 0, 0,
      783.99, 0, 698.46, 659.25, 587.33, 0, 493.88, 0, 587.33, 0, 783.99, 0, 0, 0, 0, 0,
    ];

    const schedule = () => {
      if (!this.ctx || !this.isMusicPlaying || this.isMuted) return;
      while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
        const step = this.musicStep % 64;
        const bar = Math.floor(step / 16);
        const t = this.nextNoteTime;
        const c = this.ctx;
        const play = (type: OscillatorType, f: number, d: number, v: number) => {
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = type;
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(v, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o.connect(g);
          g.connect(this.musicBus!);
          o.start(t);
          o.stop(t + d + 0.02);
        };
        // Bass on beats (with octave bounce)
        if (step % 4 === 0) play('triangle', bass[bar] * (step % 8 === 4 ? 2 : 1), sixteenth * 3, 0.22);
        // Off-beat chord stabs
        if (step % 4 === 2) chords[bar].forEach((f) => play('square', f, sixteenth * 1.2, 0.025));
        // Melody
        const m = melody[step];
        if (m) play('triangle', m, sixteenth * 1.8, 0.07);
        // Hi-hat
        if (step % 2 === 1 && this.noiseBuffer) {
          const s = c.createBufferSource();
          s.buffer = this.noiseBuffer;
          const hp = c.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 7000;
          const g = c.createGain();
          g.gain.setValueAtTime(0.03, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
          s.connect(hp);
          hp.connect(g);
          g.connect(this.musicBus!);
          s.start(t);
          s.stop(t + 0.05);
        }
        this.nextNoteTime += sixteenth;
        this.musicStep++;
      }
    };
    schedule();
    this.musicTimer = window.setInterval(schedule, 50);
  }

  private stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
