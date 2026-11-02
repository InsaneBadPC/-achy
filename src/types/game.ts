/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export type TrapType =
  | 'banana'       // Slips 1 extra square, 360 spin
  | 'spring'       // Launches forward 2 squares
  | 'teleport'     // Teleports to a random empty square
  | 'freeze'       // Frozen for next turn
  | 'swap'         // Swaps positions with a random enemy pawn/piece
  | 'confetti_pop'; // Dizzy backflip, moral boost

export type ItemType =
  | 'rocket_boots'  // Can move any distance jumping over pieces
  | 'mega_hammer'   // Can bonk any adjacent enemy immediately
  | 'bubble_shield' // Protects against next capture
  | 'magic_mirror'  // Inverts attack
  | 'speed_potion'; // Grants an immediate extra mini-step

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

export interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  piece: Piece;
  captured?: Piece | null;
  trapTriggered?: Trap | null;
  itemCollected?: BonusItem | null;
  trapEffectDescription?: string;
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
}

export type PeerMessage =
  | { type: 'MOVE'; move: Move; nextTurn: PieceColor; newTraps?: Trap[]; newBonusItems?: BonusItem[] }
  | { type: 'SYNC_STATE'; state: Partial<GameState> }
  | { type: 'EMOTE'; emoji: string; text: string; sender: PieceColor }
  | { type: 'RESTART' }
  | { type: 'READY'; color: PieceColor };
