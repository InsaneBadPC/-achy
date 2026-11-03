/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BattlefieldState } from '../types/battlefield';
import { BATTLEFIELD_MAPS, TERRAIN_TYPES } from '../game/battlefieldData';
import { X, ShieldAlert, Sparkles, Clock, Target, Info, Mountain, Trees, Waves } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface BattlefieldRuleModalProps {
  state: BattlefieldState;
  onClose: () => void;
}

export const BattlefieldRuleModal: React.FC<BattlefieldRuleModalProps> = ({ state, onClose }) => {
  const mapConfig = BATTLEFIELD_MAPS[state.mapId];
  if (!mapConfig) return null;

  const { uiRulesPanel } = mapConfig;

  // Compute dynamic counter values
  const getCounterValue = (counterId: string): string => {
    const halfMoves = state.halfMoveCount;

    switch (counterId) {
      case 'flood_timer': {
        const rem = 10 - (halfMoves % 10);
        return state.isFloodActive
          ? '🌊 ZÁPLAVA PRÁVĚ PROBÍHÁ!'
          : state.floodWarning
          ? '⚠️ ZÁPLAVA ZA 1 PŮLTAH!'
          : `${rem} půltahů (${Math.ceil(rem / 2)} tahů)`;
      }
      case 'trap_timer': {
        const rem = 8 - (halfMoves % 8);
        return state.isTrapActive
          ? '⚔️ HROTY AKTIVNÍ!'
          : state.trapWarning
          ? '⚠️ SKLAPNE ZA 1 PŮLTAH!'
          : `${rem} půltahů (${Math.ceil(rem / 2)} tahů)`;
      }
      case 'siege_remaining_half_moves': {
        const rem = Math.max(0, 60 - halfMoves);
        return `${rem} půltahů (${Math.ceil(rem / 2)} tahů)`;
      }
      case 'catapult_cooldown': {
        if (state.catapultPending) {
          return `💥 Letí střela! Dopad za ${state.catapultPending.delay} půltah`;
        }
        if (halfMoves < 10) {
          return `Odemkne se za ${10 - halfMoves} půltahů`;
        }
        const cycle = halfMoves % 12;
        if (cycle === 0 || cycle >= 10) {
          return '🎯 NABITÝ A PŘIPRAVEN!';
        }
        return `${12 - cycle} půltahů do nabití`;
      }
      case 'gate_close_status': {
        return state.gateClosed ? '❌ Použito' : '✅ Dostupné (1x za hru)';
      }
      case 'supply_drop_timer': {
        const rem = 10 - (halfMoves % 10);
        return `${rem} půltahů`;
      }
      default:
        return '–';
    }
  };

  const getTerrainIcon = (char: string) => {
    switch (char) {
      case '1':
        return <Mountain className="w-5 h-5 text-amber-300" />;
      case '2':
        return <ShieldAlert className="w-5 h-5 text-orange-400" />;
      case 'L':
        return <Trees className="w-5 h-5 text-emerald-400" />;
      case ':':
      case '~':
      case 'M':
        return <Waves className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-yellow-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-['Fredoka',sans-serif] animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border-2 border-amber-400/50 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{uiRulesPanel.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-['Bangers'] tracking-wider text-amber-400">
                  {mapConfig.name} – {mapConfig.subtitle}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold uppercase">
                  Mód Bojiště
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{uiRulesPanel.goalText}</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playSelect();
              onClose();
            }}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Dynamic Counters Box */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-amber-400/20 space-y-2.5">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Stav událostí & počítadla partie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {uiRulesPanel.dynamicCounters.map((cnt) => (
                <div
                  key={cnt.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5"
                >
                  <span className="text-xs text-slate-300 font-medium">{cnt.label}:</span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-400/30">
                    {getCounterValue(cnt.id)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Summary Points */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Klíčová pravidla této mapy
            </h3>
            <div className="space-y-1.5">
              {uiRulesPanel.mapSummary.map((point, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-800/50 p-2.5 rounded-xl border border-white/5"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terrain Legend */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Mountain className="w-4 h-4" /> Legenda polí & terénu
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {uiRulesPanel.visibleTerrains.map((char) => {
                const terrain = TERRAIN_TYPES[char];
                if (!terrain) return null;
                return (
                  <div
                    key={char}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-white/5"
                  >
                    <div className="p-2 rounded-xl bg-slate-900 border border-white/10 shrink-0">
                      {getTerrainIcon(char)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{terrain.name}</span>
                        {terrain.height !== null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            Výška {terrain.height}
                          </span>
                        )}
                        {!terrain.passable && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                            Neprůchodné
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        {terrain.tooltip}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="p-4 bg-slate-950/80 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playSelect();
              onClose();
            }}
            className="px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Rozumím, pokračovat ve hře
          </button>
        </div>
      </div>
    </div>
  );
};

