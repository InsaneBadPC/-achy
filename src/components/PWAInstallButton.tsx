/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as native app, don't show
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    soundEngine.playSelect();
    const success = await install();
    if (!success && !isInstallable) {
      // If native prompt not ready, inform user
      alert('Pro instalaci otevřete nabídku prohlížeče (tři tečky vpravo nahoře) a zvolte "Přidat na plochu" nebo "Instalovat aplikaci".');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider border-2 sm:border-3 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
        title="Instalovat jako nativní aplikaci do mobilu"
      >
        <Smartphone className="w-4 h-4 text-slate-950 shrink-0" />
        <span className="hidden sm:inline">Instalovat do Mobilu</span>
        <span className="sm:hidden">Instalovat</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-amber-400 border-4 border-black p-6 shadow-[8px_8px_0px_#000] text-slate-950 font-['Fredoka']">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-black uppercase">Instalace na iPhone</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg bg-black text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-semibold mb-4 leading-relaxed">
              1. Klepněte na tlačítko <strong>Sdílet</strong> (čtvereček se šipkou nahoru) v Safari.<br />
              2. Sjeďte dolů a zvolte <strong>Přidat na plochu</strong>.<br />
              3. Spusťte hru z domovské obrazovky bez lišt prohlížeče!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-black text-white font-black text-sm uppercase"
            >
              Rozumím!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
