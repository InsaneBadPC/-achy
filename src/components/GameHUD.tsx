/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PieceColor,
  Piece,
  FloatingNotification,
  GameMode,
} from '../types/game';
import { CharacterQuote } from '../game/characterQuotes';
import { ComicSpeechBubble } from './ComicSpeechBubble';
import { PWAInstallButton } from './PWAInstallButton';
import { soundEngine } from '../audio/soundEngine';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  ChevronDown,
  ChevronUp,
  Smile,
  Home,
  Bot,
  Users,
  Globe,
} from 'lucide-react';

interface GameHUDProps {
  currentTurn: PieceColor;
  turnNumber: number;
  isCheck: boolean;
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  gameMode: GameMode;
  notifications: FloatingNotification[];
  currentQuote: CharacterQuote | null;
  activeCameraView: 'iso' | 'white' | 'black' | 'top';
  isMuted: boolean;
  isMusicOn: boolean;
  isAiThinking: boolean;
  myColor?: PieceColor;
  onCameraChange: (view: 'iso' | 'white' | 'black' | 'top') => void;
  onUndoMove: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onSendEmote: (emoji: string, text: string) => void;
  onReturnToTitle: () => void;
  onRestartGame: () => void;
  onDismissQuote: () => void;
  onChangeGameMode?: (mode: GameMode) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentTurn,
  turnNumber,
  isCheck,
  capturedWhite,
  capturedBlack,
  gameMode,
  notifications,
  currentQuote,
  activeCameraView,
  isMuted,
  isMusicOn,
  isAiThinking,
  myColor,
  onCameraChange,
  onUndoMove,
  onToggleSound,
  onToggleMusic,
  onSendEmote,
  onReturnToTitle,
  onRestartGame,
  onDismissQuote,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [showEmotePicker, setShowEmotePicker] = useState(false);

