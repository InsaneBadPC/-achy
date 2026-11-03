/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BattlefieldMapId = 'priroda' | 'prusmyk' | 'oblehani';

export type TerrainChar = '.' | '1' | '2' | 'L' | ':' | 'M' | '~' | '#' | 'B' | '^' | '*';

export interface TerrainType {
  id: string;
  name: string;
  height: number | null;
  passable: boolean;
  stopsSlidingPieces: boolean;
  knightCanJumpOver: boolean;
  knightCanLand: boolean;
  floodable?: boolean;
  destructibleByCatapult?: boolean;
  destroyedTerrain?: string;
  closableByDefender?: boolean;
  closedTerrain?: string;
  immobilizesNonKingOnStop?: boolean;
  immobilizeDurationOwnTurns?: number;
  tooltip: string;
}

export interface BattlefieldEventDef {
  id: string;
  name: string;
  intervalHalfMoves: number;
  warningHalfMoves: number;
  durationHalfMoves: number | null;
  targetSquares?: string[];
  alternatingTargetPools?: string[][];
  effect: {
    temporaryTerrain?: string;
    temporaryModifier?: string;
    occupyingPieceSurvives?: boolean;
    occupyingPieceCanLeave?: boolean;
    occupyingPieceGivesCheck?: boolean;
    blockEntryAndPassThrough?: boolean;
    immobilizesOccupyingAndEnteringNonKing?: boolean;
    immobilizedPieceGivesCheck?: boolean;
    spawnUpgradeOnSquares?: boolean;
  };
}

export interface SpecialActionDef {
  id: string;
  name: string;
  side: 'white' | 'black';
  firstReadyHalfMove?: number;
  cooldownHalfMoves?: number;
  usesPerGame?: number;
  timing: string;
  validTargets: {
    squares?: string[];
    terrain?: string;
    mustBeUnoccupied?: boolean;
  };
  delayHalfMoves: number;
  effect: {
    replaceTerrainPermanently: string;
  };
}

export interface UIRulesPanel {
  icon: string;
  goalText: string;
  visibleTerrains: string[];
  dynamicCounters: {
    id: string;
    label: string;
    unit: string;
  }[];
  mapSummary: string[];
}

export interface ContextualTip {
  id: string;
  trigger: string;
  eventId?: string;
  actionId?: string;
  side?: 'white' | 'black';
  text: string;
}

export interface BattlefieldMapConfig {
  id: BattlefieldMapId;
  name: string;
  subtitle: string;
  symmetric: boolean;
  initialSetup: string;
  victoryConditions: {
    white: string[];
    black: string[];
    maxHalfMoves: number | null;
  };
  layout: string[];
  tileOverrides: Record<string, { baseTerrain: string; hasUpgrade?: boolean }>;
  upgrades: {
    squares: string[];
    respawnHalfMoves: number;
  };
  events: BattlefieldEventDef[];
  specialActions: SpecialActionDef[];
  uiRulesPanel: UIRulesPanel;
  contextualTips: ContextualTip[];
}

export interface BattlefieldState {
  mapId: BattlefieldMapId;
  halfMoveCount: number;
  grid: string[][]; // 8x8 terrain chars
  isFloodActive: boolean;
  floodWarning: boolean;
  isTrapActive: boolean;
  trapWarning: boolean;
  catapultCharge: number; // half-moves charged
  catapultPending: { row: number; col: number; delay: number } | null;
  gateClosed: boolean;
  immobilizedPieces: Record<string, number>; // pieceId -> turns left
  activeTip: string | null;
}

