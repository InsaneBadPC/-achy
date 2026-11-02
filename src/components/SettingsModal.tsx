/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BoardTheme } from '../types/game';
import { TRAP_CONFIG, ITEM_CONFIG } from '../game/trapsAndItems';
import { X, Sliders, BookOpen, Check, Smartphone, Copy, Info } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: BoardTheme;
  onChangeTheme: (theme: BoardTheme) => void;
  trapCount: number;
  onChangeTrapCount: (count: number) => void;
  bonusItemsEnabled: boolean;
  onToggleBonusItems: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  trapCount,
  onChangeTrapCount,
  bonusItemsEnabled,
  onToggleBonusItems,
}) => {
  const [tab, setTab] = useState<'settings' | 'guide' | 'apk'>('settings');
  const [copiedManifest, setCopiedManifest] = useState(false);

  if (!isOpen) return null;

  const themes: { id: BoardTheme; name: string; emoji: string; desc: string }[] = [
    { id: 'royal_wood', name: 'Dřevěný Hrad', emoji: '🏰', desc: 'Klasická královská dřevěná šachovnice' },
    { id: 'volcano_dungeon', name: 'Lávové Podzemí', emoji: '🌋', desc: 'Obsidián a žhavé lávové pukliny' },
    { id: 'magic_crystal', name: 'Zimní Ledová Říše', emoji: '❄️', desc: 'Mrazivý led a třpytivé krystaly' },
    { id: 'cyber_neon', name: 'Neon Cyber', emoji: '⚡', desc: 'Synthwave digitální mřížka z budoucnosti' },
    { id: 'pirate_island', name: 'Pirátský Ostrov', emoji: '🏴‍☠️', desc: 'Zlatý písek, vrak lodi a tyrkysové moře' },
    { id: 'candy_land', name: 'Cukrové Království', emoji: '🍭', desc: 'Žvýkačková růžová a sladké posypky' },
    { id: 'space_station', name: 'Vesmírná Stanice', emoji: '🛸', desc: 'Měsíční hornina a mimozemské okruhy' },
    { id: 'spooky_graveyard', name: 'Strašidelný Hřbitov', emoji: '🎃', desc: 'Tajemná fialová mlha a staré kameny' },
  ];

  const manifestJsonString = JSON.stringify(
    {
      id: '/',
      name: 'Wacky Chess Mayhem 3D',
      short_name: 'WackyChess',
      description: 'Ztřeštěné 3D šachy s živými komiksovými figurkami, záludnými pastmi, náhodnými bonusy a multiplayerem.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: '#090d16',
      theme_color: '#facc15',
      categories: ['games', 'entertainment'],
      lang: 'cs',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2
  );

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJsonString);
    setCopiedManifest(true);
    soundEngine.playSelect();
    setTimeout(() => setCopiedManifest(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-['Fredoka']">
      <div className="relative w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-amber-400 border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col max-h-[90vh] overflow-y-auto text-slate-950">
        {/* Header with 3 Tabs */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setTab('settings');
                soundEngine.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'settings'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#ffffff]'
                  : 'bg-white text-slate-950 border-2 border-black hover:bg-yellow-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Světy</span>
            </button>

            <button
              onClick={() => {
                setTab('guide');
                soundEngine.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'guide'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#ffffff]'
                  : 'bg-white text-slate-950 border-2 border-black hover:bg-yellow-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pasti</span>
            </button>

            <button
              onClick={() => {
                setTab('apk');
                soundEngine.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'apk'
                  ? 'bg-rose-500 text-white shadow-[2px_2px_0px_#ffffff]'
                  : 'bg-white text-slate-950 border-2 border-black hover:bg-yellow-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black text-white hover:bg-slate-800 transition-all cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Settings & Environments */}
        {tab === 'settings' && (
          <div className="flex flex-col gap-4 py-1">
            {/* 8 Theme Pickers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider">
                  Výběr Prostředí & Šachovnice (8 světů)
                </label>
                <span className="text-[11px] font-bold text-slate-800">
                  Aktivní: {themes.find((t) => t.id === theme)?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      onChangeTheme(th.id);
                      soundEngine.playSelect();
                    }}
                    className={`p-3 rounded-2xl border-3 border-black text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      theme === th.id
                        ? 'bg-white shadow-[4px_4px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-yellow-300 hover:bg-yellow-200 shadow-[2px_2px_0px_#000]'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{th.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black block truncate">{th.name}</span>
                        {theme === th.id && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-800 font-semibold leading-tight line-clamp-1 block">
                        {th.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trap Count */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider block mb-2">
                Množství Pastí na Šachovnici
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 4, label: 'Mírný (4 pasti)' },
                  { count: 6, label: 'Standard (6 pastí)' },
                  { count: 10, label: 'Čistý Chaos (10 pastí)' },
                ].map((item) => (
                  <button
                    key={item.count}
                    onClick={() => {
                      onChangeTrapCount(item.count);
                      soundEngine.playSelect();
                    }}
                    className={`p-2.5 rounded-xl border-3 border-black text-center text-xs font-black transition-all cursor-pointer ${
                      trapCount === item.count
                        ? 'bg-black text-white shadow-[3px_3px_0px_#ffffff]'
                        : 'bg-white text-slate-900 hover:bg-yellow-100 shadow-[2px_2px_0px_#000]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bonus Items Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-3 border-black shadow-[3px_3px_0px_#000]">
              <div>
                <span className="text-xs font-black block">Náhodné Bonusové Zbraně</span>
                <span className="text-[11px] text-slate-700 font-semibold">
                  Na prázdných polích se objevují raketové trysky a kladiva
                </span>
              </div>
              <button
                onClick={() => {
                  onToggleBonusItems();
                  soundEngine.playSelect();
                }}
                className={`w-14 h-7 rounded-full border-2 border-black transition-colors relative cursor-pointer ${
                  bonusItemsEnabled ? 'bg-emerald-400' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black border border-white transition-transform ${
                    bonusItemsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Rules & Traps Guide */}
        {tab === 'guide' && (
          <div className="flex flex-col gap-4 py-1">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider mb-2">
                Záludné Pasti na Šachovnici
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(TRAP_CONFIG).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 rounded-2xl bg-white border-3 border-black shadow-[2px_2px_0px_#000] flex items-start gap-2.5 text-xs"
                  >
                    <span className="text-2xl shrink-0">{val.emoji}</span>
                    <div>
                      <span className="font-black text-slate-950 block">{val.name}</span>
                      <span className="text-slate-700 font-semibold leading-tight">{val.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-wider mb-2">
                Speciální Bonusové Předměty
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(ITEM_CONFIG).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 rounded-2xl bg-white border-3 border-black shadow-[2px_2px_0px_#000] flex items-start gap-2.5 text-xs"
                  >
                    <span className="text-2xl shrink-0">{val.emoji}</span>
                    <div>
                      <span className="font-black text-slate-950 block">{val.name}</span>
                      <span className="text-slate-700 font-semibold leading-tight">{val.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Android APK & PWABuilder Helper */}
        {tab === 'apk' && (
          <div className="flex flex-col gap-3 py-1 text-slate-950">
            {/* Why error happens banner */}
            <div className="p-3.5 rounded-2xl bg-white border-3 border-black shadow-[3px_3px_0px_#000]">
              <div className="flex items-center gap-2 mb-1.5 text-amber-800 font-black text-xs uppercase">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Proč PWABuilder hlásí chybu?</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-snug">
                Vývojová adresa na Google Cloud Run je chráněna přihlašovací obrazovkou Google.
                Externí robot PWABuilderu se zvenčí zastaví na přihlášení a nemůže soubor automaticky stáhnout.
              </p>
            </div>

            {/* Method 1: The fastest native install without PWABuilder */}
            <div className="p-3.5 rounded-2xl bg-emerald-300 border-3 border-black shadow-[3px_3px_0px_#000]">
              <h4 className="font-black text-xs uppercase mb-1 flex items-center gap-1.5">
                <span>⚡ 1. Nejrychlejší způsob: Nativní instalace na Android</span>
              </h4>
              <p className="text-xs font-semibold text-slate-900 leading-snug mb-2">
                Otevřete hru na svém mobilu v prohlížeči <strong>Google Chrome</strong> a klepněte na zelené tlačítko <strong>„Instalovat do mobilu“</strong> nahoře na liště (nebo v menu Chrome zvolte <em>„Instalovat aplikaci“</em>).
              </p>
              <div className="text-[11px] font-bold bg-white/80 p-2 rounded-xl border border-black/30">
                ✅ Hra se IHNED nainstaluje jako plnohodnotná aplikace přímo na plochu mobilu bez jakéhokoliv stahování souborů!
              </div>
            </div>

            {/* Method 2: PWABuilder Copy Manifest */}
            <div className="p-3.5 rounded-2xl bg-white border-3 border-black shadow-[3px_3px_0px_#000]">
              <h4 className="font-black text-xs uppercase mb-1">
                📦 2. Chcete přímo .APK soubor přes PWABuilder?
              </h4>
              <p className="text-xs font-semibold text-slate-800 leading-snug mb-3">
                Na PWABuilderu klikněte na <strong>„Edit Your Manifest“</strong> a vložte tam níže připravený kód manifestu:
              </p>

              <button
                onClick={handleCopyManifest}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {copiedManifest ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Zkopírováno do schránky!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>Kopírovat JSON Manifest pro PWABuilder</span>
                  </>
                )}
              </button>

              <pre className="mt-2.5 p-2 bg-slate-950 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-32 border border-black">
                {manifestJsonString}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
