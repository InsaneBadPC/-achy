/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import rawData from './battlefieldData.json';
import {
  BattlefieldMapConfig,
  BattlefieldMapId,
  TerrainType,
  BattlefieldState,
} from '../types/battlefield';

export const BATTLEFIELD_GLOBAL_RULES = rawData.globalRules;
export const TERRAIN_TYPES: Record<string, TerrainType> = rawData.terrainTypes as any;
export const BATTLEFIELD_MAPS: Record<BattlefieldMapId, BattlefieldMapConfig> = {
  priroda: rawData.maps[0] as BattlefieldMapConfig,
  prusmyk: rawData.maps[1] as BattlefieldMapConfig,
  oblehani: rawData.maps[2] as BattlefieldMapConfig,
};

export function squareToCoords(square: string): { row: number; col: number } {
  const col = square.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1...
  const rank = parseInt(square[1], 10);
  const row = 8 - rank; // '8' -> 0, '1' -> 7
  return { row, col };
}

export function coordsToSquare(row: number, col: number): string {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

export function createInitialBattlefieldState(mapId: BattlefieldMapId): BattlefieldState {
  const config = BATTLEFIELD_MAPS[mapId];
  if (!config) throw new Error(`Unknown mapId: ${mapId}`);

  // Parse layout grid (8 strings of 8 chars)
  const grid: string[][] = [];
  for (let r = 0; r < 8; r++) {
    const rowStr = config.layout[r];
    grid[r] = [];
    for (let c = 0; c < 8; c++) {
      const char = rowStr[c];
      const sq = coordsToSquare(r, c);
      // Check tile overrides
      if (config.tileOverrides && config.tileOverrides[sq]) {
        grid[r][c] = config.tileOverrides[sq].baseTerrain;
      } else if (char === '*') {
        grid[r][c] = '.';
      } else {
        grid[r][c] = char;
      }
    }
  }

  return {
    mapId,
    halfMoveCount: 0,
    grid,
    isFloodActive: false,
    floodWarning: false,
    isTrapActive: false,
    trapWarning: false,
    catapultCharge: mapId === 'oblehani' ? 0 : 0,
    catapultPending: null,
    gateClosed: false,
    immobilizedPieces: {},
    activeTip:
      mapId === 'oblehani'
        ? 'Dobýváš pevnost! Bílý musí dát mat do 60 půltahů, černý brání.'
        : `Vítej na mapě ${config.name} (${config.subtitle})! Klepni na ℹ️ pro pravidla mapy.`,
  };
}

export function getTerrainAt(state: BattlefieldState, row: number, col: number): TerrainType {
  const char = state.grid[row]?.[col] || '.';
  // Check active flood
  if (state.mapId === 'priroda' && state.isFloodActive) {
    const sq = coordsToSquare(row, col);
    if (['d4', 'e4', 'd5', 'e5'].includes(sq)) {
      return TERRAIN_TYPES['~'];
    }
  }

  // Check active ramp trap
  if (state.mapId === 'prusmyk' && state.isTrapActive) {
    const sq = coordsToSquare(row, col);
    if (['c4', 'c5', 'f4', 'f5'].includes(sq)) {
      return TERRAIN_TYPES['^'];
    }
  }

  return TERRAIN_TYPES[char] || TERRAIN_TYPES['.'];
}

export function getHeightAt(state: BattlefieldState, row: number, col: number): number {
  const terrain = getTerrainAt(state, row, col);
  return terrain.height !== null ? terrain.height : 0;
}

