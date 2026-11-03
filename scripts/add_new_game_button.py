#!/usr/bin/env python3
"""
Add prominent 'Nová hra' button to top bar, bottom dock, and mode dropdown.
"""
import os

path = r"c:\Users\insane\Documents\sachy\repo\src\components\GameHUD.tsx"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add 'Nová hra' button in the top right bar right after Pravidla mapy / special action
old_top_bar = """        {/* Right: Actions, Battlefield Rules Icon, Mode Switch, Home */}
        <div className="flex items-center gap-2">"""

new_top_bar = """        {/* Right: Actions, Battlefield Rules Icon, Mode Switch, Home */}
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
          </button>"""

assert old_top_bar in text, "old_top_bar not found!"
text = text.replace(old_top_bar, new_top_bar, 1)

# 2. Add New Game button at the very top of the Mode Switch dropdown
old_dropdown_head = """            {showModeSwitch && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-2.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95">"""

new_dropdown_head = """            {showModeSwitch && (
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
                <div className="border-t border-white/10 mb-1" />"""

assert old_dropdown_head in text, "old_dropdown_head not found!"
text = text.replace(old_dropdown_head, new_dropdown_head, 1)

# 3. Enhance button in bottom dock
old_dock_restart = """            <button
              onClick={onRestartGame}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              title="Restartovat hru"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>"""

new_dock_restart = """            <button
              onClick={() => {
                soundEngine.playSelect();
                onRestartGame();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Začít novou hru od 1. tahu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nová hra</span>
            </button>"""

assert old_dock_restart in text, "old_dock_restart not found!"
text = text.replace(old_dock_restart, new_dock_restart, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Added 'Nová hra' button in GameHUD.tsx successfully")
