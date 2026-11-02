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
      <div className="relative bg-white border-4 border-black p-3.5 sm:p-4 rounded-3xl shadow-[6px_6px_0px_#000] flex items-center gap-3">
        {/* Comic Action Starburst Tag */}
        {quote.comicTag && (
          <div className="absolute -top-3.5 -left-3 rotate-[-12deg] bg-rose-500 text-white font-['Bangers'] tracking-wider text-sm sm:text-base px-2.5 py-0.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] shrink-0">
            {quote.comicTag}
          </div>
        )}

        {/* Character Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-amber-300 border-3 border-black flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0px_#000]">
          {quote.avatar}
        </div>

        {/* Text Content */}
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            {quote.speaker}
          </span>
          <p className="text-sm sm:text-base font-extrabold text-slate-950 leading-snug font-['Fredoka']">
            "{quote.text}"
          </p>
        </div>

        {/* Comic Bubble Tail */}
        <div className="absolute -bottom-3 left-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-black" />
        <div className="absolute -bottom-2 left-10 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[11px] border-t-white" />
      </div>
    </div>
  );
};
