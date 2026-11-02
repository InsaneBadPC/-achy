/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PieceColor } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  winner: PieceColor | 'draw' | null;
  isCheckmate: boolean;
  turnNumber: number;
  onRematch: () => void;
  onReturnToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  isCheckmate,
  turnNumber,
  onRematch,
  onReturnToTitle,
}) => {
  useEffect(() => {
    if (winner && winner !== 'draw') {
      soundEngine.playVictory();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      const timer = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [winner]);

  if (!winner) return null;

  const isWhiteWin = winner === 'white';
  const isDraw = winner === 'draw';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 font-['Fredoka']">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-amber-400 border-4 border-black shadow-[10px_10px_0px_#000] text-center flex flex-col items-center text-slate-950">
        {/* Comic Action Starburst Badge */}
        <div className="absolute -top-5 rotate-[-6deg] bg-rose-500 text-white font-['Bangers'] text-xl tracking-wider px-4 py-1 rounded-xl border-3 border-black shadow-[3px_3px_0px_#000]">
          {isDraw ? 'NEROZHODNĚ!' : 'K.O.! VÍTĚZSTVÍ!'}
        </div>

        {/* Trophy / Icon */}
        <div className="relative my-3">
          <div className="w-20 h-20 rounded-2xl bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
            {isDraw ? (
              <span className="text-4xl">🤝</span>
            ) : (
              <Trophy className="w-12 h-12 text-yellow-500 fill-yellow-400" />
            )}
          </div>
          <span className="absolute -top-2 -right-2">
            <Sparkles className="w-7 h-7 text-white fill-yellow-300 animate-spin" />
          </span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-['Bangers'] tracking-wider text-slate-950 uppercase mb-1 drop-shadow-[2px_2px_0px_#fff]">
          {isDraw
            ? 'Patová Remíza!'
            : isWhiteWin
            ? 'Sláva Bílému Králi!'
            : 'Vítězství Černých!'}
        </h2>

        {/* Subtitle in Czech */}
        <p className="text-slate-900 text-sm font-bold mb-6">
          {isCheckmate
            ? 'Šach-mat! Nepřátelský král padl v epické bitvě plné pastí a smíchu!'
            : isDraw
            ? 'Žádný hráč nemá platný tah. Hra končí nerozhodně!'
            : 'Soupeř kapituloval a vzdal bitvu.'}
        </p>

        {/* Match Stats */}
        <div className="w-full grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white border-3 border-black shadow-[3px_3px_0px_#000] mb-6 text-left">
          <div>
            <span className="text-[11px] font-black uppercase text-slate-700 block">Celkem Tahů</span>
            <span className="text-xl font-['Bangers'] text-slate-950">{turnNumber}</span>
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-slate-700 block">Konečné Skóre</span>
            <span className="text-xl font-['Bangers'] text-rose-600">
              {isDraw ? 'Remíza' : isWhiteWin ? '1 - 0' : '0 - 1'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playSelect();
              onRematch();
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-black hover:bg-slate-900 text-yellow-300 font-['Bangers'] text-xl uppercase tracking-wider flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_#fff] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-yellow-300" />
            <span>Hrát Znovu!</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSelect();
              onReturnToTitle();
            }}
            className="py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
