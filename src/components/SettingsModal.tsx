/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BoardTheme } from '../types/game';
import { TRAP_CONFIG, ITEM_CONFIG } from '../game/trapsAndItems';
import { X, Sliders, BookOpen, Check } from 'lucide-react';
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
  const [tab, setTab] = React.useState<'settings' | 'guide'>('settings');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-['Fredoka']">
      <div className="relative w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-amber-400 border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col max-h-[90vh] overflow-y-auto text-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
          <div className="flex items-center gap-2">
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
              <span>Nastavení & Světy</span>
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
              <span>Pasti & Bonusy</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black text-white hover:bg-slate-800 transition-all cursor-pointer"
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
      </div>
    </div>
  );
};
