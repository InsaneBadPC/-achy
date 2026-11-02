/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BOARD_SIZE } from '../game/chessLogic';
import { Trap, BonusItem, BoardTheme } from '../types/game';
import {
  createBoardSquareTexture,
  createTrapGlyphTexture,
  createItemCoinTexture,
} from './proceduralTextures';

export interface BoardMeshContext {
  boardGroup: THREE.Group;
  squareMeshes: THREE.Mesh[][];
  highlightGroup: THREE.Group;
  trapsGroup: THREE.Group;
  itemsGroup: THREE.Group;
  particleGroup: THREE.Group;
  checkRingMesh: THREE.Mesh;
}

export const TILE_SIZE = 1.2;
export const BOARD_OFFSET = (BOARD_SIZE * TILE_SIZE) / 2 - TILE_SIZE / 2;

export function squareToWorld(row: number, col: number): { x: number; z: number } {
  return {
    x: col * TILE_SIZE - BOARD_OFFSET,
    z: row * TILE_SIZE - BOARD_OFFSET,
  };
}

export function worldToSquare(x: number, z: number): { row: number; col: number } | null {
  const col = Math.round((x + BOARD_OFFSET) / TILE_SIZE);
  const row = Math.round((z + BOARD_OFFSET) / TILE_SIZE);
  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
    return { row, col };
  }
  return null;
}

export function createChessboard(theme: BoardTheme = 'royal_wood'): BoardMeshContext {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'chessboard';

  const squareMeshes: THREE.Mesh[][] = [];

  // Table / border frame colors per theme
  const themeColors: Record<BoardTheme, { frame: number; trim: number }> = {
    royal_wood: { frame: 0x451a03, trim: 0xf59e0b },
    volcano_dungeon: { frame: 0x18181b, trim: 0xf97316 },
    magic_crystal: { frame: 0x0c4a6e, trim: 0x38bdf8 },
    cyber_neon: { frame: 0x020617, trim: 0xd946ef },
    pirate_island: { frame: 0x3d2314, trim: 0x14b8a6 },
    candy_land: { frame: 0x831843, trim: 0xf43f5e },
    space_station: { frame: 0x0f172a, trim: 0x4ade80 },
    spooky_graveyard: { frame: 0x1e1b4b, trim: 0xa855f7 },
  };

  const currentThemeCol = themeColors[theme] || themeColors.royal_wood;

  const frameGeom = new THREE.BoxGeometry(
    BOARD_SIZE * TILE_SIZE + 0.8,
    0.4,
    BOARD_SIZE * TILE_SIZE + 0.8
  );
  const frameMat = new THREE.MeshStandardMaterial({
    color: currentThemeCol.frame,
    roughness: 0.4,
    metalness: 0.2,
  });
  const frame = new THREE.Mesh(frameGeom, frameMat);
  frame.position.y = -0.2;
  frame.receiveShadow = true;
  boardGroup.add(frame);

  // Bold trim edge around frame
  const trimGeom = new THREE.BoxGeometry(
    BOARD_SIZE * TILE_SIZE + 0.85,
    0.05,
    BOARD_SIZE * TILE_SIZE + 0.85
  );
  const trimMat = new THREE.MeshStandardMaterial({
    color: currentThemeCol.trim,
    roughness: 0.2,
    metalness: 0.8,
  });
  const trim = new THREE.Mesh(trimGeom, trimMat);
  trim.position.y = 0.01;
  boardGroup.add(trim);

  // Individual squares with procedural textures
  const lightTexture = createBoardSquareTexture(true, theme);
  const darkTexture = createBoardSquareTexture(false, theme);

  const lightSquareMat = new THREE.MeshStandardMaterial({
    map: lightTexture,
    roughness: 0.4,
    metalness: 0.1,
  });
  const darkSquareMat = new THREE.MeshStandardMaterial({
    map: darkTexture,
    roughness: 0.4,
    metalness: 0.1,
  });

  const squareGeom = new THREE.BoxGeometry(TILE_SIZE - 0.02, 0.08, TILE_SIZE - 0.02);

  for (let r = 0; r < BOARD_SIZE; r++) {
    squareMeshes[r] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const isLight = (r + c) % 2 === 0;
      const mesh = new THREE.Mesh(squareGeom, isLight ? lightSquareMat : darkSquareMat);
      const pos = squareToWorld(r, c);
      mesh.position.set(pos.x, 0.04, pos.z);
      mesh.receiveShadow = true;
      mesh.userData = { row: r, col: c, isSquare: true };
      boardGroup.add(mesh);
      squareMeshes[r][c] = mesh;
    }
  }

  // Highlight overlays group
  const highlightGroup = new THREE.Group();
  highlightGroup.name = 'highlights';
  boardGroup.add(highlightGroup);

  // Traps group
  const trapsGroup = new THREE.Group();
  trapsGroup.name = 'traps';
  boardGroup.add(trapsGroup);

  // Items group
  const itemsGroup = new THREE.Group();
  itemsGroup.name = 'bonusItems';
  boardGroup.add(itemsGroup);

  // Particle effects group
  const particleGroup = new THREE.Group();
  particleGroup.name = 'particles';
  boardGroup.add(particleGroup);

  // King check danger ring
  const checkRingGeom = new THREE.RingGeometry(0.45, 0.58, 32);
  const checkRingMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  const checkRingMesh = new THREE.Mesh(checkRingGeom, checkRingMat);
  checkRingMesh.rotation.x = -Math.PI / 2;
  checkRingMesh.position.y = 0.09;
  boardGroup.add(checkRingMesh);

  return {
    boardGroup,
    squareMeshes,
    highlightGroup,
    trapsGroup,
    itemsGroup,
    particleGroup,
    checkRingMesh,
  };
}

