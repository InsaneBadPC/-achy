#!/usr/bin/env python3
"""
Add arena switching and auto-dismiss fly-in banner.
"""
import os

REPO_DIR = r"c:\Users\insane\Documents\sachy\repo"

def update_game_hud():
    path = os.path.join(REPO_DIR, "src", "components", "GameHUD.tsx")
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    # 1. Imports
    text = text.replace(
        "import { BattlefieldState } from '../types/battlefield';",
        "import { BattlefieldState, BattlefieldMapId, GameStyle } from '../types/battlefield';"
    )
    text = text.replace(
        "  Sparkles,",
        "  Sparkles,\n  Mountain,"
    )

    # 2. Props
    text = text.replace(
        "  onChangeGameMode: (mode: GameMode) => void;",
        "  onChangeGameMode: (mode: GameMode) => void;\n  onChangeArena?: (style: GameStyle, mapId?: BattlefieldMapId) => void;"
    )

    # 3. Component destructuring
    text = text.replace(
        "  onChangeGameMode,",
        "  onChangeGameMode,\n  onChangeArena,"
    )

    # 4. Mode and Arena switcher dropdown
    old_snippet = """            {showModeSwitch && (
              <div className="absolute right-0 top-12 w-48 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-2 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                  Přepnout mód (restartuje hru):
                </span>
                <button
                  onClick={() => {
                    onChangeGameMode('ai');
                    setShowModeSwitch(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    gameMode === 'multiplayer' ? 'bg-rose-400 text-slate-950 font-black' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Online Multiplayer</span>
                </button>
              </div>
            )}"""

    new_snippet = """            {showModeSwitch && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-2.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95">
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
            )}"""

    assert old_snippet in text, "old_snippet not found in GameHUD.tsx!"
    text = text.replace(old_snippet, new_snippet, 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated GameHUD.tsx successfully")

def update_app():
    path = os.path.join(REPO_DIR, "src", "App.tsx")
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    # 1. Add timer for isFlyInActive auto-dismiss
    timer_code = """  // Auto-dismiss fly-in intro banner after 2 seconds
  useEffect(() => {
    if (isFlyInActive) {
      const timer = setTimeout(() => {
        setIsFlyInActive(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isFlyInActive]);
"""
    if "Auto-dismiss fly-in intro banner" not in text:
        text = text.replace(
            "  const [isFlyInActive, setIsFlyInActive] = useState<boolean>(false);",
            "  const [isFlyInActive, setIsFlyInActive] = useState<boolean>(false);\n" + timer_code
        )

    # 2. Make fly-in banner clickable to dismiss immediately
    old_banner = """      {/* Cinematic Fly-In Intro Banner */}
      {isFlyInActive && screen === 'playing' && (
        <div className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-center animate-in zoom-in-75 fade-in duration-300">
          <div className="rotate-[-2deg] bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-['Bangers'] text-4xl sm:text-6xl tracking-wider px-8 py-3.5 rounded-3xl border-3 border-black shadow-[0_15px_40px_rgba(245,158,11,0.5)]">
            {gameStyle === 'battlefield'
              ? `⚔️ BOJIŠTĚ: ${BATTLEFIELD_MAPS[battlefieldMapId]?.name.toUpperCase()}! ⚔️`
              : '⚔️ BITVA ZAČÍNÁ! ⚔️'}
          </div>
          <span className="text-white font-bold text-xs sm:text-sm uppercase bg-black/80 px-4 py-1.5 rounded-full mt-3 border border-white/20 animate-pulse">
            Přílet na šachovnici... (Klepnutím přeskočíte)
          </span>
        </div>
      )}"""

    new_banner = """      {/* Cinematic Fly-In Intro Banner (Click anywhere to dismiss or auto-hides) */}
      {isFlyInActive && screen === 'playing' && (
        <div
          onClick={() => {
            soundEngine.playSelect();
            setIsFlyInActive(false);
          }}
          className="fixed inset-0 z-40 cursor-pointer flex flex-col items-center justify-center animate-in zoom-in-75 fade-in duration-300 select-none bg-black/30 pointer-events-auto"
        >
          <div className="rotate-[-2deg] bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-['Bangers'] text-4xl sm:text-6xl tracking-wider px-8 py-3.5 rounded-3xl border-3 border-black shadow-[0_15px_40px_rgba(245,158,11,0.5)] active:scale-95 transition-transform">
            {gameStyle === 'battlefield'
              ? `⚔️ BOJIŠTĚ: ${BATTLEFIELD_MAPS[battlefieldMapId]?.name.toUpperCase()}! ⚔️`
              : '⚔️ BITVA ZAČÍNÁ! ⚔️'}
          </div>
          <span className="text-white font-bold text-xs sm:text-sm uppercase bg-black/80 px-4 py-1.5 rounded-full mt-3 border border-white/20 animate-pulse">
            Přílet na šachovnici... (Klepnutím přeskočíte)
          </span>
        </div>
      )}"""

    assert old_banner in text, "old_banner not found in App.tsx!"
    text = text.replace(old_banner, new_banner, 1)

    # 3. Add onChangeArena in GameHUD props in App.tsx
    old_hud_call = """          onChangeGameMode={(newMode) => {
            if (newMode === 'multiplayer') {
              setIsMultiplayerOpen(true);
            } else {
              startNewGame(newMode, aiDifficulty, theme, gameStyle, battlefieldMapId);
            }
          }}"""

    new_hud_call = """          onChangeGameMode={(newMode) => {
            if (newMode === 'multiplayer') {
              setIsMultiplayerOpen(true);
            } else {
              startNewGame(newMode, aiDifficulty, theme, gameStyle, battlefieldMapId);
            }
          }}
          onChangeArena={(style, mapId) => {
            startNewGame(gameMode, aiDifficulty, theme, style, mapId);
          }}"""

    assert old_hud_call in text, "old_hud_call not found in App.tsx!"
    text = text.replace(old_hud_call, new_hud_call, 1)

    # 4. SettingsModal theme change restarts game
    old_settings = """        theme={theme}
        onChangeTheme={setTheme}"""

    new_settings = """        theme={theme}
        onChangeTheme={(newTheme) => {
          setTheme(newTheme);
          startNewGame(gameMode, aiDifficulty, newTheme, gameStyle, battlefieldMapId);
        }}"""

    assert old_settings in text, "old_settings not found in App.tsx!"
    text = text.replace(old_settings, new_settings, 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated App.tsx successfully")

if __name__ == "__main__":
    update_game_hud()
    update_app()
    print("All mode and banner updates completed!")
