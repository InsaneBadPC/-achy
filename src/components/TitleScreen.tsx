/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode, AIDifficulty, BoardTheme } from '../types/game';
import { BattlefieldMapId } from '../types/battlefield';
import { soundEngine } from '../audio/soundEngine';
import { voiceEngine } from '../audio/voiceEngine';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Bot,
  Users,
  Globe,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
  Settings2,
  Mic,
  MicOff,
  Castle,
  Zap,
  Mountain,
  Trees,
  Shield,
} from 'lucide-react';

export type GameStyle = 'classic' | 'battlefield';

interface TitleScreenProps {
  onStartGame: (
    mode: GameMode,
    aiDifficulty: AIDifficulty,
    theme: BoardTheme,
    gameStyle: GameStyle,
    battlefieldMapId?: BattlefieldMapId
  ) => void;
  onOpenMultiplayer: (gameStyle: GameStyle, battlefieldMapId?: BattlefieldMapId) => void;
  onOpenSettings: () => void;
  onOpenUpdates: () => void;
  hasUpdateAvailable?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenMultiplayer,
  onOpenSettings,
  onOpenUpdates,
  hasUpdateAvailable,
}) => {
  const [gameStyle, setGameStyle] = useState<GameStyle>('battlefield');
  const [battlefieldMapId, setBattlefieldMapId] = useState<BattlefieldMapId>('priroda');
  const [selectedMode, setSelectedMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [theme, setTheme] = useState<BoardTheme>('royal_wood');
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [isVoiceOn, setIsVoiceOn] = useState(voiceEngine.isEnabled());

  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    if (!next) soundEngine.playSelect();
  };

  const handleToggleVoice = () => {
    const next = !isVoiceOn;
    setIsVoiceOn(next);
    voiceEngine.setEnabled(next);
    if (next) soundEngine.playSelect();
  };

  const handleStart = () => {
    soundEngine.playSelect();
    if (selectedMode === 'multiplayer') {
      onOpenMultiplayer(gameStyle, battlefieldMapId);
    } else {
      onStartGame(selectedMode, difficulty, theme, gameStyle, battlefieldMapId);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 select-none z-20 overflow-y-auto bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/95 backdrop-blur-[2px] font-['Fredoka',sans-serif]">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-black text-xs uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-4 h-4 fill-slate-950" /> 3D KOMIKSOVÁ BITVA
          </span>
          <span className="hidden md:inline-block text-xs text-slate-300 font-semibold bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
            Živé mluvící figurky v češtině, terény & záludné pasti
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* GitHub Update Notification Pill */}
          <button
            onClick={() => {
              soundEngine.playSelect();
              onOpenUpdates();
            }}
            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-1.5 relative ${
              hasUpdateAvailable
                ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse font-black'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-white/15'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aktualizace</span>
            {hasUpdateAvailable && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <PWAInstallButton />

          <button
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-lg ${
              isVoiceOn
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                : 'bg-slate-900/80 border-white/10 text-slate-500'
            }`}
            title={isVoiceOn ? 'České hlasy zapnuty' : 'České hlasy vypnuty'}
          >
            {isVoiceOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white shadow-lg cursor-pointer transition-all"
            title={isMuted ? 'Zapnout zvuky' : 'Ztlumit zvuky'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-lime-400" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white shadow-lg cursor-pointer transition-all"
            title="Nastavení hry a světů"
          >
            <Settings2 className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Hero Centerpiece */}
      <div className="flex flex-col items-center text-center max-w-4xl my-auto z-10 py-3 w-full">
        <div className="relative mb-2">
          <div className="inline-block relative">
            <div className="absolute -top-3 -right-4 sm:-right-8 rotate-12 bg-gradient-to-r from-rose-500 to-red-600 text-white font-['Bangers'] tracking-wider text-xs sm:text-base px-3 py-1 rounded-xl border border-black shadow-lg z-20 animate-bounce">
              100% ZÁBAVA!
            </div>

            <h1 className="font-['Bangers'] text-5xl sm:text-7xl lg:text-8xl tracking-wider text-amber-400 drop-shadow-[0_8px_25px_rgba(251,191,36,0.35)] uppercase leading-none">
              ZTŘEŠTĚNÉ ŠACHY
            </h1>
            <div className="font-['Bangers'] text-2xl sm:text-4xl lg:text-5xl tracking-widest text-cyan-400 drop-shadow-[0_6px_20px_rgba(34,211,238,0.3)] uppercase -mt-1 sm:-mt-2">
              MAYHEM 3D & BOJIŠTĚ
            </div>
          </div>
        </div>

        {/* Game Style Switcher (Klasika vs Mód Bojiště) */}
        <div className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-3xl bg-slate-900/90 border border-white/15 shadow-2xl mb-4 max-w-xl w-full">
          <button
            onClick={() => {
              setGameStyle('battlefield');
              soundEngine.playSelect();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-['Bangers'] text-lg sm:text-xl tracking-wider transition-all cursor-pointer ${
              gameStyle === 'battlefield'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-102'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Castle className="w-5 h-5" />
            <span>MÓD BOJIŠTĚ (TERÉNY)</span>
          </button>

          <button
            onClick={() => {
              setGameStyle('classic');
              soundEngine.playSelect();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-['Bangers'] text-lg sm:text-xl tracking-wider transition-all cursor-pointer ${
              gameStyle === 'classic'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30 scale-102'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>KLASICKÉ ŠACHY</span>
          </button>
        </div>

        {/* Battlefield Map Selector (when Bojiště style is chosen) */}
        {gameStyle === 'battlefield' && (
          <div className="w-full max-w-3xl mb-4">
            <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              <Mountain className="w-4 h-4" /> Vyber bojiště:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
              {/* Map 1: Příroda */}
              <button
                onClick={() => {
                  setBattlefieldMapId('priroda');
                  soundEngine.playSelect();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  battlefieldMapId === 'priroda'
                    ? 'bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border-emerald-400 shadow-[0_8px_25px_rgba(16,185,129,0.3)] scale-[1.02]'
                    : 'bg-slate-900/70 hover:bg-slate-900 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 rounded-xl bg-emerald-400 text-slate-950 shadow">
                    <Trees className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Údolí řeky
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">1. Příroda</h4>
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                    Řeka, rychlé mosty, brody a pravidelná záplava brodů.
                  </p>
                </div>
              </button>

              {/* Map 2: Průsmyk */}
              <button
                onClick={() => {
                  setBattlefieldMapId('prusmyk');
                  soundEngine.playSelect();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  battlefieldMapId === 'prusmyk'
                    ? 'bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border-amber-400 shadow-[0_8px_25px_rgba(245,158,11,0.3)] scale-[1.02]'
                    : 'bg-slate-900/70 hover:bg-slate-900 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 rounded-xl bg-amber-400 text-slate-950 shadow">
                    <Mountain className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Boj o plošinu
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">2. Průsmyk</h4>
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                    Vyvýšená plošina (výška 2), strmé útesy, rampy a pasti s hroty.
                  </p>
                </div>
              </button>

              {/* Map 3: Obléhání */}
              <button
                onClick={() => {
                  setBattlefieldMapId('oblehani');
                  soundEngine.playSelect();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  battlefieldMapId === 'oblehani'
                    ? 'bg-gradient-to-br from-rose-500/25 to-red-500/10 border-rose-400 shadow-[0_8px_25px_rgba(244,63,94,0.3)] scale-[1.02]'
                    : 'bg-slate-900/70 hover:bg-slate-900 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-2 rounded-xl bg-rose-400 text-slate-950 shadow">
                    <Shield className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-rose-400/20 text-rose-300 border border-rose-400/30">
                    Útok na pevnost
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">3. Obléhání</h4>
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                    Hradby, brány, katapult bílého a časový limit 60 půltahů.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Game Mode Selection (AI, Local PvP, Remote Online) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mb-4">
          {/* Mode 1: AI */}
          <button
            onClick={() => {
              setSelectedMode('ai');
              soundEngine.playSelect();
            }}
            className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
              selectedMode === 'ai'
                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.25)] translate-y-[-2px]'
                : 'bg-slate-900/70 hover:bg-slate-900 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2.5 rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                <Bot className="w-5 h-5" />
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg bg-white/10 text-amber-300">
                Sólo Hra
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base mb-0.5">Proti Počítači</h3>
              <p className="text-xs text-slate-400">Souboj s taktickou AI</p>
            </div>
          </button>

          {/* Mode 2: Local PvP */}
          <button
            onClick={() => {
              setSelectedMode('local');
              soundEngine.playSelect();
            }}
            className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
              selectedMode === 'local'
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-400 shadow-[0_10px_30px_rgba(6,182,212,0.25)] translate-y-[-2px]'
                : 'bg-slate-900/70 hover:bg-slate-900 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2.5 rounded-2xl bg-cyan-400 text-slate-950 shadow-md">
                <Users className="w-5 h-5" />
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg bg-white/10 text-cyan-300">
                1 Zařízení
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base mb-0.5">Dva Hráči</h3>
              <p className="text-xs text-slate-400">Na jednom mobilu / PC</p>
            </div>
          </button>

          {/* Mode 3: Remote Online */}
          <button
            onClick={() => {
              setSelectedMode('multiplayer');
              soundEngine.playSelect();
            }}
            className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
              selectedMode === 'multiplayer'
                ? 'bg-gradient-to-br from-rose-500/20 to-pink-500/10 border-rose-400 shadow-[0_10px_30px_rgba(244,63,94,0.25)] translate-y-[-2px]'
                : 'bg-slate-900/70 hover:bg-slate-900 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2.5 rounded-2xl bg-rose-400 text-slate-950 shadow-md">
                <Globe className="w-5 h-5" />
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg bg-white/10 text-rose-300">
                P2P Online
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base mb-0.5">Na Dálku</h3>
              <p className="text-xs text-slate-400">Propojení dvou zařízení</p>
            </div>
          </button>
        </div>

        {/* AI Difficulty Selector */}
        {selectedMode === 'ai' && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 p-2 rounded-2xl bg-slate-900/90 border border-white/15 shadow-xl">
            <span className="text-xs text-slate-300 font-bold px-2 uppercase">Obtížnost:</span>
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setDifficulty(lvl);
                  soundEngine.playSelect();
                }}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  difficulty === lvl
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {lvl === 'easy' ? '😜 Chaos' : lvl === 'medium' ? '🧠 Koumák' : '👑 Velmistr'}
              </button>
            ))}
          </div>
        )}

        {/* Primary Start CTA Button */}
        <button
          onClick={handleStart}
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 sm:py-5 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-['Bangers'] text-2xl sm:text-3xl tracking-wider shadow-[0_12px_40px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-7 h-7 fill-slate-950 group-hover:scale-110 transition-transform" />
          <span>
            {selectedMode === 'multiplayer'
              ? 'PŘEJÍT DO MULTIPLAYERU'
              : gameStyle === 'battlefield'
              ? 'VSTOUPIT NA BOJIŠTĚ!'
              : 'SPUSTIT BITVU!'}
          </span>
        </button>
      </div>

      {/* Bottom Hint */}
      <footer className="w-full text-center z-10 py-1">
        <p className="text-xs text-slate-400 font-medium bg-slate-900/80 inline-block px-4 py-1.5 rounded-full border border-white/10">
          Klepnutí: Výběr figurky a tah · Tažení: Otáčení 3D scény · Dvěma prsty: Zoom · ℹ️ Pravidla mapy
        </p>
      </footer>
    </div>
  );
};
