/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PieceColor,
  Piece,
  FloatingNotification,
  GameMode,
  PieceType,
  GameStyle,
} from '../types/game';
import { CharacterQuote } from '../game/characterQuotes';
import { ComicSpeechBubble } from './ComicSpeechBubble';
import { PWAInstallButton } from './PWAInstallButton';
import { soundEngine } from '../audio/soundEngine';
import { voiceEngine } from '../audio/voiceEngine';
import { BattlefieldState, BattlefieldMapId } from '../types/battlefield';
import { BATTLEFIELD_MAPS } from '../game/battlefieldData';
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
  RefreshCw,
  Sparkles,
  Mountain,
  Mic,
  MicOff,
  Info,
  Target,
  DoorClosed,
  X,
  Castle,
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
  isVoiceOn: boolean;
  isAiThinking: boolean;
  myColor?: PieceColor;
  gameStyle?: 'classic' | 'battlefield';
  battlefieldState?: BattlefieldState | null;
  activeSpecialTargeting?: 'katapult' | 'zavreni_brany' | null;
  onCameraChange: (view: 'iso' | 'white' | 'black' | 'top') => void;
  onUndoMove: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleVoice: () => void;
  onSendEmote: (emoji: string, text: string) => void;
  onReturnToTitle: () => void;
  onRestartGame: () => void;
  onDismissQuote: () => void;
  onChangeGameMode: (mode: GameMode) => void;
  onChangeArena?: (style: GameStyle, mapId?: BattlefieldMapId) => void;
  onOpenUpdates: () => void;
  onOpenBattlefieldRules?: () => void;
  onTriggerSpecialAction?: (actionId: 'katapult' | 'zavreni_brany') => void;
  onCancelSpecialTargeting?: () => void;
  hasUpdateAvailable?: boolean;
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
  isVoiceOn,
  isAiThinking,
  myColor,
  gameStyle = 'classic',
  battlefieldState,
  activeSpecialTargeting,
  onCameraChange,
  onUndoMove,
  onToggleSound,
  onToggleMusic,
  onToggleVoice,
  onSendEmote,
  onReturnToTitle,
  onRestartGame,
  onDismissQuote,
  onChangeGameMode,
  onChangeArena,
  onOpenUpdates,
  onOpenBattlefieldRules,
  onTriggerSpecialAction,
  onCancelSpecialTargeting,
  hasUpdateAvailable,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  const [isTipDismissed, setIsTipDismissed] = useState(false);
  const [lastTip, setLastTip] = useState<string | null>(null);

  // Auto-dismiss battlefield tip after 5 seconds or when tip changes
  useEffect(() => {
    if (battlefieldState?.activeTip && battlefieldState.activeTip !== lastTip) {
      setLastTip(battlefieldState.activeTip);
      setIsTipDismissed(false);
      const timer = setTimeout(() => {
        setIsTipDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [battlefieldState?.activeTip, lastTip]);

  const emotes = [
    { emoji: '🍌', text: 'Pozor na banán!' },
    { emoji: '😱', text: 'Pomóóóc!' },
    { emoji: '😂', text: 'Haha, to se ti nepovedlo!' },
    { emoji: '👑', text: 'Cesta krále!' },
    { emoji: '💥', text: 'BUM! Překvapení!' },
    { emoji: '🧠', text: 'Geniální tah!' },
  ];

  const pieceSymbols: Record<PieceType, string> = {
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
    king: '♚',
  };

  const bfMapConfig = battlefieldState ? BATTLEFIELD_MAPS[battlefieldState.mapId] : null;

  // Catapult readiness for White
  const isCatapultReady =
    battlefieldState?.mapId === 'oblehani' &&
    currentTurn === 'white' &&
    !battlefieldState.catapultPending &&
    battlefieldState.halfMoveCount >= 10 &&
    (battlefieldState.halfMoveCount % 12 === 0 || battlefieldState.halfMoveCount % 12 >= 10);

  // Gate close readiness for Black
  const isGateCloseReady =
    battlefieldState?.mapId === 'oblehani' &&
    currentTurn === 'black' &&
    !battlefieldState.gateClosed;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5 overflow-hidden font-['Fredoka']">
      {/* Top Bar: Turn status badge, check warning, mode quick-switch, home & updates */}
      <div className="w-full flex items-start justify-between pointer-events-auto gap-2">
        {/* Left: Turn Status & Captured pieces */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white shadow-lg">
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                currentTurn === 'white'
                  ? 'bg-amber-300 border-amber-400 shadow-[0_0_10px_rgba(253,224,71,0.5)]'
                  : 'bg-slate-950 border-slate-700'
              }`}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-wide">
                  {currentTurn === 'white' ? 'Bílý na tahu' : 'Černý na tahu'}
                </span>
                {gameStyle === 'battlefield' && bfMapConfig && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {bfMapConfig.name}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-300">
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
              <span className="ml-1 text-xs font-bold text-amber-400 flex items-center gap-1 animate-pulse">
                <Bot className="w-4 h-4" /> přemýšlí...
              </span>
            )}
          </div>

          {/* Captured pieces bar */}
          <div className="flex items-center gap-2">
            {capturedBlack.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur border border-white/10 text-xs text-white">
                <span className="text-slate-400 font-bold text-[10px] mr-0.5 uppercase">Bílí zajali:</span>
                <div className="flex -space-x-0.5 text-amber-300">
                  {capturedBlack.slice(-6).map((p, idx) => (
                    <span key={idx} className="text-sm font-bold drop-shadow" title={p.type}>
                      {pieceSymbols[p.type]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {capturedWhite.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur border border-white/10 text-xs text-white">
                <span className="text-slate-400 font-bold text-[10px] mr-0.5 uppercase">Černí zajali:</span>
                <div className="flex -space-x-0.5 text-slate-300">
                  {capturedWhite.slice(-6).map((p, idx) => (
                    <span key={idx} className="text-sm font-bold drop-shadow" title={p.type}>
                      {pieceSymbols[p.type]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contextual Tip Banner for Battlefield */}
          {gameStyle === 'battlefield' && battlefieldState?.activeTip && !isTipDismissed && (
            <div className="max-w-md bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-400/40 text-xs text-amber-200 shadow-xl flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">💡</span>
                <span className="leading-tight">{battlefieldState.activeTip}</span>
              </div>
              <button
                onClick={() => {
                  soundEngine.playSelect();
                  setIsTipDismissed(true);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-amber-300/70 hover:text-white cursor-pointer transition-colors shrink-0"
                title="Zavřít nápovědu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Check Warning */}
        {isCheck && (
          <div className="animate-bounce px-4 py-1.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 border-2 border-white text-white font-['Bangers'] text-lg sm:text-2xl tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.7)]">
            POZOR ŠACH!
          </div>
        )}

        {/* Right: Actions, Battlefield Rules Icon, Mode Switch, Home */}
        <div className="flex items-center gap-2">
          {/* Prominent New Game Button */}
          <button
            onClick={() => {
              soundEngine.playSelect();
              onRestartGame();
            }}
            className="px-3 sm:px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 border border-emerald-300 cursor-pointer transition-all active:scale-95"
            title="Začít novou hru od 1. tahu"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span className="font-['Bangers'] tracking-wider uppercase">Nová hra</span>
          </button>
          {/* Battlefield Rules Icon */}
          {gameStyle === 'battlefield' && onOpenBattlefieldRules && (
            <button
              onClick={() => {
                soundEngine.playSelect();
                onOpenBattlefieldRules();
              }}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 border border-amber-300 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              title="Zobrazit pravidla mapy a stav událostí"
            >
              <Info className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Pravidla mapy</span>
            </button>
          )}

          {/* Obléhání Special Actions: Catapult & Gate */}
          {isCatapultReady && onTriggerSpecialAction && (
            <button
              onClick={() => {
                soundEngine.playSelect();
                onTriggerSpecialAction('katapult');
              }}
              className="px-3.5 py-2 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/40 border border-rose-300 cursor-pointer animate-pulse"
              title="Zaměřit katapult na hradbu"
            >
              <Target className="w-4 h-4" />
              <span>Odpálit Katapult!</span>
            </button>
          )}

          {isGateCloseReady && onTriggerSpecialAction && (
            <button
              onClick={() => {
                soundEngine.playSelect();
                onTriggerSpecialAction('zavreni_brany');
              }}
              className="px-3.5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/40 border border-cyan-300 cursor-pointer"
              title="Zavřít volnou bránu (1x za hru)"
            >
              <DoorClosed className="w-4 h-4" />
              <span>Zavřít Bránu</span>
            </button>
          )}

          {/* Mode Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowModeSwitch(!showModeSwitch)}
              className="px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
              title="Přepnout herní mód"
            >
              {gameMode === 'ai' && <Bot className="w-4 h-4 text-amber-400" />}
              {gameMode === 'local' && <Users className="w-4 h-4 text-cyan-400" />}
              {gameMode === 'multiplayer' && <Globe className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline">
                {gameMode === 'ai' ? 'Vs AI' : gameMode === 'local' ? '2 Hráči' : 'Online'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showModeSwitch && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-2.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    soundEngine.playSelect();
                    onRestartGame();
                    setShowModeSwitch(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition-all cursor-pointer mb-1 uppercase tracking-wider font-['Bangers'] text-sm active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restartovat (Nová hra)</span>
                </button>
                <div className="border-t border-white/10 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase">
                  Režim hráčů (Nová hra):
                </span>
                <button
                  onClick={() => {
                    onChangeGameMode('ai');
                    setShowModeSwitch(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    gameMode === 'ai' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>Proti AI (Sólo)</span>
                </button>
                <button
                  onClick={() => {
                    onChangeGameMode('local');
                    setShowModeSwitch(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    gameMode === 'local' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>2 Hráči (1 displej)</span>
                </button>
                <button
                  onClick={() => {
                    onChangeGameMode('multiplayer');
                    setShowModeSwitch(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    gameMode === 'multiplayer' ? 'bg-rose-400 text-slate-950 font-black' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Online Multiplayer</span>
                </button>

                {/* Arena / Battlefield Switcher */}
                <div className="border-t border-white/10 my-1 pt-1.5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 uppercase flex items-center gap-1">
                    <Mountain className="w-3 h-3" /> Výběr arény (Nová hra):
                  </span>
                  <button
                    onClick={() => {
                      onChangeArena?.('battlefield', 'priroda');
                      setShowModeSwitch(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      gameStyle === 'battlefield' && battlefieldState?.mapId === 'priroda'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>🏞️</span>
                    <span>1. Příroda (Záplavy)</span>
                  </button>
                  <button
                    onClick={() => {
                      onChangeArena?.('battlefield', 'prusmyk');
                      setShowModeSwitch(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      gameStyle === 'battlefield' && battlefieldState?.mapId === 'prusmyk'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>🏔️</span>
                    <span>2. Průsmyk (Lávky)</span>
                  </button>
                  <button
                    onClick={() => {
                      onChangeArena?.('battlefield', 'oblehani');
                      setShowModeSwitch(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      gameStyle === 'battlefield' && battlefieldState?.mapId === 'oblehani'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>🏰</span>
                    <span>3. Obléhání (Katapult)</span>
                  </button>
                  <button
                    onClick={() => {
                      onChangeArena?.('classic');
                      setShowModeSwitch(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      gameStyle === 'classic'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>♟️</span>
                    <span>Klasické šachy</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* GitHub Update Notification Pill */}
          <button
            onClick={() => {
              soundEngine.playSelect();
              onOpenUpdates();
            }}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-lg relative ${
              hasUpdateAvailable
                ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-white/15'
            }`}
            title={hasUpdateAvailable ? 'K dispozici je nová verze!' : 'Zkontrolovat aktualizace'}
          >
            <Sparkles className="w-4 h-4" />
            {hasUpdateAvailable && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-950 animate-ping" />
            )}
          </button>

          <PWAInstallButton />

          <button
            onClick={onReturnToTitle}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-white shadow-lg cursor-pointer transition-all"
            title="Návrat do hlavního menu"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Special Targeting Alert Overlay */}
      {activeSpecialTargeting && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-950/95 border-2 border-amber-400 p-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in zoom-in-95">
          <Target className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-xs font-bold text-white">
            {activeSpecialTargeting === 'katapult'
              ? '🎯 Klikni na pole Hradby (#) pro zaměření katapultu!'
              : '🚪 Klikni na volnou Bránu (c6 nebo f6) pro její zavření!'}
          </span>
          {onCancelSpecialTargeting && (
            <button
              onClick={onCancelSpecialTargeting}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Comic Speech Bubble */}
      <ComicSpeechBubble quote={currentQuote} onDismiss={onDismissQuote} />

      {/* Floating Notifications Area */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="animate-in fade-in zoom-in-95 duration-200 px-4 py-2 rounded-2xl text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 border-2 border-black"
            style={{ backgroundColor: notif.color || '#facc15' }}
          >
            <span className="text-xl">{notif.emoji}</span>
            <span>{notif.text}</span>
          </div>
        ))}
      </div>

      {/* Emote Picker Popover */}
      {showEmotePicker && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-white/20 p-3 rounded-3xl shadow-2xl flex flex-wrap gap-2 max-w-sm justify-center z-30">
          {emotes.map((em, i) => (
            <button
              key={i}
              onClick={() => {
                onSendEmote(em.emoji, em.text);
                setShowEmotePicker(false);
                soundEngine.playSelect();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/15 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-base">{em.emoji}</span>
              <span className="hidden sm:inline">{em.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      <div className="w-full flex flex-col items-center pointer-events-auto">
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3.5 py-1 rounded-t-xl bg-slate-900/80 backdrop-blur hover:bg-slate-800 text-[11px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-all border-t border-x border-white/15"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Zobrazit lištu</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Skrýt lištu (Zen mód)</span>
            </>
          )}
        </button>

        <div
          className={`transition-all duration-300 transform ${
            isDockCollapsed ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          } w-full max-w-xl px-4 py-2.5 rounded-3xl bg-slate-900/90 backdrop-blur-md border border-white/15 shadow-2xl flex items-center justify-between gap-2`}
        >
          {/* Camera View Presets */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-bold px-1.5 hidden sm:inline uppercase">
              Pohled:
            </span>
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
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCameraView === cam.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowEmotePicker(!showEmotePicker)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              title="Vtipné hlášky a emotikony"
            >
              <Smile className="w-4 h-4 text-amber-400" />
            </button>

            {gameMode !== 'multiplayer' && (
              <button
                onClick={onUndoMove}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
                title="Vrátit tah (Zpět)"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
              </button>
            )}

            <button
              onClick={() => {
                soundEngine.playSelect();
                onRestartGame();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Začít novou hru od 1. tahu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nová hra</span>
            </button>
          </div>

          {/* Audio & Czech Voice Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleVoice}
              className={`p-2 rounded-xl border border-white/15 transition-all cursor-pointer ${
                isVoiceOn ? 'bg-amber-400/20 text-amber-400' : 'bg-white/5 text-slate-500'
              }`}
              title={isVoiceOn ? 'Vypnout dabované hlasy' : 'Zapnout dabované hlasy'}
            >
              {isVoiceOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggleMusic}
              className={`p-2 rounded-xl border border-white/15 transition-all cursor-pointer ${
                isMusicOn ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-500'
              }`}
              title={isMusicOn ? 'Zastavit hudbu' : 'Pustit hudbu'}
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              title={isMuted ? 'Zapnout zvuky' : 'Ztlumit zvuky'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-lime-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
