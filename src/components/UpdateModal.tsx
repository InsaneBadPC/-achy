/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppReleaseInfo } from '../services/updateService';
import { Download, RefreshCw, X, Sparkles, CheckCircle, ExternalLink } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseInfo: AppReleaseInfo | null;
  isChecking: boolean;
  onCheckAgain: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  releaseInfo,
  isChecking,
  onCheckAgain,
}) => {
  if (!isOpen) return null;

  const hasUpdate = releaseInfo?.hasUpdate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-['Fredoka']">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-amber-400 border-4 border-black shadow-[8px_8px_0px_#000] text-slate-950 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-3 border-black">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-950 text-amber-400 border-2 border-black">
              <Sparkles className="w-5 h-5 fill-amber-400" />
            </span>
            <div>
              <h3 className="font-['Bangers'] text-2xl tracking-wider uppercase leading-none">
                Aktualizace Aplikace
              </h3>
              <span className="text-xs font-bold text-slate-800">
                Aktuální verze v mobilu: v{releaseInfo?.currentVersion || '1.0.4'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playSelect();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-black text-white hover:bg-slate-800 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {hasUpdate ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-white border-3 border-black shadow-[3px_3px_0px_#000] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-600 uppercase bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-400">
                  🎉 K dispozici je novější verze!
                </span>
                <span className="font-mono font-black text-sm bg-black text-amber-400 px-2 py-0.5 rounded-md">
                  v{releaseInfo?.latestVersion}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                Nové sestavení obsahuje opravy chyb, vyšší verzi balíčku a vylepšení pro Android.
              </p>
              {releaseInfo?.releaseNotes && (
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-[11px] font-semibold text-slate-700 max-h-24 overflow-y-auto">
                  {releaseInfo.releaseNotes}
                </div>
              )}
            </div>

            <a
              href={releaseInfo.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundEngine.playVictory()}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 border-3 border-black font-['Bangers'] text-xl tracking-wider uppercase text-center text-slate-950 shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>STÁHNOUT NOVOU VERZI (APK)</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="p-4 rounded-full bg-emerald-400 border-3 border-black shadow-[3px_3px_0px_#000]">
              <CheckCircle className="w-10 h-10 text-slate-950" />
            </div>
            <div>
              <h4 className="font-black text-base text-slate-950">Máte nejnovější verzi!</h4>
              <p className="text-xs font-semibold text-slate-800 max-w-xs mt-1">
                Vaše aplikace v{releaseInfo?.currentVersion || '1.0.4'} je aktuální. Každé nové sestavení na GitHubu automaticky navýší verzi a zobrazí zde nabídku ke stažení.
              </p>
            </div>
          </div>
        )}

        {/* Refresh Check Button */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-black/20">
          <button
            onClick={() => {
              soundEngine.playSelect();
              onCheckAgain();
            }}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-yellow-100 text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Ověřuji...' : 'Zkontrolovat znovu'}</span>
          </button>

          <a
            href="https://github.com/insanebad2/-achy/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-black text-slate-900 hover:underline"
          >
            <span>GitHub Releases</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
