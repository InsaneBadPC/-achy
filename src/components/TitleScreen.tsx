/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode, AIDifficulty, BoardTheme } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { PWAInstallButton } from './PWAInstallButton';
import { Bot, Users, Globe, Play, Sparkles, Volume2, VolumeX, Settings2 } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, aiDifficulty: AIDifficulty, theme: BoardTheme) => void;
  onOpenMultiplayer: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenMultiplayer,
  onOpenSettings,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [theme, setTheme] = useState<BoardTheme>('royal_wood');
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    if (!next) soundEngine.playSelect();
  };

  const handleStart = () => {
    soundEngine.playSelect();
    if (selectedMode === 'multiplayer') {
      onOpenMultiplayer();
    } else {
      onStartGame(selectedMode, difficulty, theme);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 select-none z-20 overflow-y-auto bg-slate-950/70 font-['Fredoka',sans-serif]">
      {/* Top Header info */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs uppercase bg-amber-400 text-slate-950 border-2 sm:border-3 border-black shadow-[3px_3px_0px_#000]">
            <Sparkles className="w-4 h-4 fill-slate-950" /> KOMIKSOVÁ 3D BITVA
          </span>
          <span className="hidden md:inline-block text-xs text-yellow-300 font-bold bg-black/60 px-2.5 py-1 rounded-lg border border-yellow-400/30">
            Živé postavičky s vtipnými hláškami
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Native PWA Android Install Button */}
          <PWAInstallButton />

          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-xl bg-amber-300 hover:bg-amber-200 border-2 sm:border-3 border-black text-slate-950 shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title={isMuted ? 'Zapnout zvuky' : 'Ztlumit zvuky'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-slate-950" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-cyan-300 hover:bg-cyan-200 border-2 sm:border-3 border-black text-slate-950 shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Nastavení hry a šachovnice"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Centerpiece: Modern Comic Title Lockup */}
      <div className="flex flex-col items-center text-center max-w-3xl my-auto z-10 py-4">
        {/* Comic Action Starburst Background */}
        <div className="relative mb-3">
          <div className="inline-block relative">
            {/* Pop-art tag badge */}
            <div className="absolute -top-4 -right-4 sm:-right-8 rotate-12 bg-rose-500 text-white font-['Bangers'] tracking-wider text-sm sm:text-lg px-3 py-1 rounded-xl border-3 border-black shadow-[3px_3px_0px_#000] z-20 animate-bounce">
              100% ZÁBAVA!
            </div>

            <h1 className="font-['Bangers'] text-5xl sm:text-7xl lg:text-8xl tracking-wider text-yellow-300 drop-shadow-[5px_5px_0px_#000] uppercase leading-none">
              ZTŘEŠTĚNÉ ŠACHY
            </h1>
            <div className="font-['Bangers'] text-3xl sm:text-5xl tracking-widest text-cyan-400 drop-shadow-[4px_4px_0px_#000] uppercase -mt-1 sm:-mt-2">
              MAYHEM 3D
            </div>
          </div>
        </div>

        <p className="text-white text-sm sm:text-base font-bold max-w-lg mb-6 leading-snug bg-slate-900/80 px-4 py-2 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
          Živé figurky, které mluví a reagují na každý tah! Zákeřné banány, odpalovací pružiny, portály a bláznivé bonusové zbraně.
        </p>

        {/* Game Mode Selection Cards (Comic Neo-Brutalist) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mb-5">
          {/* Mode 1: AI */}
          <button
            onClick={() => {
              setSelectedMode('ai');
              soundEngine.playSelect();
            }}
            className={`p-4 rounded-2xl border-3 sm:border-4 border-black text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedMode === 'ai'
                ? 'bg-amber-400 shadow-[6px_6px_0px_#000] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white/95 hover:bg-amber-100 shadow-[3px_3px_0px_#000]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-slate-950 text-amber-400 border-2 border-black">
                <Bot className="w-5 h-5" />
              </span>
              <span className="text-[11px] uppercase font-black px-2 py-0.5 rounded-lg bg-black text-white">
                Sólo Hra
              </span>
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base mb-0.5">Proti Počítači</h3>
              <p className="text-xs font-semibold text-slate-800">Souboj s vtipnou AI</p>
            </div>
          </button>

          {/* Mode 2: Local PvP */}
          <button
            onClick={() => {
              setSelectedMode('local');
              soundEngine.playSelect();
            }}
            className={`p-4 rounded-2xl border-3 sm:border-4 border-black text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedMode === 'local'
                ? 'bg-cyan-400 shadow-[6px_6px_0px_#000] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white/95 hover:bg-cyan-100 shadow-[3px_3px_0px_#000]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-slate-950 text-cyan-400 border-2 border-black">
                <Users className="w-5 h-5" />
              </span>
              <span className="text-[11px] uppercase font-black px-2 py-0.5 rounded-lg bg-black text-white">
                1 Mobil / PC
              </span>
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base mb-0.5">Dva Hráči</h3>
              <p className="text-xs font-semibold text-slate-800">Společně na 1 displeji</p>
            </div>
          </button>

          {/* Mode 3: Remote Online */}
          <button
            onClick={() => {
              setSelectedMode('multiplayer');
              soundEngine.playSelect();
            }}
            className={`p-4 rounded-2xl border-3 sm:border-4 border-black text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedMode === 'multiplayer'
                ? 'bg-rose-400 shadow-[6px_6px_0px_#000] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white/95 hover:bg-rose-100 shadow-[3px_3px_0px_#000]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-slate-950 text-rose-400 border-2 border-black">
                <Globe className="w-5 h-5" />
              </span>
              <span className="text-[11px] uppercase font-black px-2 py-0.5 rounded-lg bg-black text-white">
                Online P2P
              </span>
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base mb-0.5">Na Dálku</h3>
              <p className="text-xs font-semibold text-slate-800">Propojení dvou zařízení</p>
            </div>
          </button>
        </div>

        {/* AI Difficulty Selector if AI mode is selected */}
        {selectedMode === 'ai' && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 p-2 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-xs text-slate-900 font-black px-2 uppercase">Obtížnost:</span>
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setDifficulty(lvl);
                  soundEngine.playSelect();
                }}
                className={`px-3 py-1 text-xs rounded-xl font-black transition-all cursor-pointer ${
                  difficulty === lvl
                    ? 'bg-amber-400 text-slate-950 border-2 border-black shadow-[2px_2px_0px_#000]'
                    : 'text-slate-700 hover:text-black hover:bg-slate-100'
                }`}
              >
                {lvl === 'easy' ? '😜 Šprýmař (Chaos)' : lvl === 'medium' ? '🧠 Koumák' : '👑 Velmistr'}
              </button>
            ))}
          </div>
        )}

        {/* Primary Start CTA Button */}
        <button
          onClick={handleStart}
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 sm:py-5 rounded-3xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Bangers'] text-2xl sm:text-3xl tracking-wider border-4 border-black shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
        >
          <Play className="w-8 h-8 fill-slate-950 group-hover:scale-110 transition-transform" />
          <span>{selectedMode === 'multiplayer' ? 'PŘEJÍT DO MULTIPLAYERU' : 'SPUSTIT BITVU!'}</span>
        </button>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <footer className="w-full text-center z-10 py-1">
        <p className="text-xs text-yellow-300 font-bold bg-black/70 inline-block px-4 py-1.5 rounded-full border border-yellow-400/40">
          Klepnutí: Výběr figurky a tah · Tažení: Otáčení 3D šachovnice · Dvěma prsty: Zoom
        </p>
      </footer>
    </div>
  );
};
