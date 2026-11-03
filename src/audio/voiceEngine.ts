/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { TextToSpeech, QueueStrategy } from '@capacitor-community/text-to-speech';
import { PieceType } from '../types/game';

interface VoiceProfile {
  pitch: number;
  rate: number;
}

const PROFILES: Record<PieceType, VoiceProfile> = {
  pawn: { pitch: 1.75, rate: 1.25 },
  king: { pitch: 0.6, rate: 0.88 },
  queen: { pitch: 1.35, rate: 1.05 },
  knight: { pitch: 1.45, rate: 1.3 },
  bishop: { pitch: 0.85, rate: 0.92 },
  rook: { pitch: 0.45, rate: 0.8 },
};

const STORAGE_KEY = 'wacky-chess-voice';

interface VoiceQueueItem {
  id: string;
  text: string;
  character: PieceType;
  priority: boolean;
  onFinish?: () => void;
}

class VoiceEngine {
  private enabled = true;
  private volume = 1;
  private isNative = Capacitor.isNativePlatform();
  private webVoice: SpeechSynthesisVoice | null = null;
  private nativeReady: Promise<boolean> | null = null;
  private isSpeaking = false;
  private queue: VoiceQueueItem[] = [];

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
    this.queue = [];
    this.isSpeaking = false;
    if (this.isNative) {
      TextToSpeech.stop().catch(() => undefined);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speak a line in the character's voice.
   * If priority is true, it jumps to front or interrupts.
   * Otherwise it queues nicely so characters never cut each other off!
   */
  public speak(text: string, character: PieceType, priority = false, onFinish?: () => void) {
    if (!this.enabled || this.volume <= 0 || !text) {
      onFinish?.();
      return;
    }

    const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
    if (!clean) {
      onFinish?.();
      return;
    }

    const item: VoiceQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      text: clean,
      character,
      priority,
      onFinish,
    };

    if (priority) {
      this.stop();
      this.queue.push(item);
      this.processQueue();
    } else {
      // Limit queue to at most 3 utterances so it never gets clogged
      if (this.queue.length >= 3) {
        this.queue.shift();
      }
      this.queue.push(item);
      if (!this.isSpeaking) {
        this.processQueue();
      }
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const item = this.queue.shift()!;
    const profile = PROFILES[item.character] || { pitch: 1, rate: 1 };

    if (this.isNative) {
      try {
        const czech = await this.ensureNative();
        await TextToSpeech.speak({
          text: item.text,
          lang: czech ? 'cs-CZ' : 'en-US',
          rate: profile.rate,
          pitch: profile.pitch,
          volume: this.volume,
          category: 'ambient',
          queueStrategy: QueueStrategy.Add,
        });
      } catch (e) {
        console.warn('Native TTS failed', e);
      } finally {
        item.onFinish?.();
        this.isSpeaking = false;
        setTimeout(() => this.processQueue(), 200);
      }
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      item.onFinish?.();
      this.isSpeaking = false;
      return;
    }

    try {
      const u = new SpeechSynthesisUtterance(item.text);
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

      u.onend = () => {
        item.onFinish?.();
        this.isSpeaking = false;
        setTimeout(() => this.processQueue(), 150);
      };

      u.onerror = () => {
        item.onFinish?.();
        this.isSpeaking = false;
        setTimeout(() => this.processQueue(), 100);
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('Speech synthesis error', e);
      item.onFinish?.();
      this.isSpeaking = false;
    }
  }
}

export const voiceEngine = new VoiceEngine();