  const emotes = [
    { emoji: '🍌', text: 'Pozor na banán!' },
    { emoji: '😱', text: 'Pomóóóc!' },
    { emoji: '😂', text: 'Haha, to se ti nepovedlo!' },
    { emoji: '👑', text: 'Cesta krále!' },
    { emoji: '💥', text: 'BUM! Překvapení!' },
    { emoji: '🧠', text: 'Geniální tah!' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-6 overflow-hidden font-['Fredoka']">
      {/* Top Status Perimeter: Turn badge, Check alert, captured pieces */}
      <div className="w-full flex items-start justify-between pointer-events-auto gap-2">
        {/* Left: Turn Status Badge (Comic Neo-Brutalist) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <div
              className={`w-5 h-5 rounded-full border-3 border-black ${
                currentTurn === 'white' ? 'bg-amber-300' : 'bg-slate-900'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider">
                {currentTurn === 'white' ? 'Bílý na tahu' : 'Černý na tahu'}
              </span>
              <span className="text-[11px] text-slate-700 font-bold">
                Tah #{turnNumber} •{' '}
                {gameMode === 'ai'
                  ? currentTurn === 'white'
                    ? 'Tvůj tah'
                    : 'AI přemýšlí...'
                  : gameMode === 'multiplayer'
                  ? myColor === currentTurn
                    ? 'Tvůj tah'
                    : 'Tah soupeře'
                  : 'Střídání hráčů'}
              </span>
            </div>
            {isAiThinking && (
              <span className="ml-1 text-xs font-black text-amber-600 animate-pulse">
                🤖 ...
              </span>
            )}
          </div>

          {/* Captured Pieces by White */}
          {capturedBlack.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/90 border-2 border-black shadow-[2px_2px_0px_#000] text-xs">
              <span className="text-slate-800 font-black text-[10px] mr-1 uppercase">Zajato:</span>
              <div className="flex -space-x-1">
                {capturedBlack.slice(-5).map((p, idx) => (
                  <span key={idx} className="text-base" title={p.type}>
                    {p.type === 'queen' ? '♛' : p.type === 'rook' ? '♜' : p.type === 'bishop' ? '♝' : p.type === 'knight' ? '♞' : '♟'}
                  </span>
                ))}
              </div>
              {capturedBlack.length > 5 && (
                <span className="text-[11px] text-slate-900 font-black font-mono">+{capturedBlack.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Center: Check Warning Banner (Comic Action Style) */}
        {isCheck && (
          <div className="animate-bounce flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500 text-white font-['Bangers'] text-lg sm:text-xl tracking-wider shadow-[4px_4px_0px_#000] border-3 border-black">
            <span>⚠️</span>
            <span>ŠACH! KRÁL V OHROŽENÍ!</span>
          </div>
        )}

        {/* Right: Install button on mobile & Title Home */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          <button
            onClick={onReturnToTitle}
            className="p-2.5 rounded-xl bg-white hover:bg-yellow-200 border-3 border-black text-slate-950 shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Návrat do hlavního menu"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comic Speech Bubble (Living character quotes popping up) */}
      <ComicSpeechBubble quote={currentQuote} onDismiss={onDismissQuote} />

      {/* Floating Notifications Area (Comic badges) */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="animate-in fade-in zoom-in-95 duration-200 px-4 py-2 rounded-2xl text-slate-950 font-black text-xs sm:text-sm shadow-[4px_4px_0px_#000] flex items-center gap-2 border-3 border-black"
            style={{ backgroundColor: notif.color || '#facc15' }}
          >
            <span className="text-xl">{notif.emoji}</span>
            <span>{notif.text}</span>
          </div>
        ))}
      </div>

      {/* Emote Picker Popover (Comic Speech Balloons) */}
      {showEmotePicker && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto bg-amber-300 border-4 border-black p-3 rounded-3xl shadow-[6px_6px_0px_#000] flex flex-wrap gap-2 max-w-sm justify-center z-30">
          {emotes.map((em, i) => (
            <button
              key={i}
              onClick={() => {
                onSendEmote(em.emoji, em.text);
                setShowEmotePicker(false);
                soundEngine.playSelect();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-yellow-100 text-xs font-black text-slate-950 border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span className="text-base">{em.emoji}</span>
              <span className="hidden sm:inline">{em.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Unified Bottom Control Dock (Collapsible, Zero Viewport Occlusion) */}
      <div className="w-full flex flex-col items-center pointer-events-auto">
        {/* Toggle Collapse Pill */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3 py-1 rounded-t-xl bg-white hover:bg-yellow-100 border-t-3 border-x-3 border-black text-[11px] font-black text-slate-950 flex items-center gap-1 cursor-pointer transition-all shadow-[2px_2px_0px_#000]"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Zobrazit lištu</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Skrýt lištu (Zen mód)</span>
            </>
          )}
        </button>

        {/* Collapsible Dock */}
        <div
          className={`transition-all duration-300 transform ${
            isDockCollapsed ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          } w-full max-w-xl px-3.5 py-2.5 rounded-2xl bg-white border-3 sm:border-4 border-black shadow-[6px_6px_0px_#000] flex items-center justify-between gap-2`}
        >
          {/* Left: Camera view pills */}
          <div className="flex items-center gap-1 bg-yellow-200 p-1 rounded-xl border-2 border-black">
            <span className="text-[10px] text-slate-950 font-black px-1 hidden sm:inline uppercase">Pohled:</span>
            {(
              [
                { id: 'iso', label: '3D Iso' },
                { id: 'white', label: 'Bílý' },
                { id: 'black', label: 'Černý' },
                { id: 'top', label: 'Shora' },
              ] as const
            ).map((cam) => (
              <button
                key={cam.id}
                onClick={() => {
                  onCameraChange(cam.id);
                  soundEngine.playSelect();
                }}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeCameraView === cam.id
                    ? 'bg-black text-yellow-300 shadow-[1px_1px_0px_#000]'
                    : 'text-slate-800 hover:text-black hover:bg-yellow-300'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Center: Emote & Action Tools */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowEmotePicker(!showEmotePicker)}
              className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-black text-slate-950 shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
              title="Vtipné hlášky a emotikony"
            >
              <Smile className="w-4 h-4 text-slate-950" />
            </button>

            {gameMode !== 'multiplayer' && (
              <button
                onClick={onUndoMove}
                className="p-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 border-2 border-black text-slate-950 shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                title="Vrátit tah (Zpět)"
              >
                <RotateCcw className="w-4 h-4 text-slate-950" />
              </button>
            )}
          </div>

          {/* Right: Audio Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMusic}
              className={`p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer ${
                isMusicOn ? 'bg-purple-400 text-slate-950' : 'bg-slate-200 text-slate-500'
              }`}
              title={isMusicOn ? 'Zastavit hudbu' : 'Pustit hudbu'}
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-lime-400 hover:bg-lime-300 border-2 border-black text-slate-950 shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
              title={isMuted ? 'Zapnout zvuky' : 'Ztlumit zvuky'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-slate-950" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
