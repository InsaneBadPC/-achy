/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Piece,
  PieceColor,
  Trap,
  BonusItem,
  BoardTheme,
  Move,
} from '../types/game';
import {
  createChessboard,
  updateHighlights,
  updateTraps,
  updateBonusItems,
  squareToWorld,
  worldToSquare,
  BoardMeshContext,
  spawnConfettiBurst,
} from './boardRenderer';
import { createCharacterModel, updateCharacterState } from './characterFactory';
import { AnimationManager } from './animationManager';
import { findKing } from '../game/chessLogic';

interface ChessSceneProps {
  board: (Piece | null)[][];
  selectedSquare: { row: number; col: number } | null;
  legalMoves: { row: number; col: number }[];
  lastMove: Move | null;
  traps: Trap[];
  bonusItems: BonusItem[];
  currentTurn: PieceColor;
  theme: BoardTheme;
  isCheck: boolean;
  winner: PieceColor | 'draw' | null;
  activeCameraView: 'iso' | 'white' | 'black' | 'top';
  isFlyInActive?: boolean;
  onFlyInFinished?: () => void;
  onSquareClick: (row: number, col: number) => void;
}

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _targetCameraPos = new THREE.Vector3();
const _targetCameraLookAt = new THREE.Vector3(0, 0, 0);

