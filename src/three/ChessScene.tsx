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
import { BattlefieldState } from '../types/battlefield';
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
import {
  createBattlefieldBoard,
  getTileSurfaceY,
  BattlefieldMeshContext,
} from './battlefieldRenderer';
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
  gameStyle?: 'classic' | 'battlefield';
  battlefieldState?: BattlefieldState | null;
  activeSpecialTargeting?: 'katapult' | 'zavreni_brany' | null;
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
  gameStyle = 'classic',
  battlefieldState,
  activeSpecialTargeting,
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
  const bfCtxRef = useRef<BattlefieldMeshContext | null>(null);
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
    renderer.toneMappingExposure = 1.25;
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
    scene.fog = new THREE.Fog(scene.background, 35, 90);
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
    controls.minDistance = 4;
    controls.maxDistance = 32;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    dirLight.position.set(6, 16, 8);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 40;
    const d = 9;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-8, 8, -8);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfef08a, 0.6);
    fillLight.position.set(0, -6, 0);
    scene.add(fillLight);

    // Initial base board setup
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
    domElem.addEventListener('pointerdown', handlePointerDown);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Camera fly-in animation
      if (flyInStateRef.current.active) {
        flyInStateRef.current.progress += delta / flyInStateRef.current.duration;
        const t = Math.min(1, flyInStateRef.current.progress);
        const ease = 1 - Math.pow(1 - t, 3);
        camera.position.lerpVectors(flyInStateRef.current.startPos, flyInStateRef.current.endPos, ease);
        camera.lookAt(0, 0, 0);

        if (t >= 1) {
          flyInStateRef.current.active = false;
          controls.enabled = true;
          controls.target.set(0, 0, 0);
          controls.update();
          onFlyInFinishedRef.current?.();
        }
      } else {
        controls.update();
      }

      // Update particle and character animations
      animManagerRef.current.update(delta, piecesMapRef.current, boardCtx.particleGroup, elapsed);

      // Keep status badges facing the camera
      piecesMapRef.current.forEach((model) => {
        const badge = model.getObjectByName('statusBadge');
        if (badge) {
          badge.quaternion.copy(camera.quaternion);
        }
      });

      // Subtle water ripple animation on battlefield
      if (bfCtxRef.current) {
        bfCtxRef.current.waterGroup.children.forEach((wMesh, i) => {
          wMesh.position.y = -0.04 + Math.sin(elapsed * 2 + i * 0.8) * 0.015;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (mountRef.current && domElem.parentNode === mountRef.current) {
        mountRef.current.removeChild(domElem);
      }
    };
  }, [theme]);

  // Manage Battlefield vs Classic 3D Board
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (gameStyle === 'battlefield' && battlefieldState) {
      // Hide flat chessboard, mount rich 3D battlefield terrain
      if (boardCtxRef.current) {
        boardCtxRef.current.boardGroup.visible = false;
      }
      if (bfCtxRef.current) {
        scene.remove(bfCtxRef.current.containerGroup);
      }
      const bfCtx = createBattlefieldBoard(battlefieldState);
      scene.add(bfCtx.containerGroup);
      bfCtxRef.current = bfCtx;
    } else {
      // Classic mode
      if (bfCtxRef.current) {
        scene.remove(bfCtxRef.current.containerGroup);
        bfCtxRef.current = null;
      }
      if (boardCtxRef.current) {
        boardCtxRef.current.boardGroup.visible = true;
      }
    }
  }, [gameStyle, battlefieldState?.mapId, battlefieldState?.halfMoveCount, battlefieldState?.gateClosed]);

  // Camera presets
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;

    switch (activeCameraView) {
      case 'white':
        _targetCameraPos.set(0, 7.5, 9.5);
        break;
      case 'black':
        _targetCameraPos.set(0, 7.5, -9.5);
        break;
      case 'top':
        _targetCameraPos.set(0, 14.5, 0.01);
        break;
      case 'iso':
      default:
        _targetCameraPos.set(0, 10.5, 9.5);
        break;
    }

    if (!isFlyInActive) {
      cameraRef.current.position.copy(_targetCameraPos);
      controls.target.copy(_targetCameraLookAt);
      controls.update();
    }
  }, [activeCameraView, isFlyInActive]);

  // Synchronize 3D Pieces with React Board State
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
        const surfaceY =
          gameStyle === 'battlefield' && battlefieldState
            ? getTileSurfaceY(battlefieldState, r, c)
            : 0;

        if (!model) {
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

        animManager.animateCaptureKnockback(model, lastMove?.piece.type || 'pawn', () => {
          scene.remove(model);
          piecesMap.delete(id);
        });
      }
    });

    prevLastMoveRef.current = lastMove;
  }, [board, lastMove, gameStyle, battlefieldState]);

  // Update Highlights
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
  }, [selectedSquare, legalMoves, lastMove, gameStyle, battlefieldState]);

  // Update Traps
  useEffect(() => {
    if (!boardCtxRef.current) return;
    updateTraps(boardCtxRef.current, traps);
  }, [traps]);

  // Update Bonus Items
  useEffect(() => {
    if (!boardCtxRef.current) return;
    updateBonusItems(boardCtxRef.current, bonusItems);
    if (gameStyle === 'battlefield' && battlefieldState && boardCtxRef.current) {
      boardCtxRef.current.itemsGroup.children.forEach((child) => {
        const sq = worldToSquare(child.position.x, child.position.z);
        if (sq) {
          const sy = getTileSurfaceY(battlefieldState, sq.row, sq.col);
          child.position.y = sy + 0.25;
        }
      });
    }
  }, [bonusItems, gameStyle, battlefieldState]);

  // King Check Indicator
  useEffect(() => {
    const boardCtx = boardCtxRef.current;
    if (!boardCtx) return;

    if (isCheck) {
      const kingPos = findKing(board, currentTurn);
      if (kingPos) {
        const pos = squareToWorld(kingPos.row, kingPos.col);
        const sy =
          gameStyle === 'battlefield' && battlefieldState
            ? getTileSurfaceY(battlefieldState, kingPos.row, kingPos.col)
            : 0;
        boardCtx.checkRingMesh.position.set(pos.x, sy + 0.08, pos.z);
        (boardCtx.checkRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
        return;
      }
    }
    (boardCtx.checkRingMesh.material as THREE.MeshBasicMaterial).opacity = 0;
  }, [isCheck, currentTurn, board, gameStyle, battlefieldState]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
    />
  );
};
