/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createWaterTexture } from './proceduralTextures';
import { BattlefieldState } from '../types/battlefield';
import { getTerrainAt, getHeightAt, coordsToSquare } from '../game/battlefieldData';
import { TILE_SIZE, BOARD_OFFSET, squareToWorld } from './boardRenderer';
import { BOARD_SIZE } from '../game/chessLogic';

export interface BattlefieldMeshContext {
  containerGroup: THREE.Group;
  terrainMeshes: THREE.Mesh[][];
  decorGroup: THREE.Group;
  hazardsGroup: THREE.Group;
  waterGroup: THREE.Group;
  targetReticleMesh: THREE.Mesh | null;
}

export function getTileSurfaceY(state: BattlefieldState, row: number, col: number): number {
  const terrain = getTerrainAt(state, row, col);
  if (terrain.id === 'river') return -0.02;
  if (terrain.id === 'wall') return 0.75;
  const h = terrain.height || 0;
  if (h === 2) return 0.70;
  if (h === 1) return 0.36;
  return 0.04;
}

export function createBattlefieldBoard(state: BattlefieldState): BattlefieldMeshContext {
  const containerGroup = new THREE.Group();
  containerGroup.name = 'battlefield_board';

  const terrainMeshes: THREE.Mesh[][] = [];
  const decorGroup = new THREE.Group();
  decorGroup.name = 'decorations';
  const hazardsGroup = new THREE.Group();
  hazardsGroup.name = 'hazards';
  const waterGroup = new THREE.Group();
  waterGroup.name = 'water';

  containerGroup.add(decorGroup);
  containerGroup.add(hazardsGroup);
  containerGroup.add(waterGroup);

  // Outer cliff base / diorama foundation
  const baseGeom = new THREE.BoxGeometry(
    BOARD_SIZE * TILE_SIZE + 1.2,
    0.6,
    BOARD_SIZE * TILE_SIZE + 1.2
  );
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.1,
  });
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.y = -0.3;
  baseMesh.receiveShadow = true;
  containerGroup.add(baseMesh);

  // Materials for different terrain types
  const matPlainLight = new THREE.MeshStandardMaterial({
    color: 0x4ade80, // Lush cartoon grass
    roughness: 0.5,
  });
  const matPlainDark = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.5,
  });

  const matHillLight = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Stone hill
    roughness: 0.6,
  });
  const matHillDark = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.6,
  });

  const matPlateau = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Citadel gold/orange sandstone
    roughness: 0.4,
    metalness: 0.2,
  });

  const waterTex = createWaterTexture();
  const matRiver = new THREE.MeshStandardMaterial({
    map: waterTex,
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.15,
    transparent: true,
    opacity: 0.94,
    depthWrite: true,
  });

  const matRiverBed = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Dark stone riverbed beneath water
    roughness: 0.9,
  });

  const matBridge = new THREE.MeshStandardMaterial({
    color: 0x854d0e, // Wood planks
    roughness: 0.7,
  });

  const matWall = new THREE.MeshStandardMaterial({
    color: 0x475569, // Stone fortress
    roughness: 0.7,
    metalness: 0.3,
  });

  const matGate = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Reinforced wood/iron
    roughness: 0.5,
    metalness: 0.4,
  });

  const matFord = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9, // Shallow water with stones
    roughness: 0.3,
    metalness: 0.3,
  });

  const matSpike = new THREE.MeshStandardMaterial({
    color: 0x334155, // Metal spike tile
    roughness: 0.3,
    metalness: 0.8,
  });

  // Build each square
  for (let r = 0; r < BOARD_SIZE; r++) {
    terrainMeshes[r] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const terrain = getTerrainAt(state, r, c);
      const isLight = (r + c) % 2 === 0;
      const pos = squareToWorld(r, c);

      let tileMesh: THREE.Mesh;

      if (terrain.id === 'river') {
        // 1. Dark riverbed base underneath to prevent z-fighting with foundation
        const bedGeom = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
        const bedMesh = new THREE.Mesh(bedGeom, matRiverBed);
        bedMesh.position.set(pos.x, -0.01, pos.z);
        decorGroup.add(bedMesh);

        // 2. Crystal animated water surface safely elevated above riverbed (y=0.025)
        const waterGeom = new THREE.BoxGeometry(TILE_SIZE - 0.01, 0.04, TILE_SIZE - 0.01);
        tileMesh = new THREE.Mesh(waterGeom, matRiver);
        tileMesh.position.set(pos.x, 0.025, pos.z);
        waterGroup.add(tileMesh);
      } else if (terrain.id === 'bridge') {
        // Bridge over water
        const bridgeGeom = new THREE.BoxGeometry(TILE_SIZE - 0.05, 0.12, TILE_SIZE - 0.05);
        tileMesh = new THREE.Mesh(bridgeGeom, matBridge);
        tileMesh.position.set(pos.x, 0.06, pos.z);

        // Bridge railings
        const railGeom = new THREE.BoxGeometry(0.08, 0.18, TILE_SIZE);
        const railLeft = new THREE.Mesh(railGeom, matWall);
        railLeft.position.set(pos.x - TILE_SIZE / 2 + 0.06, 0.16, pos.z);
        const railRight = railLeft.clone();
        railRight.position.x = pos.x + TILE_SIZE / 2 - 0.06;
        decorGroup.add(railLeft);
        decorGroup.add(railRight);
      } else if (terrain.id === 'wall') {
        // High stone battlement
        const wallGeom = new THREE.BoxGeometry(TILE_SIZE - 0.04, 0.85, TILE_SIZE - 0.04);
        tileMesh = new THREE.Mesh(wallGeom, matWall);
        tileMesh.position.set(pos.x, 0.42, pos.z);

        // Crenellations
        for (let i = -1; i <= 1; i += 2) {
          const crenGeom = new THREE.BoxGeometry(0.24, 0.18, 0.24);
          const cren = new THREE.Mesh(crenGeom, matWall);
          cren.position.set(pos.x + i * 0.35, 0.92, pos.z);
          decorGroup.add(cren);
        }
      } else if (terrain.id === 'gate') {
        // Gate structure
        const gateBase = new THREE.BoxGeometry(TILE_SIZE - 0.04, 0.36, TILE_SIZE - 0.04);
        tileMesh = new THREE.Mesh(gateBase, matGate);
        tileMesh.position.set(pos.x, 0.18, pos.z);

        // Gate pillars and arch
        const pillarGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 12);
        const p1 = new THREE.Mesh(pillarGeom, matWall);
        p1.position.set(pos.x - 0.45, 0.45, pos.z);
        const p2 = p1.clone();
        p2.position.x = pos.x + 0.45;
        decorGroup.add(p1);
        decorGroup.add(p2);
      } else if (terrain.height === 2) {
        // High Citadel Plateau (height 2)
        const platGeom = new THREE.BoxGeometry(TILE_SIZE - 0.02, 0.7, TILE_SIZE - 0.02);
        tileMesh = new THREE.Mesh(platGeom, matPlateau);
        tileMesh.position.set(pos.x, 0.35, pos.z);

        // Gold trim
        const trimGeom = new THREE.RingGeometry(0.35, 0.45, 24);
        const trimMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide });
        const trim = new THREE.Mesh(trimGeom, trimMat);
        trim.rotation.x = -Math.PI / 2;
        trim.position.set(pos.x, 0.705, pos.z);
        decorGroup.add(trim);
      } else if (terrain.height === 1) {
        // Hill / Ruin / Parapet (height 1)
        const hillGeom = new THREE.BoxGeometry(TILE_SIZE - 0.02, 0.36, TILE_SIZE - 0.02);
        tileMesh = new THREE.Mesh(hillGeom, isLight ? matHillLight : matHillDark);
        tileMesh.position.set(pos.x, 0.18, pos.z);
      } else if (terrain.id === 'ford') {
        // Ford (shallow water)
        const fordGeom = new THREE.BoxGeometry(TILE_SIZE - 0.02, 0.08, TILE_SIZE - 0.02);
        tileMesh = new THREE.Mesh(fordGeom, matFord);
        tileMesh.position.set(pos.x, 0.04, pos.z);

        // Stepping pebbles
        for (let i = 0; i < 3; i++) {
          const pebbleGeom = new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.05);
          const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
          const pebble = new THREE.Mesh(pebbleGeom, pebbleMat);
          pebble.position.set(pos.x + (i - 1) * 0.28, 0.08, pos.z + (Math.random() - 0.5) * 0.3);
          decorGroup.add(pebble);
        }
      } else if (terrain.id === 'spike') {
        // Spike tile
        const spikeBaseGeom = new THREE.BoxGeometry(TILE_SIZE - 0.02, 0.08, TILE_SIZE - 0.02);
        tileMesh = new THREE.Mesh(spikeBaseGeom, matSpike);
        tileMesh.position.set(pos.x, 0.04, pos.z);

        // 3D hazard cones
        for (let sx = -1; sx <= 1; sx += 2) {
          for (let sz = -1; sz <= 1; sz += 2) {
            const coneGeom = new THREE.ConeGeometry(0.08, 0.22, 8);
            const coneMat = new THREE.MeshStandardMaterial({
              color: 0xef4444,
              metalness: 0.8,
              roughness: 0.2,
            });
            const cone = new THREE.Mesh(coneGeom, coneMat);
            cone.position.set(pos.x + sx * 0.25, 0.18, pos.z + sz * 0.25);
            hazardsGroup.add(cone);
          }
        }
      } else {
        // Plain grass
        const plainGeom = new THREE.BoxGeometry(TILE_SIZE - 0.02, 0.08, TILE_SIZE - 0.02);
        tileMesh = new THREE.Mesh(plainGeom, isLight ? matPlainLight : matPlainDark);
        tileMesh.position.set(pos.x, 0.04, pos.z);

        // If forest, add cute trees!
        if (terrain.id === 'forest') {
          // Tree 1
          const trunkGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 8);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
          const trunk = new THREE.Mesh(trunkGeom, trunkMat);
          trunk.position.set(pos.x - 0.18, 0.2, pos.z - 0.18);

          const leavesGeom = new THREE.ConeGeometry(0.24, 0.45, 8);
          const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
          const leaves = new THREE.Mesh(leavesGeom, leavesMat);
          leaves.position.set(pos.x - 0.18, 0.45, pos.z - 0.18);
          decorGroup.add(trunk);
          decorGroup.add(leaves);

          // Tree 2
          const trunk2 = trunk.clone();
          trunk2.position.set(pos.x + 0.2, 0.18, pos.z + 0.15);
          const leaves2 = leaves.clone();
          leaves2.position.set(pos.x + 0.2, 0.42, pos.z + 0.15);
          decorGroup.add(trunk2);
          decorGroup.add(leaves2);
        }
      }

      tileMesh.receiveShadow = true;
      tileMesh.userData = { row: r, col: c, isSquare: true };
      if (terrain.id !== 'river') {
        containerGroup.add(tileMesh);
      }
      terrainMeshes[r][c] = tileMesh;
    }
  }

  // Catapult target reticle
  let targetReticleMesh: THREE.Mesh | null = null;
  if (state.catapultPending) {
    const reticleGeom = new THREE.RingGeometry(0.3, 0.5, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
    });
    targetReticleMesh = new THREE.Mesh(reticleGeom, reticleMat);
    targetReticleMesh.rotation.x = -Math.PI / 2;
    const p = squareToWorld(state.catapultPending.row, state.catapultPending.col);
    targetReticleMesh.position.set(p.x, 0.85, p.z);
    containerGroup.add(targetReticleMesh);
  }

  return {
    containerGroup,
    terrainMeshes,
    decorGroup,
    hazardsGroup,
    waterGroup,
    targetReticleMesh,
  };
}

