import os
import re

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1. Update characterFactory.ts
char_path = os.path.join(REPO_DIR, 'src', 'three', 'characterFactory.ts')
with open(char_path, 'r', encoding='utf-8') as f:
    char_content = f.read()

# Add isPiece: true to root.userData
char_content = char_content.replace(
    '  root.userData = {\n    pieceId,\n    type,\n    color,\n    baseY: 0,',
    '  root.userData = {\n    pieceId,\n    type,\n    color,\n    isPiece: true,\n    baseY: 0,'
)

# Add hitVolume before return root;
if 'hitVolume' not in char_content:
    old_end = '  root.rotation.y = isWhite ? 0 : Math.PI;\n\n  return root;'
    new_end = '''  // Snappy touch / click raycasting hit volume for mobile
  const hitGeom = new THREE.CylinderGeometry(0.48, 0.48, 2.2, 12);
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitVolume = new THREE.Mesh(hitGeom, hitMat);
  hitVolume.position.y = 1.1;
  hitVolume.name = 'hitVolume';
  root.add(hitVolume);

  root.rotation.y = isWhite ? 0 : Math.PI;

  return root;'''
    char_content = char_content.replace(old_end, new_end)

with open(char_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(char_content)
print("Updated characterFactory.ts")

# 2. Update boardRenderer.ts
board_path = os.path.join(REPO_DIR, 'src', 'three', 'boardRenderer.ts')
with open(board_path, 'r', encoding='utf-8') as f:
    board_content = f.read()

# Detach highlightGroup, trapsGroup, itemsGroup, particleGroup, checkRingMesh from boardGroup
board_content = board_content.replace('  highlightGroup.name = \'highlights\';\n  boardGroup.add(highlightGroup);', '  highlightGroup.name = \'highlights\';')
board_content = board_content.replace('  trapsGroup.name = \'traps\';\n  boardGroup.add(trapsGroup);', '  trapsGroup.name = \'traps\';')
board_content = board_content.replace('  itemsGroup.name = \'bonusItems\';\n  boardGroup.add(itemsGroup);', '  itemsGroup.name = \'bonusItems\';')
board_content = board_content.replace('  particleGroup.name = \'particles\';\n  boardGroup.add(particleGroup);', '  particleGroup.name = \'particles\';')
board_content = board_content.replace('  checkRingMesh.position.y = 0.09;\n  boardGroup.add(checkRingMesh);', '  checkRingMesh.position.y = 0.09;')

# Add userData to highlight meshes
board_content = board_content.replace(
    '    selMesh.position.set(pos.x, 0.088, pos.z);\n    ctx.highlightGroup.add(selMesh);',
    '    selMesh.position.set(pos.x, 0.088, pos.z);\n    selMesh.userData = { row: selected.row, col: selected.col, isSquare: true };\n    ctx.highlightGroup.add(selMesh);'
)

board_content = board_content.replace(
    '    mesh.position.set(pos.x, 0.09, pos.z);\n    ctx.highlightGroup.add(mesh);\n\n    // Subtle outline ring\n    const ring = new THREE.Mesh(ringGeom, attackRingMat);\n    ring.rotation.x = -Math.PI / 2;\n    ring.position.set(pos.x, 0.091, pos.z);\n    ctx.highlightGroup.add(ring);',
    '    mesh.position.set(pos.x, 0.09, pos.z);\n    mesh.userData = { row: m.row, col: m.col, isSquare: true };\n    ctx.highlightGroup.add(mesh);\n\n    // Subtle outline ring\n    const ring = new THREE.Mesh(ringGeom, attackRingMat);\n    ring.rotation.x = -Math.PI / 2;\n    ring.position.set(pos.x, 0.091, pos.z);\n    ring.userData = { row: m.row, col: m.col, isSquare: true };\n    ctx.highlightGroup.add(ring);'
)

board_content = board_content.replace(
    '    fromMesh.position.set(fromPos.x, 0.085, fromPos.z);\n    ctx.highlightGroup.add(fromMesh);\n\n    const toPos = squareToWorld(lastMove.to.row, lastMove.to.col);\n    const toMesh = new THREE.Mesh(trailGeom, lastMat);\n    toMesh.rotation.x = -Math.PI / 2;\n    toMesh.position.set(toPos.x, 0.085, toPos.z);\n    ctx.highlightGroup.add(toMesh);',
    '    fromMesh.position.set(fromPos.x, 0.085, fromPos.z);\n    fromMesh.userData = { row: lastMove.from.row, col: lastMove.from.col, isSquare: true };\n    ctx.highlightGroup.add(fromMesh);\n\n    const toPos = squareToWorld(lastMove.to.row, lastMove.to.col);\n    const toMesh = new THREE.Mesh(trailGeom, lastMat);\n    toMesh.rotation.x = -Math.PI / 2;\n    toMesh.position.set(toPos.x, 0.085, toPos.z);\n    toMesh.userData = { row: lastMove.to.row, col: lastMove.to.col, isSquare: true };\n    ctx.highlightGroup.add(toMesh);'
)

with open(board_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(board_content)
print("Updated boardRenderer.ts")

# 3. Update App.tsx
app_path = os.path.join(REPO_DIR, 'src', 'App.tsx')
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Castling rook move in executeMove
castling_code = '''      newBoard[to.row][to.col] = pieceCopy;
      newBoard[from.row][from.col] = null;

      // Handle Castling: moving King 2 squares sideways relocates corresponding Rook
      if (movingPiece.type === 'king' && Math.abs(to.col - from.col) === 2) {
        if (to.col === 6) {
          // Kingside castling: move rook from col 7 to col 5
          const rook = newBoard[to.row][7];
          if (rook) {
            newBoard[to.row][5] = { ...rook, row: to.row, col: 5, hasMoved: true };
            newBoard[to.row][7] = null;
          }
        } else if (to.col === 2) {
          // Queenside castling: move rook from col 0 to col 3
          const rook = newBoard[to.row][0];
          if (rook) {
            newBoard[to.row][3] = { ...rook, row: to.row, col: 3, hasMoved: true };
            newBoard[to.row][0] = null;
          }
        }
      }'''

if 'Handle Castling: moving King 2 squares sideways' not in app_content:
    app_content = app_content.replace(
        '      newBoard[to.row][to.col] = pieceCopy;\n      newBoard[from.row][from.col] = null;',
        castling_code
    )

# Fix intrusive fly-in intro banner in App.tsx
old_banner = '''      {/* Cinematic Fly-In Intro Banner (Click anywhere to dismiss or auto-hides) */}
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
      )}'''

new_banner = '''      {/* Cinematic Fly-In Intro Banner (Sleek non-blocking top toast) */}
      {isFlyInActive && screen === 'playing' && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center justify-center animate-in slide-in-from-top fade-in duration-300 select-none"
        >
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 font-['Bangers'] text-2xl sm:text-4xl tracking-wider px-6 py-2.5 rounded-2xl border-2 border-black shadow-[0_8px_30px_rgba(245,158,11,0.5)]">
            {gameStyle === 'battlefield'
              ? `⚔️ BOJIŠTĚ: ${BATTLEFIELD_MAPS[battlefieldMapId]?.name.toUpperCase()}! ⚔️`
              : '⚔️ BITVA ZAČÍNÁ! ⚔️'}
          </div>
        </div>
      )}'''

app_content = app_content.replace(old_banner, new_banner)

with open(app_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(app_content)
print("Updated App.tsx")