export const ChessScene: React.FC<ChessSceneProps> = ({
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  traps,
  bonusItems,
  currentTurn,
  theme,
  isCheck,
  winner,
  activeCameraView,
  isFlyInActive = false,
  onFlyInFinished,
  onSquareClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const onSquareClickRef = useRef(onSquareClick);
  onSquareClickRef.current = onSquareClick;

  const onFlyInFinishedRef = useRef(onFlyInFinished);
  onFlyInFinishedRef.current = onFlyInFinished;

  const flyInStateRef = useRef<{
    active: boolean;
    progress: number;
    duration: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
  }>({
    active: false,
    progress: 0,
    duration: 1.8,
    startPos: new THREE.Vector3(-14, 20, 20),
    endPos: new THREE.Vector3(0, 10.5, 9.5),
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boardCtxRef = useRef<BoardMeshContext | null>(null);
  const piecesMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const animManagerRef = useRef<AnimationManager>(new AnimationManager());
  const prevLastMoveRef = useRef<Move | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const bgColors: Record<BoardTheme, number> = {
      royal_wood: 0x0f172a,
      volcano_dungeon: 0x180907,
      magic_crystal: 0x082f49,
      cyber_neon: 0x030712,
      pirate_island: 0x042f2e,
      candy_land: 0x500724,
      space_station: 0x020617,
      spooky_graveyard: 0x170b2a,
    };

    const bgColor = bgColors[theme] || 0x0f172a;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(scene.background, 11, 27);
    sceneRef.current = scene;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 10.5, 9.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 5;
    controls.maxDistance = 22;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    dirLight.position.set(6, 14, 8);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    const d = 7;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-8, 6, -8);
    scene.add(rimLight);

    const boardCtx = createChessboard(theme);
    scene.add(boardCtx.boardGroup);
    boardCtxRef.current = boardCtx;

    const handlePointerDown = (e: MouseEvent) => {
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

      // Check intersections with board squares
      const intersects = _raycaster.intersectObjects(boardCtx.boardGroup.children, true);
      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData && obj.userData.isSquare) {
            onSquareClickRef.current(obj.userData.row, obj.userData.col);
            return;
          }
          obj = obj.parent;
        }
      }

      // Check intersections with piece meshes
      const pieceObjects: THREE.Object3D[] = [];
      piecesMapRef.current.forEach((model) => pieceObjects.push(model));
      const pieceHits = _raycaster.intersectObjects(pieceObjects, true);
      if (pieceHits.length > 0) {
        let cur: THREE.Object3D | null = pieceHits[0].object;
        while (cur) {
          if (cur.userData && cur.userData.pieceId) {
            const sq = worldToSquare(cur.position.x, cur.position.z);
            if (sq) {
              onSquareClickRef.current(sq.row, sq.col);
            }
            return;
          }
          cur = cur.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let lastTime = performance.now();
    let elapsedTime = 0;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsedTime += dt;
      const time = elapsedTime;

      const flyIn = flyInStateRef.current;
      if (flyIn && flyIn.active) {
        flyIn.progress += dt / flyIn.duration;
        if (flyIn.progress >= 1) {
          flyIn.progress = 1;
          flyIn.active = false;
          controls.enabled = true;
          camera.position.copy(flyIn.endPos);
          controls.target.set(0, 0, 0);
          controls.update();
          onFlyInFinishedRef.current?.();
        } else {
          const p = flyIn.progress;
          const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          camera.position.lerpVectors(flyIn.startPos, flyIn.endPos, ease);
          camera.position.y += Math.sin(p * Math.PI) * 2.2;
          camera.lookAt(0, 0, 0);
        }
      } else {
        controls.update();
      }

      const animManager = animManagerRef.current;
      if (animManager.cameraShakeTime > 0) {
        const intensity = animManager.cameraShakeIntensity;
        camera.position.x += (Math.random() - 0.5) * intensity;
        camera.position.y += (Math.random() - 0.5) * intensity;
      }

      animManager.update(dt, piecesMapRef.current, boardCtx.particleGroup, time);

      boardCtx.itemsGroup.children.forEach((itGroup) => {
        const { baseY, rotSpeed, phase } = itGroup.userData;
        itGroup.position.y = baseY + Math.sin(time * 3 + phase) * 0.08;
        itGroup.rotation.y += dt * (rotSpeed || 2);
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  // Handle Camera Fly-in & View Presets
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (activeCameraView === 'iso') {
      _targetCameraPos.set(0, 10.5, 9.5);
    } else if (activeCameraView === 'white') {
      _targetCameraPos.set(0, 7.5, 7.5);
    } else if (activeCameraView === 'black') {
      _targetCameraPos.set(0, 7.5, -7.5);
    } else if (activeCameraView === 'top') {
      _targetCameraPos.set(0, 14, 0.01);
    }

    if (isFlyInActive) {
      const startPos = new THREE.Vector3(-14, 21, 20);
      camera.position.copy(startPos);
      camera.lookAt(0, 0, 0);
      controls.enabled = false;

      flyInStateRef.current = {
        active: true,
        progress: 0,
        duration: 1.8,
        startPos,
        endPos: _targetCameraPos.clone(),
      };
      return;
    }

    if (!flyInStateRef.current.active) {
      camera.position.copy(_targetCameraPos);
      controls.target.copy(_targetCameraLookAt);
      controls.update();
    }
  }, [activeCameraView, isFlyInActive]);

  // Synchronize 3D Pieces with React Board State & trigger move animations
  useEffect(() => {
    const scene = sceneRef.current;
    const boardCtx = boardCtxRef.current;
    if (!scene || !boardCtx) return;

    const piecesMap = piecesMapRef.current;
    const animManager = animManagerRef.current;
    const currentPieceIds = new Set<string>();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        currentPieceIds.add(piece.id);

        let model = piecesMap.get(piece.id);

        if (!model) {
          model = createCharacterModel(piece.type, piece.color, piece.id);
          const worldPos = squareToWorld(r, c);
          model.position.set(worldPos.x, 0, worldPos.z);
          scene.add(model);
          piecesMap.set(piece.id, model);
        }

        updateCharacterState(model, piece);

        // Check if last move animated this piece
        if (
          lastMove &&
          lastMove !== prevLastMoveRef.current &&
          lastMove.piece.id === piece.id
        ) {
          const worldTarget = squareToWorld(r, c);
          const dist = Math.hypot(model.position.x - worldTarget.x, model.position.z - worldTarget.z);

          if (dist > 0.05) {
            if (lastMove.effect === 'hammer_smash') {
              animManager.animateHammerSmash(model, r, c);
            } else if (lastMove.effect === 'rocket_jump') {
              animManager.animateRocketJump(model, r, c);
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
        }
      }
    }

    // Handle captures
    piecesMap.forEach((model, id) => {
      if (!currentPieceIds.has(id)) {
        spawnConfettiBurst(boardCtx, {
          x: model.position.x,
          y: model.position.y + 0.5,
          z: model.position.z,
        });

        animManager.animateCaptureKnockback(model, () => {
          scene.remove(model);
          piecesMap.delete(id);
        });
      }
    });

    prevLastMoveRef.current = lastMove;
  }, [board, lastMove]);

  // Update Highlights
  useEffect(() => {
    if (!boardCtxRef.current) return;
    updateHighlights(boardCtxRef.current, selectedSquare, legalMoves, lastMove);
  }, [selectedSquare, legalMoves, lastMove]);

  // Update Traps
  useEffect(() => {
    if (!boardCtxRef.current) return;
    updateTraps(boardCtxRef.current, traps);
  }, [traps]);

  // Update Bonus Items
  useEffect(() => {
    if (!boardCtxRef.current) return;
    updateBonusItems(boardCtxRef.current, bonusItems);
  }, [bonusItems]);

  // King Check Indicator
  useEffect(() => {
    const boardCtx = boardCtxRef.current;
    if (!boardCtx) return;

    if (isCheck) {
      const kingPos = findKing(board, currentTurn);
      if (kingPos) {
        const pos = squareToWorld(kingPos.row, kingPos.col);
        boardCtx.checkRingMesh.position.set(pos.x, 0.09, pos.z);
        (boardCtx.checkRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
        return;
      }
    }
    (boardCtx.checkRingMesh.material as THREE.MeshBasicMaterial).opacity = 0;
  }, [isCheck, currentTurn, board]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
    />
  );
};
