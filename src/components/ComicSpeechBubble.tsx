/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterQuote } from '../game/characterQuotes';

interface ComicSpeechBubbleProps {
  quote: CharacterQuote | null;
  onDismiss?: () => void;
}

export const ComicSpeechBubble: React.FC<ComicSpeechBubbleProps> = ({ quote, onDismiss }) => {
  if (!quote) return null;

  return (
    <div
      onClick={onDismiss}
      className="fixed top-18 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92vw] sm:w-auto animate-in zoom-in-95 duration-200 cursor-pointer pointer-events-auto"
    >
      <div className="relative bg-slate-900/95 backdrop-blur-md border-2 border-amber-400 p-3.5 sm:p-4 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-center gap-3.5 text-white">
        {/* Comic Action Starburst Tag */}
        {quote.comicTag && (
          <div className="absolute -top-3.5 -left-3 rotate-[-10deg] bg-gradient-to-r from-rose-500 to-red-600 text-white font-['Bangers'] tracking-wider text-xs sm:text-sm px-2.5 py-0.5 rounded-lg border border-black shadow-md shrink-0">
            {quote.comicTag}
          </div>
        )}

        {/* Character Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white/20 flex items-center justify-center text-2xl shrink-0 shadow-lg">
          {quote.avatar}
        </div>

        {/* Text Content */}
        <div className="flex flex-col text-left pr-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            {quote.speaker}
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-100 leading-snug font-['Fredoka']">
            "{quote.text}"
          </p>
        </div>

        {/* Comic Bubble Tail */}
        <div className="absolute -bottom-2.5 left-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-amber-400" />
      </div>
    </div>
  );
};
