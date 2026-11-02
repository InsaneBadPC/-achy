/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Mobile Android Haptics Vibration
  public vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe ignore if unsupported or blocked
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.musicInterval) {
      this.stopMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Cinematic fly-in swoosh with harmonic chime
  public playFlyIn() {
    this.vibrate([30, 50, 80]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Wind whoosh (filtered noise / pitch sweep)
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.8);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.2);

    // 2. Harmonic chime at the landing
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const chimeOsc = this.ctx!.createOscillator();
      const chimeGain = this.ctx!.createGain();
      const start = t + 0.6 + i * 0.08;

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, start);

      chimeGain.gain.setValueAtTime(0.18, start);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx!.destination);

      chimeOsc.start(start);
      chimeOsc.stop(start + 0.5);
    });
  }

  // Real Spoken Voice Synthesis using Web Speech API with Character Personality
  public speakCharacterVoice(text: string, characterType: string) {
    if (this.isMuted) return;

    // 1. Play procedural comedic chirp/squeak as accent
    this.playCharacterVoice(characterType);

    // 2. Real vocal synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Stop overlapping speech
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find Czech or default voice
        const voices = window.speechSynthesis.getVoices();
        const csVoice = voices.find((v) => v.lang.startsWith('cs') || v.lang.startsWith('sk'));
        if (csVoice) {
          utterance.voice = csVoice;
          utterance.lang = csVoice.lang;
        } else {
          utterance.lang = 'cs-CZ';
        }

        // Distinct character vocal profiles
        switch (characterType) {
          case 'pawn':
            utterance.pitch = 1.9; // Squeaky cartoon minion
            utterance.rate = 1.35;
            break;
          case 'king':
            utterance.pitch = 0.55; // Pompous deep booming monarch
            utterance.rate = 0.85;
            break;
          case 'queen':
            utterance.pitch = 1.3; // Sassy, commanding diva
            utterance.rate = 1.1;
            break;
          case 'knight':
            utterance.pitch = 1.45; // Energetic bouncy hero
            utterance.rate = 1.25;
            break;
          case 'bishop':
            utterance.pitch = 0.8; // Mystical, cunning sage
            utterance.rate = 0.95;
            break;
          case 'rook':
            utterance.pitch = 0.45; // Deep gravelly rock golem
            utterance.rate = 0.75;
            break;
          default:
            utterance.pitch = 1.2;
            utterance.rate = 1.1;
        }

        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }

  // Giant cartoon hammer smash sound
  public playHammerSmash() {
    this.vibrate([80, 100, 60, 40]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Sonic speed boost whoosh sound
  public playSpeedBoost() {
    this.vibrate([40, 40, 80]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Comic Character Gibberish Voice Squeak (Simlish / Minion style chirp)
  public playCharacterVoice(characterType: string) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    let baseFreq = 400;

    switch (characterType) {
      case 'pawn': baseFreq = 620; break;   // High squeaky minion
      case 'king': baseFreq = 180; break;   // Deep pompous monarch
      case 'queen': baseFreq = 380; break;  // Sassy diva
      case 'knight': baseFreq = 480; break; // Whinny bouncy steed
      case 'bishop': baseFreq = 310; break; // Mystical wizard
      case 'rook': baseFreq = 110; break;   // Low gravelly golem
    }

    const syllables = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < syllables; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.08;
      const pitchShift = (Math.random() - 0.5) * 80;

      osc.type = characterType === 'rook' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq + pitchShift, start);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + pitchShift * 1.5, start + 0.06);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.08);
    }
  }

  // Comedic step hop with light haptic tick
  public playStep() {
    this.vibrate(25);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Cartoon capture bonk ("BÁC! / WHAM!")
  public playCapture() {
    this.vibrate([40, 30, 80]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Bass thud
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(160, t);
    bass.frequency.exponentialRampToValueAtTime(30, t + 0.28);
    bassGain.gain.setValueAtTime(0.45, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    bass.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bass.start(t);
    bass.stop(t + 0.28);

    // Comic slap
    const slap = this.ctx.createOscillator();
    const slapGain = this.ctx.createGain();
    slap.type = 'square';
    slap.frequency.setValueAtTime(850, t);
    slap.frequency.exponentialRampToValueAtTime(150, t + 0.09);
    slapGain.gain.setValueAtTime(0.25, t);
    slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    slap.connect(slapGain);
    slapGain.connect(this.ctx.destination);
    slap.start(t);
    slap.stop(t + 0.11);
  }

  // Cartoon slide whistle (Banana slip "ŠUP!")
  public playBanana() {
    this.vibrate([30, 40, 30, 40, 90]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.48);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.setValueAtTime(0.35, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.48);
  }

  // Comic "Sad Trombone" (Wah-wah-wah-waaaah) for negative surprises
  public playSadTrombone() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 233.08, d: 0.25 }, // Bb3
      { f: 220.00, d: 0.25 }, // A3
      { f: 207.65, d: 0.25 }, // Ab3
      { f: 196.00, d: 0.65 }, // G3 (held with slide)
    ];

    let offset = 0;
    notes.forEach((n, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      const start = t + offset;
      osc.frequency.setValueAtTime(n.f, start);
      if (idx === 3) {
        // Slow comic pitch bend down
        osc.frequency.linearRampToValueAtTime(n.f - 20, start + n.d);
      }

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + n.d);
      offset += n.d * 0.9;
    });
  }

  // Spring launch "BOINGGG"
  public playSpring() {
    this.vibrate([60, 40, 80]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(560, t + 0.22);

    lfo.frequency.setValueAtTime(26, t);
    lfoGain.gain.setValueAtTime(55, t);
    lfoGain.gain.exponentialRampToValueAtTime(4, t + 0.45);

    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.48);
    osc.stop(t + 0.48);
  }

  // Teleport magical shimmer
  public playTeleport() {
    this.vibrate([40, 30, 40, 30, 40]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880, 1108, 1318];
    notes.forEach((freq, idx) => {
      const start = t + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  // Freeze ice crack
  public playFreeze() {
    this.vibrate([80, 50, 80]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(1300, t);
    osc1.frequency.exponentialRampToValueAtTime(2600, t + 0.22);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(850, t);
    osc2.frequency.exponentialRampToValueAtTime(380, t + 0.28);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.28);
    osc2.stop(t + 0.28);
  }

  // Bubble shield bounce
  public playShield() {
    this.vibrate([40, 60]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.07);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Check alert horn
  public playCheck() {
    this.vibrate([90, 60, 120]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [293.66, 329.63, 440];
    notes.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // Triumphant victory fanfare
  public playVictory() {
    this.vibrate([100, 50, 100, 50, 200]);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const seq = [
      { f: 261.63, dt: 0, d: 0.15 },
      { f: 329.63, dt: 0.15, d: 0.15 },
      { f: 392.0, dt: 0.3, d: 0.15 },
      { f: 523.25, dt: 0.45, d: 0.6 },
      { f: 659.25, dt: 0.45, d: 0.6 },
    ];

    seq.forEach(({ f, dt, d }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + dt);

      gain.gain.setValueAtTime(0.28, t + dt);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dt + d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + dt);
      osc.stop(t + dt + d);
    });
  }

  // UI select click
  public playSelect() {
    this.vibrate(15);
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.04);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Playful comic cartoon background groove
  public toggleMusic(enable?: boolean) {
    const next = enable !== undefined ? enable : !this.isMusicPlaying;
    if (next) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.isMusicPlaying;
  }

  public isMusicOn(): boolean {
    return this.isMusicPlaying;
  }

  private startMusic() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.musicInterval) clearInterval(this.musicInterval);

    this.isMusicPlaying = true;
    const melody = [
      261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 261.63, 196.0,
      220.0, 261.63, 293.66, 329.63, 293.66, 261.63, 220.0, 246.94,
    ];
    let noteIdx = 0;

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.isMusicPlaying) return;
      const t = this.ctx.currentTime;
      const freq = melody[noteIdx % melody.length];
      noteIdx++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    }, 280);
  }

  private stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
