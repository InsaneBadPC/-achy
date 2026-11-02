/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppReleaseInfo } from '../services/updateService';
import { Download, RefreshCw, X, Sparkles, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-['Fredoka']">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400/50 shadow-[0_20px_60px_rgba(245,158,11,0.25)] text-white flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </span>
            <div>
              <h3 className="font-['Bangers'] text-2xl tracking-wider uppercase leading-none text-amber-400">
                Aktualizace Aplikace
              </h3>
              <span className="text-xs font-medium text-slate-400">
                Nainstalovaná verze: <strong className="text-white">v{releaseInfo?.currentVersion || '1.0.5'}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playSelect();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {hasUpdate ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-400/40 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                  🎉 Nová verze připravena!
                </span>
                <span className="font-mono font-black text-sm bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg shadow">
                  v{releaseInfo?.latestVersion}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-300 leading-relaxed">
                Na GitHubu bylo dokončeno nové automatické sestavení s vyšším číslem verze. Stáhněte a nainstalujte si aktualizovaný balíček.
              </p>
              {releaseInfo?.releaseNotes && (
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-[11px] font-medium text-slate-300 max-h-28 overflow-y-auto whitespace-pre-line">
                  {releaseInfo.releaseNotes}
                </div>
              )}
            </div>

            <a
              href={releaseInfo.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundEngine.playVictory()}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 font-['Bangers'] text-xl tracking-wider uppercase text-center text-slate-950 shadow-[0_8px_25px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>STÁHNOUT AKTUALIZACI (APK)</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shadow-inner">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Máte nejnovější verzi!</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                Vaše aplikace <strong className="text-amber-300">v{releaseInfo?.currentVersion || '1.0.5'}</strong> je plně aktuální. Každé nové sestavení na GitHubu automaticky navýší verzi a ihned vám nabídne aktualizaci.
              </p>
            </div>
          </div>
        )}

        {/* Refresh Check Button */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={() => {
              soundEngine.playSelect();
              onCheckAgain();
            }}
            disabled={isChecking}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/15 cursor-pointer disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Kontroluji GitHub...' : 'Zkontrolovat aktualizace'}</span>
          </button>

          <a
            href="https://github.com/InsaneBadPC/-achy/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>GitHub Releases</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
