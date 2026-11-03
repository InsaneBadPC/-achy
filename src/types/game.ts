/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type GameStyle = 'classic' | 'battlefield';

export type TrapType =
  | 'banana'       // Slips 1 extra square, 360 spin
  | 'spring'       // Launches forward 2 squares
  | 'teleport'     // Teleports to a random empty square
  | 'freeze'       // Frozen for next turn
  | 'swap'         // Swaps positions with a random enemy piece
  | 'confetti_pop' // Confetti, grants bubble shield
  | 'tnt'          // Explodes on contact, knocks back and stuns adjacent pieces
  | 'glue';        // Stuck in sticky slime, movement reduced to 1 step for next turn

export type ItemType =
  | 'rocket_boots'  // One rocket flight: up to 3 squares in any direction, jumping over pieces
  | 'mega_hammer'   // One smash: leap up to 2 squares, stuns adjacent enemies
  | 'bubble_shield' // Protects against next capture
  | 'magic_mirror'  // Reflects the next attack (attacker is destroyed) and blocks bad traps
  | 'speed_potion'  // Immediate extra turn
  | 'lightning_rod' // Stuffs electricity: attacks in full cardinal lines like a rook for 1 turn
  | 'magnet';       // Pulls nearest bonus item directly to the piece

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  row: number;
  col: number;
  hasMoved?: boolean;
  frozenTurns?: number;
  shield?: boolean;
  equippedItem?: ItemType | null;
  wackyScale?: number;
  isDizzy?: boolean;
  isSlimeStuck?: boolean;
}

export interface Trap {
  row: number;
  col: number;
  type: TrapType;
  revealed: boolean;
}

export interface BonusItem {
  id: string;
  row: number;
  col: number;
  type: ItemType;
}

export type MoveEffect =
  | 'normal'
  | 'shield_block'   // Attack bounced off a bubble shield
  | 'mirror_reflect' // Attacker destroyed by a magic mirror
  | 'hammer_smash'   // Mega hammer shockwave stunned neighbours
  | 'rocket_jump'    // Rocket boots flight
  | 'lightning_strike' // Lightning rod electro-strike
  | 'magnet_pull'    // Magnet sucked in items
  | 'tnt_blast';     // TNT trap explosion

export interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  piece: Piece;
  captured?: Piece | null;
  trapTriggered?: Trap | null;
  itemCollected?: BonusItem | null;
  trapEffectDescription?: string;
  effect?: MoveEffect;
  /** Target square of the original attack (for bump / reflect animations) */
  attackTarget?: { row: number; col: number };
  stunnedSquares?: { row: number; col: number }[];
  extraTurn?: boolean;
  /** Unique id so identical consecutive moves still trigger animations */
  seq?: number;
}

export type GameMode = 'ai' | 'local' | 'multiplayer';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type BoardTheme =
  | 'royal_wood'
  | 'magic_crystal'
  | 'volcano_dungeon'
  | 'cyber_neon'
  | 'pirate_island'
  | 'candy_land'
  | 'space_station'
  | 'spooky_graveyard';

export interface FloatingNotification {
  id: string;
  text: string;
  emoji: string;
  color: string;
  duration?: number;
}

export interface GameState {
  board: (Piece | null)[][];
  currentTurn: PieceColor;
  turnNumber: number;
  selectedSquare: { row: number; col: number } | null;
  legalMoves: { row: number; col: number }[];
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner: PieceColor | 'draw' | null;
  traps: Trap[];
  bonusItems: BonusItem[];
  lastMove: Move | null;
  logMessages: string[];
  gameId?: number;
}

export type PeerMessage =
  | { type: 'MOVE'; move: Move; nextTurn: PieceColor; newTraps?: Trap[]; newBonusItems?: BonusItem[] }
  | { type: 'SYNC_STATE'; state: Partial<GameState>; quote?: { pieceType: PieceType; text: string; speaker: string; avatar: string } }
  | { type: 'EMOTE'; emoji: string; text: string; sender: PieceColor }
  | { type: 'RESTART' }
  | { type: 'READY'; color: PieceColor };
