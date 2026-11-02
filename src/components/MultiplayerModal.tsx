/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Globe, ArrowRight, Loader2, X, AlertCircle } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHostRoom: () => Promise<string>;
  onJoinRoom: (code: string) => Promise<void>;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onHostRoom,
  onJoinRoom,
}) => {
  const [tab, setTab] = useState<'choose' | 'host' | 'join'>('choose');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const code = await onHostRoom();
      setRoomCode(code.replace('wchess-', ''));
      setTab('host');
      soundEngine.playSelect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se vytvořit místnost';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onJoinRoom(inputCode.trim());
      soundEngine.playSelect();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Chyba při připojování k místnosti';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    soundEngine.playSelect();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-['Fredoka']">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-cyan-400 border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col text-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-black text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase">Online Multiplayer</h2>
              <p className="text-xs font-bold text-slate-900">Souboj na dálku na 2 různých mobilech nebo PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500 text-white border-2 border-black flex items-center gap-2 text-xs font-bold shadow-[2px_2px_0px_#000]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Content */}
        {tab === 'choose' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="p-4 rounded-2xl bg-white hover:bg-yellow-200 border-3 border-black text-left transition-all cursor-pointer flex items-center justify-between shadow-[4px_4px_0px_#000] group active:translate-x-0.5 active:translate-y-0.5"
            >
              <div>
                <h3 className="font-black text-slate-950 text-base mb-0.5 group-hover:text-amber-600 transition-colors">
                  Založit Hru (Hostitel)
                </h3>
                <p className="text-xs font-bold text-slate-700">
                  Vygeneruje 5-místný kód, který pošleš kamarádovi na druhý telefon
                </p>
              </div>
              {isLoading ? (
                <Loader2 className="w-6 h-6 text-black animate-spin" />
              ) : (
                <ArrowRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-all" />
              )}
            </button>

            <button
              onClick={() => {
                setTab('join');
                soundEngine.playSelect();
              }}
              className="p-4 rounded-2xl bg-white hover:bg-cyan-200 border-3 border-black text-left transition-all cursor-pointer flex items-center justify-between shadow-[4px_4px_0px_#000] group active:translate-x-0.5 active:translate-y-0.5"
            >
              <div>
                <h3 className="font-black text-slate-950 text-base mb-0.5 group-hover:text-cyan-700 transition-colors">
                  Připojit se ke Kódu (Host)
                </h3>
                <p className="text-xs font-bold text-slate-700">
                  Zadej kód od soupeře a naskoč do rozehrané bitvy
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        )}

        {tab === 'host' && (
          <div className="flex flex-col items-center text-center py-2">
            <span className="text-xs text-slate-900 mb-2 uppercase tracking-wider font-black">
              Tvůj Kód Místnosti:
            </span>

            <div className="flex items-center gap-2 mb-4 p-3 rounded-2xl bg-white border-4 border-black shadow-[4px_4px_0px_#000]">
              <span className="text-3xl sm:text-4xl font-['Bangers'] tracking-widest text-slate-950 px-3">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0px_#000]"
                title="Kopírovat kód"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-700" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-950 font-bold mb-6 animate-pulse bg-white/70 px-4 py-2 rounded-full border-2 border-black">
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Čeká se na připojení druhého hráče...</span>
            </div>

            <button
              onClick={() => setTab('choose')}
              className="text-xs font-black text-slate-950 hover:underline cursor-pointer"
            >
              ← Zpět na výběr
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-black text-slate-950 mb-1.5 block uppercase">
                Zadej 5-místný kód místnosti:
              </label>
              <input
                type="text"
                placeholder="např. XY78Z"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full px-4 py-3 rounded-2xl bg-white border-3 border-black text-slate-950 font-['Bangers'] text-2xl text-center tracking-widest focus:outline-none focus:ring-4 focus:ring-yellow-400 shadow-[3px_3px_0px_#000]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleJoin}
                disabled={isLoading || !inputCode.trim()}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Připojit se ke Hře!</span>}
              </button>
              <button
                onClick={() => setTab('choose')}
                className="py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-sm font-black border-3 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                Zpět
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
