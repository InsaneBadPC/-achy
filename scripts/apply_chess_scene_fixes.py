import os

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scene_path = os.path.join(REPO_DIR, 'src', 'three', 'ChessScene.tsx')

with open(scene_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Mount detached highlight, trap, item, particle groups to scene
old_mount = '''    // Initial base board setup
    const boardCtx = createChessboard(theme);
    scene.add(boardCtx.boardGroup);
    boardCtxRef.current = boardCtx;'''

new_mount = '''    // Initial base board setup
    const boardCtx = createChessboard(theme);
    scene.add(boardCtx.boardGroup);
    scene.add(boardCtx.highlightGroup);
    scene.add(boardCtx.trapsGroup);
    scene.add(boardCtx.itemsGroup);
    scene.add(boardCtx.particleGroup);
    scene.add(boardCtx.checkRingMesh);
    boardCtxRef.current = boardCtx;'''

content = content.replace(old_mount, new_mount)

# 2. Replace handlePointerDown with pointerdown/pointerup drag vs tap and piece raycasting
old_pointer_block = '''    const handlePointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      if (flyInStateRef.current.active) {
        flyInStateRef.current.active = false;
        if (controlsRef.current && cameraRef.current) {
          controlsRef.current.enabled = true;
          cameraRef.current.position.copy(flyInStateRef.current.endPos);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        onFlyInFinishedRef.current?.();
      }

      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);

      // Check hits on active board group
      const targetGroup = bfCtxRef.current ? bfCtxRef.current.containerGroup : boardCtx.boardGroup;
      const intersects = _raycaster.intersectObjects(targetGroup.children, true);
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== targetGroup) {
          if (curr.userData && curr.userData.isSquare) {
            onSquareClickRef.current(curr.userData.row, curr.userData.col);
            return;
          }
          curr = curr.parent;
        }
      }

      // Fallback intersection with Y plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();
      if (_raycaster.ray.intersectPlane(plane, intersectionPoint)) {
        const sq = worldToSquare(intersectionPoint.x, intersectionPoint.z);
        if (sq) {
          onSquareClickRef.current(sq.row, sq.col);
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);'''

new_pointer_block = '''    let pointerDownPos: { x: number; y: number; time: number } | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerDownPos = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0 || !pointerDownPos) return;

      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);
      const elapsed = Date.now() - pointerDownPos.time;
      pointerDownPos = null;

      // Filter out camera orbit rotation or drag (threshold 12px or hold > 700ms)
      if (dist > 12 || elapsed > 700) {
        return;
      }

      // Tap to skip camera fly-in
      if (flyInStateRef.current.active) {
        flyInStateRef.current.active = false;
        if (controlsRef.current && cameraRef.current) {
          controlsRef.current.enabled = true;
          cameraRef.current.position.copy(flyInStateRef.current.endPos);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        onFlyInFinishedRef.current?.();
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);

      // Check hits on active pieces and active board tiles
      const pieceObjects = Array.from(piecesMapRef.current.values());
      const targetGroup = bfCtxRef.current ? bfCtxRef.current.containerGroup : boardCtx.boardGroup;
      const candidateObjects = [...pieceObjects, ...targetGroup.children];

      const intersects = _raycaster.intersectObjects(candidateObjects, true);
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== scene) {
          if (
            curr.userData &&
            curr.userData.isPiece &&
            curr.userData.row !== undefined &&
            curr.userData.col !== undefined
          ) {
            onSquareClickRef.current(curr.userData.row, curr.userData.col);
            return;
          }
          if (
            curr.userData &&
            curr.userData.isSquare &&
            curr.userData.row !== undefined &&
            curr.userData.col !== undefined
          ) {
            onSquareClickRef.current(curr.userData.row, curr.userData.col);
            return;
          }
          curr = curr.parent;
        }
      }

      // Fallback intersection with Y plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();
      if (_raycaster.ray.intersectPlane(plane, intersectionPoint)) {
        const sq = worldToSquare(intersectionPoint.x, intersectionPoint.z);
        if (sq) {
          onSquareClickRef.current(sq.row, sq.col);
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointerup', handlePointerUp);'''

content = content.replace(old_pointer_block, new_pointer_block)

# 3. Clean up pointerup listener in unmount
old_clean = '''      domElem.removeEventListener('pointerdown', handlePointerDown);'''
new_clean = '''      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointerup', handlePointerUp);'''
content = content.replace(old_clean, new_clean)

# 4. Clear pieces on arena/gameStyle switch
old_arena_effect = '''  // Manage Battlefield vs Classic 3D Board
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (gameStyle === 'battlefield' && battlefieldState) {'''

new_arena_effect = '''  // Manage Battlefield vs Classic 3D Board
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Reset piece models on arena switch so they freshly anchor to new elevations
    piecesMapRef.current.forEach((model) => {
      scene.remove(model);
    });
    piecesMapRef.current.clear();

    if (gameStyle === 'battlefield' && battlefieldState) {'''

content = content.replace(old_arena_effect, new_arena_effect)

# 5. Piece synchronization, userData setting, snapping to board square when not hopping
old_piece_loop = '''        if (!model) {
          model = createCharacterModel(piece.type, piece.color, piece.id);
          const worldPos = squareToWorld(r, c);
          model.position.set(worldPos.x, surfaceY, worldPos.z);
          scene.add(model);
          piecesMap.set(piece.id, model);
        }

        updateCharacterState(model, piece);

        if (
          lastMove &&
          lastMove !== prevLastMoveRef.current &&
          lastMove.piece.id === piece.id
        ) {
          const worldTarget = squareToWorld(r, c);
          const dist = Math.hypot(
            model.position.x - worldTarget.x,
            model.position.z - worldTarget.z
          );

          if (dist > 0.05) {
            if (lastMove.effect === 'hammer_smash') {
              animManager.animateHammerSmash(model, r, c);
            } else if (lastMove.effect === 'rocket_jump') {
              animManager.animateRocketJump(model, r, c);
            } else if (lastMove.effect === 'lightning_strike') {
              animManager.animateLightningStrike(model, r, c);
            } else if (lastMove.effect === 'shield_block' && lastMove.attackTarget) {
              animManager.animateBump(model, lastMove.attackTarget.row, lastMove.attackTarget.col);
            } else if (lastMove.trapTriggered) {
              if (lastMove.trapTriggered.type === 'banana') {
                animManager.animateBananaSlip(model, r, c);
              } else if (lastMove.trapTriggered.type === 'spring') {
                animManager.animateSpringLaunch(model, r, c);
              } else if (lastMove.trapTriggered.type === 'teleport') {
                animManager.animateTeleport(model, r, c);
              } else {
                animManager.animateHop(model, r, c);
              }
            } else {
              animManager.animateHop(model, r, c);
            }
          }
        } else {
          // Adjust vertical height on terrain updates
          model.position.y = surfaceY;
        }'''

new_piece_loop = '''        const worldTarget = squareToWorld(r, c);

        if (!model) {
          model = createCharacterModel(piece.type, piece.color, piece.id);
          model.position.set(worldTarget.x, surfaceY, worldTarget.z);
          scene.add(model);
          piecesMap.set(piece.id, model);
        }

        // Keep userData strictly in sync with board coordinates for raycasting
        model.userData.row = r;
        model.userData.col = c;
        model.userData.isPiece = true;
        model.userData.pieceId = piece.id;

        updateCharacterState(model, piece);

        if (
          lastMove &&
          lastMove !== prevLastMoveRef.current &&
          lastMove.piece.id === piece.id
        ) {
          const dist = Math.hypot(
            model.position.x - worldTarget.x,
            model.position.z - worldTarget.z
          );

          if (dist > 0.05) {
            if (lastMove.effect === 'hammer_smash') {
              animManager.animateHammerSmash(model, r, c);
            } else if (lastMove.effect === 'rocket_jump') {
              animManager.animateRocketJump(model, r, c);
            } else if (lastMove.effect === 'lightning_strike') {
              animManager.animateLightningStrike(model, r, c);
            } else if (lastMove.effect === 'shield_block' && lastMove.attackTarget) {
              animManager.animateBump(model, lastMove.attackTarget.row, lastMove.attackTarget.col);
            } else if (lastMove.trapTriggered) {
              if (lastMove.trapTriggered.type === 'banana') {
                animManager.animateBananaSlip(model, r, c);
              } else if (lastMove.trapTriggered.type === 'spring') {
                animManager.animateSpringLaunch(model, r, c);
              } else if (lastMove.trapTriggered.type === 'teleport') {
                animManager.animateTeleport(model, r, c);
              } else {
                animManager.animateHop(model, r, c);
              }
            } else {
              animManager.animateHop(model, r, c);
            }
          }
        } else {
          // Snap piece to exact board coordinates if not animating a hop
          model.position.set(worldTarget.x, surfaceY, worldTarget.z);
        }'''

content = content.replace(old_piece_loop, new_piece_loop)

# 6. Capture cleanup - unset userData.isPiece
old_capture = '''    // Handle captures
    piecesMap.forEach((model, id) => {
      if (!currentPieceIds.has(id)) {'''

new_capture = '''    // Handle captures
    piecesMap.forEach((model, id) => {
      if (!currentPieceIds.has(id)) {
        model.userData.isPiece = false;
        model.userData.row = undefined;
        model.userData.col = undefined;'''

content = content.replace(old_capture, new_capture)

# 7. Highlight position update in battlefield & danger ring
old_highlight_effect = '''  // Update Highlights
  useEffect(() => {
    if (!boardCtxRef.current) return;
    updateHighlights(boardCtxRef.current, selectedSquare, legalMoves, lastMove);

    // Adjust highlight meshes Y position if on battlefield
    if (gameStyle === 'battlefield' && battlefieldState && boardCtxRef.current) {
      boardCtxRef.current.highlightGroup.children.forEach((child) => {
        const sq = worldToSquare(child.position.x, child.position.z);
        if (sq) {
          const sy = getTileSurfaceY(battlefieldState, sq.row, sq.col);
          child.position.y = sy + 0.05;
        }
      });
    }
  }, [selectedSquare, legalMoves, lastMove, gameStyle, battlefieldState]);'''

new_highlight_effect = '''  // Update Highlights
  useEffect(() => {
    if (!boardCtxRef.current) return;
    updateHighlights(boardCtxRef.current, selectedSquare, legalMoves, lastMove);

    // Adjust highlight meshes Y position if on battlefield
    if (gameStyle === 'battlefield' && battlefieldState && boardCtxRef.current) {
      boardCtxRef.current.highlightGroup.children.forEach((child) => {
        if (child.userData && child.userData.row !== undefined && child.userData.col !== undefined) {
          const sy = getTileSurfaceY(battlefieldState, child.userData.row, child.userData.col);
          child.position.y = sy + 0.06;
        } else {
          const sq = worldToSquare(child.position.x, child.position.z);
          if (sq) {
            const sy = getTileSurfaceY(battlefieldState, sq.row, sq.col);
            child.position.y = sy + 0.06;
          }
        }
      });
    }

    // King check danger ring
    if (isCheck && boardCtxRef.current) {
      const kingPos = findKing(board, currentTurn);
      if (kingPos) {
        const worldPos = squareToWorld(kingPos.row, kingPos.col);
        const sy =
          gameStyle === 'battlefield' && battlefieldState
            ? getTileSurfaceY(battlefieldState, kingPos.row, kingPos.col)
            : 0;
        boardCtxRef.current.checkRingMesh.position.set(worldPos.x, sy + 0.06, worldPos.z);
        (boardCtxRef.current.checkRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
      }
    } else if (boardCtxRef.current) {
      (boardCtxRef.current.checkRingMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }, [selectedSquare, legalMoves, lastMove, gameStyle, battlefieldState, isCheck, currentTurn, board]);'''

content = content.replace(old_highlight_effect, new_highlight_effect)

with open(scene_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)
print("Updated ChessScene.tsx")
