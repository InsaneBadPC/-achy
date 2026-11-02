/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Character voice engine.
 * - On Android (Capacitor native) it uses the system Text-to-Speech engine through
 *   @capacitor-community/text-to-speech (Android WebView does NOT support window.speechSynthesis).
 * - In browsers it uses the Web Speech API and picks the best Czech voice available.
 * Every character gets its own vocal profile (pitch / rate) so they sound distinct.
 */

import { Capacitor } from '@capacitor/core';
import { TextToSpeech, QueueStrategy } from '@capacitor-community/text-to-speech';
import { PieceType } from '../types/game';

interface VoiceProfile {
  pitch: number;
  rate: number;
}

const PROFILES: Record<PieceType, VoiceProfile> = {
  pawn: { pitch: 1.75, rate: 1.25 },   // squeaky eager little soldier
  king: { pitch: 0.6, rate: 0.88 },    // pompous, deep, slow
  queen: { pitch: 1.35, rate: 1.05 },  // sassy diva
  knight: { pitch: 1.45, rate: 1.3 },  // hyperactive bouncy steed
  bishop: { pitch: 0.85, rate: 0.92 }, // mystical old wizard
  rook: { pitch: 0.45, rate: 0.8 },    // gravelly stone golem
};

const STORAGE_KEY = 'wacky-chess-voice';

class VoiceEngine {
  private enabled = true;
  private volume = 1;
  private isNative = Capacitor.isNativePlatform();
  private webVoice: SpeechSynthesisVoice | null = null;
  private nativeReady: Promise<boolean> | null = null;
  private lastSpokenAt = 0;

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.enabled = parsed.enabled !== false;
        this.volume = typeof parsed.volume === 'number' ? parsed.volume : 1;
      }
    } catch {
      /* ignore */
    }

    if (!this.isNative && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.pickWebVoice();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this.pickWebVoice());
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: this.enabled, volume: this.volume }));
    } catch {
      /* ignore */
    }
  }

  private pickWebVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    const czech = voices.filter((v) => v.lang.toLowerCase().startsWith('cs'));
    // Prefer high quality neural / online voices
    const preferred =
      czech.find((v) => /natural|neural|online/i.test(v.name)) ||
      czech.find((v) => /google/i.test(v.name)) ||
      czech[0] ||
      voices.find((v) => v.lang.toLowerCase().startsWith('sk')) ||
      null;
    this.webVoice = preferred;
  }

  private ensureNative(): Promise<boolean> {
    if (!this.nativeReady) {
      this.nativeReady = TextToSpeech.isLanguageSupported({ lang: 'cs-CZ' })
        .then((r) => r.supported)
        .catch(() => false);
    }
    return this.nativeReady;
  }

  public isEnabled() {
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
    this.persist();
  }

  public getVolume() {
    return this.volume;
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.persist();
  }

  public stop() {
    if (this.isNative) {
      TextToSpeech.stop().catch(() => undefined);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speak a line in the character's voice.
   * @param force interrupt anything currently being said
   */
  public async speak(text: string, character: PieceType, force = true) {
    if (!this.enabled || this.volume <= 0 || !text) return;
    const now = Date.now();
    // Avoid machine-gun chatter when lots of events fire at once
    if (!force && now - this.lastSpokenAt < 900) return;
    this.lastSpokenAt = now;

    const profile = PROFILES[character] || { pitch: 1, rate: 1 };
    // Strip emoji / symbols that TTS engines read out loud
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();

    if (this.isNative) {
      try {
        const czech = await this.ensureNative();
        await TextToSpeech.speak({
          text: clean,
          lang: czech ? 'cs-CZ' : 'en-US',
          rate: profile.rate,
          pitch: profile.pitch,
          volume: this.volume,
          category: 'ambient',
          queueStrategy: QueueStrategy.Flush,
        });
      } catch (e) {
        console.warn('Native TTS failed', e);
      }
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      if (!this.webVoice) this.pickWebVoice();
      if (this.webVoice) {
        u.voice = this.webVoice;
        u.lang = this.webVoice.lang;
      } else {
        u.lang = 'cs-CZ';
      }
      u.pitch = profile.pitch;
      u.rate = profile.rate;
      u.volume = this.volume;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('Speech synthesis error', e);
    }
  }
}

export const voiceEngine = new VoiceEngine();