// Update Highlights (Selected square, legal moves, last move)
export function updateHighlights(
  ctx: BoardMeshContext,
  selected: { row: number; col: number } | null,
  legalMoves: { row: number; col: number }[],
  lastMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null
) {
  // Clear previous highlights
  while (ctx.highlightGroup.children.length > 0) {
    const child = ctx.highlightGroup.children[0];
    ctx.highlightGroup.remove(child);
  }

  // Selected square highlight (Golden glowing square)
  if (selected) {
    const selGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95);
    const selMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const selMesh = new THREE.Mesh(selGeom, selMat);
    selMesh.rotation.x = -Math.PI / 2;
    const pos = squareToWorld(selected.row, selected.col);
    selMesh.position.set(pos.x, 0.088, pos.z);
    ctx.highlightGroup.add(selMesh);
  }

  // Legal moves highlights (Cute emerald discs / rings)
  const discGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24);
  const ringGeom = new THREE.RingGeometry(0.38, 0.48, 24);

  const moveDiscMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.65,
  });

  const attackRingMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
  });

  legalMoves.forEach((m) => {
    const pos = squareToWorld(m.row, m.col);
    // Move indicator
    const mesh = new THREE.Mesh(discGeom, moveDiscMat);
    mesh.position.set(pos.x, 0.09, pos.z);
    ctx.highlightGroup.add(mesh);

    // Subtle outline ring
    const ring = new THREE.Mesh(ringGeom, attackRingMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.091, pos.z);
    ctx.highlightGroup.add(ring);
  });

  // Last move indicators
  if (lastMove) {
    const lastMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const trailGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9);

    const fromPos = squareToWorld(lastMove.from.row, lastMove.from.col);
    const fromMesh = new THREE.Mesh(trailGeom, lastMat);
    fromMesh.rotation.x = -Math.PI / 2;
    fromMesh.position.set(fromPos.x, 0.085, fromPos.z);
    ctx.highlightGroup.add(fromMesh);

    const toPos = squareToWorld(lastMove.to.row, lastMove.to.col);
    const toMesh = new THREE.Mesh(trailGeom, lastMat);
    toMesh.rotation.x = -Math.PI / 2;
    toMesh.position.set(toPos.x, 0.085, toPos.z);
    ctx.highlightGroup.add(toMesh);
  }
}

// Render Traps on the board
export function updateTraps(ctx: BoardMeshContext, traps: Trap[]) {
  while (ctx.trapsGroup.children.length > 0) {
    const child = ctx.trapsGroup.children[0];
    ctx.trapsGroup.remove(child);
  }

  const decalGeom = new THREE.PlaneGeometry(0.75, 0.75);

  traps.forEach((trap) => {
    const texture = createTrapGlyphTexture(trap.type, trap.revealed);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: trap.revealed ? 0.9 : 0.6,
    });
    const decal = new THREE.Mesh(decalGeom, mat);
    decal.rotation.x = -Math.PI / 2;
    const pos = squareToWorld(trap.row, trap.col);
    decal.position.set(pos.x, 0.086, pos.z);
    decal.userData = { trap };
    ctx.trapsGroup.add(decal);
  });
}

// Render Floating Bonus Items
export function updateBonusItems(ctx: BoardMeshContext, items: BonusItem[]) {
  while (ctx.itemsGroup.children.length > 0) {
    const child = ctx.itemsGroup.children[0];
    ctx.itemsGroup.remove(child);
  }

  items.forEach((item) => {
    const group = new THREE.Group();
    group.name = item.id;
    const pos = squareToWorld(item.row, item.col);
    group.position.set(pos.x, 0.5, pos.z);
    group.userData = {
      baseY: 0.5,
      rotSpeed: 2.2,
      phase: Math.random() * Math.PI * 2,
    };

    // Golden Coin Disc
    const coinGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24);
    const coinTexture = createItemCoinTexture(item.type);
    const coinMat = new THREE.MeshStandardMaterial({
      map: coinTexture,
      roughness: 0.2,
      metalness: 0.8,
    });
    const coinMesh = new THREE.Mesh(coinGeom, coinMat);
    coinMesh.rotation.x = Math.PI / 2;
    group.add(coinMesh);

    // Glowing sparkle halo
    const haloGeom = new THREE.TorusGeometry(0.36, 0.02, 8, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.8,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    ctx.itemsGroup.add(group);
  });
}

// Procedural Confetti & Comic Sparkle Burst
export function spawnConfettiBurst(ctx: BoardMeshContext, pos: { x: number; y: number; z: number }) {
  const count = 30;
  const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0xa855f7];
  const confettiGeom = new THREE.PlaneGeometry(0.08, 0.08);

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });
    const p = new THREE.Mesh(confettiGeom, mat);
    p.position.set(pos.x, pos.y + 0.3, pos.z);

    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    const upSpeed = 2 + Math.random() * 3;

    p.userData = {
      vx: Math.cos(angle) * speed,
      vy: upSpeed,
      vz: Math.sin(angle) * speed,
      rotX: Math.random() * 10,
      rotY: Math.random() * 10,
      life: 1.0,
      decay: 0.8 + Math.random() * 0.4,
    };

    ctx.particleGroup.add(p);
  }
}
