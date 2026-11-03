/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Piece, PieceColor, PieceType, Move, BonusItem } from '../types/game';
import {
  BattlefieldState,
  BattlefieldMapId,
  TerrainType,
} from '../types/battlefield';
import {
  getTerrainAt,
  getHeightAt,
  coordsToSquare,
  squareToCoords,
  BATTLEFIELD_MAPS,
} from './battlefieldData';
import { BOARD_SIZE, isInsideBoard, cloneBoard } from './chessLogic';

export function isPieceImmobilized(
  piece: Piece,
  state: BattlefieldState
): boolean {
  if (piece.type === 'king') return false;
  return (state.immobilizedPieces[piece.id] || 0) > 0;
}

export function isSquareFlooded(
  state: BattlefieldState,
  row: number,
  col: number
): boolean {
  if (state.mapId !== 'priroda' || !state.isFloodActive) return false;
  const sq = coordsToSquare(row, col);
  return ['d4', 'e4', 'd5', 'e5'].includes(sq);
}

export function isSquareWarnedFlood(
  state: BattlefieldState,
  row: number,
  col: number
): boolean {
  if (state.mapId !== 'priroda' || !state.floodWarning) return false;
  const sq = coordsToSquare(row, col);
  return ['d4', 'e4', 'd5', 'e5'].includes(sq);
}

/**
 * Returns pseudo-legal moves for a piece in Battlefield mode respecting terrain, height, and events.
 */
export function getBattlefieldPseudoMoves(
  board: (Piece | null)[][],
  piece: Piece,
  state: BattlefieldState
): { row: number; col: number }[] {
  // If immobilized on spike / trap, piece cannot move
  if (isPieceImmobilized(piece, state)) {
    return [];
  }

  // Normal frozen turn check
  if (piece.frozenTurns && piece.frozenTurns > 0) {
    return [];
  }

  const moves: { row: number; col: number }[] = [];
  const { row, col, color, type, isSlimeStuck } = piece;
  const isWhite = color === 'white';
  const forwardDir = isWhite ? -1 : 1;
  const currentHeight = getHeightAt(state, row, col);

  // Helper: check if stepping from (fromR, fromC) to (toR, toC) is physically allowed by terrain & height
  const canPhysicallyStep = (
    fromR: number,
    fromC: number,
    toR: number,
    toC: number,
    isKnight = false
  ): boolean => {
    if (!isInsideBoard(toR, toC)) return false;
    const destTerrain = getTerrainAt(state, toR, toC);

    if (isKnight) {
      // Knight can jump over anything, but CANNOT LAND on impassable river or wall
      return destTerrain.knightCanLand;
    }

    // Non-knight: terrain must be passable
    if (!destTerrain.passable) return false;

    // Height rules: can climb at most 1, can descend any amount
    const fromH = getHeightAt(state, fromR, fromC);
    const toH = getHeightAt(state, toR, toC);
    const stepUp = toH - fromH;
    if (stepUp > 1) return false;

    return true;
  };

  // If glued, piece can only move 1 step
  if (isSlimeStuck) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (canPhysicallyStep(row, col, nr, nc, false)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
    }
    return moves;
  }

  // Sliding pieces helper: checks ray, height stepping, and stopping terrain (Forest, Ford)
  const addRayMoves = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let prevR = row;
      let prevC = col;
      let r = row + dr;
      let c = col + dc;

      while (isInsideBoard(r, c)) {
        if (!canPhysicallyStep(prevR, prevC, r, c, false)) {
          break;
        }

        const destTerrain = getTerrainAt(state, r, c);
        const destPiece = board[r][c];

        if (!destPiece) {
          moves.push({ row: r, col: c });
        } else {
          if (destPiece.color !== color) {
            moves.push({ row: r, col: c });
          }
          break; // Blocked by piece
        }

        // If entering terrain that stops sliding pieces (Forest 'L' or Ford ':'), must stop!
        if (destTerrain.stopsSlidingPieces) {
          break;
        }

        prevR = r;
        prevC = c;
        r += dr;
        c += dc;
      }
    }
  };

  switch (type) {
    case 'pawn': {
      // 1-step forward
      const f1 = row + forwardDir;
      if (canPhysicallyStep(row, col, f1, col, false) && !board[f1][col]) {
        moves.push({ row: f1, col });

        // 2-step forward from starting row
        const startingRow = isWhite ? 6 : 1;
        const f2 = row + forwardDir * 2;
        const midTerrain = getTerrainAt(state, f1, col);
        // Cannot double step through stopping terrain (forest/ford) or impassable terrain
        if (
          row === startingRow &&
          !midTerrain.stopsSlidingPieces &&
          canPhysicallyStep(f1, col, f2, col, false) &&
          !board[f2][col]
        ) {
          moves.push({ row: f2, col });
        }
      }

      // Diagonal captures: pawnMaxCaptureHeightDiff = 0
      // Pawn cannot capture onto a square higher than itself!
      for (const dc of [-1, 1]) {
        const tr = row + forwardDir;
        const tc = col + dc;
        if (canPhysicallyStep(row, col, tr, tc, false)) {
          const targetH = getHeightAt(state, tr, tc);
          if (targetH <= currentHeight) {
            const target = board[tr][tc];
            if (target && target.color !== color) {
              moves.push({ row: tr, col: tc });
            }
          }
        }
      }
      break;
    }

    case 'knight': {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) {
        const r = row + dr;
        const c = col + dc;
        if (canPhysicallyStep(row, col, r, c, true)) {
          const target = board[r][c];
          if (!target || target.color !== color) {
            moves.push({ row: r, col: c });
          }
        }
      }
      break;
    }

    case 'bishop': {
      addRayMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;
    }

    case 'rook': {
      addRayMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
    }

    case 'queen': {
      addRayMoves([
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ]);
      break;
    }

    case 'king': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr;
          const c = col + dc;
          if (canPhysicallyStep(row, col, r, c, false)) {
            // King cannot enter warned flood square to escape check or hide
            if (isSquareWarnedFlood(state, r, c)) {
              continue;
            }

            const target = board[r][c];
            if (!target || target.color !== color) {
              moves.push({ row: r, col: c });
            }
          }
        }
      }

      // Castling rules: requires uniform height across all squares between king and rook!
      if (!piece.hasMoved) {
        const checkCastling = (rookCol: number, stepDir: number, emptyCols: number[]) => {
          const rook = board[row][rookCol];
          if (!rook || rook.type !== 'rook' || rook.hasMoved || rook.color !== color) {
            return;
          }

          const baseH = getHeightAt(state, row, col);
          // Check uniform height and allowed terrain
          for (let c = Math.min(col, rookCol); c <= Math.max(col, rookCol); c++) {
            if (getHeightAt(state, row, c) !== baseH) return;
            const t = getTerrainAt(state, row, c);
            if (t.id !== 'plain' && t.id !== 'bridge') return;
          }

          // Check empty squares
          for (const ec of emptyCols) {
            if (board[row][ec] !== null) return;
          }

          // Check king squares under attack
          const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
          if (isSquareAttackedInBattlefield(board, row, col, opponentColor, state)) return;
          if (isSquareAttackedInBattlefield(board, row, col + stepDir, opponentColor, state)) return;
          if (isSquareAttackedInBattlefield(board, row, col + stepDir * 2, opponentColor, state)) return;

          moves.push({ row, col: col + stepDir * 2 });
        };

        // Kingside: e to g
        checkCastling(7, 1, [5, 6]);
        // Queenside: e to c
        checkCastling(0, -1, [1, 2, 3]);
      }
      break;
    }
  }

  return moves;
}

/**
 * Checks whether (targetRow, targetCol) is attacked by byColor in Battlefield mode.
 * - Disregards immobilized pieces (they give NO check/attack).
 * - Disregards flooded pieces (they give NO check/attack).
 * - Respects terrain stop rules (forest, ford) and height differentials (pawn cannot attack up).
 */
export function isSquareAttackedInBattlefield(
  board: (Piece | null)[][],
  targetRow: number,
  targetCol: number,
  byColor: PieceColor,
  state: BattlefieldState
): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        // Immobilized pieces give NO attack
        if (isPieceImmobilized(piece, state)) continue;
        // Flooded pieces give NO attack
        if (isSquareFlooded(state, r, c)) continue;

        const moves = getBattlefieldPseudoMoves(board, piece, state);
        if (moves.some((m) => m.row === targetRow && m.col === targetCol)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isKingInCheckInBattlefield(
  board: (Piece | null)[][],
  color: PieceColor,
  state: BattlefieldState
): boolean {
  let kingRow = -1;
  let kingCol = -1;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'king' && piece.color === color) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== -1) break;
  }

  if (kingRow === -1) return false;
  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
  return isSquareAttackedInBattlefield(board, kingRow, kingCol, opponentColor, state);
}

export function getBattlefieldLegalMoves(
  board: (Piece | null)[][],
  piece: Piece,
  state: BattlefieldState
): { row: number; col: number }[] {
  const pseudoMoves = getBattlefieldPseudoMoves(board, piece, state);
  const legal: { row: number; col: number }[] = [];

  for (const move of pseudoMoves) {
    const testBoard = cloneBoard(board);
    testBoard[move.row][move.col] = {
      ...piece,
      row: move.row,
      col: move.col,
    };
    testBoard[piece.row][piece.col] = null;

    if (!isKingInCheckInBattlefield(testBoard, piece.color, state)) {
      legal.push(move);
    }
  }

  return legal;
}

export function evaluateBattlefieldGameStatus(
  board: (Piece | null)[][],
  currentTurn: PieceColor,
  state: BattlefieldState
): {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner: PieceColor | 'draw' | null;
} {
  const inCheck = isKingInCheckInBattlefield(board, currentTurn, state);

  // Check Obléhání half-move limit (60 half-moves = 30 turns)
  if (state.mapId === 'oblehani') {
    if (state.halfMoveCount >= 60) {
      // Black survives and wins!
      return {
        isCheck: inCheck,
        isCheckmate: false,
        isStalemate: false,
        winner: 'black',
      };
    }
  }

  let hasLegalMoves = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === currentTurn) {
        const moves = getBattlefieldLegalMoves(board, piece, state);
        if (moves.length > 0) {
          hasLegalMoves = true;
          break;
        }
      }
    }
    if (hasLegalMoves) break;
  }

  if (!hasLegalMoves) {
    if (inCheck) {
      const winner: PieceColor = currentTurn === 'white' ? 'black' : 'white';
      return { isCheck: true, isCheckmate: true, isStalemate: false, winner };
    } else {
      // In Obléhání, stalemate is counted as a victory for Black (defender)
      if (state.mapId === 'oblehani') {
        return { isCheck: false, isCheckmate: false, isStalemate: true, winner: 'black' };
      }
      return { isCheck: false, isCheckmate: false, isStalemate: true, winner: 'draw' };
    }
  }

  return { isCheck: inCheck, isCheckmate: false, isStalemate: false, winner: null };
}

/**
 * Updates events, counters, and timers after every half-move.
 */
export function advanceBattlefieldTurn(
  prevState: BattlefieldState,
  movedPiece: Piece,
  toRow: number,
  toCol: number
): {
  nextState: BattlefieldState;
  tip?: string;
  spawnUpgrades?: { row: number; col: number }[];
} {
  const nextHalfMove = prevState.halfMoveCount + 1;
  const nextGrid = prevState.grid.map((r) => [...r]);
  const nextImmobilized = { ...prevState.immobilizedPieces };

  // Decrement immobilized turns for pieces of the moved color
  for (const [id, turns] of Object.entries(nextImmobilized)) {
    if (turns > 0 && id.startsWith(movedPiece.color)) {
      if (turns === 1) {
        delete nextImmobilized[id];
      } else {
        nextImmobilized[id] = turns - 1;
      }
    }
  }

  // Check if landing on spike terrain '^' (or active ramp trap)
  const targetTerrain = getTerrainAt(prevState, toRow, toCol);
  if (targetTerrain.id === 'spike' && movedPiece.type !== 'king') {
    nextImmobilized[movedPiece.id] = 1; // 1 own turn immobilized
  }

  let isFloodActive = false;
  let floodWarning = false;
  let isTrapActive = false;
  let trapWarning = false;
  let catapultCharge = prevState.catapultCharge;
  let catapultPending = prevState.catapultPending ? { ...prevState.catapultPending } : null;
  let tip: string | undefined;
  const spawnUpgrades: { row: number; col: number }[] = [];

  // 1. PŘÍRODA: Záplava (Flood)
  if (prevState.mapId === 'priroda') {
    // Interval 10 half-moves, warning 2 half-moves, duration 2 half-moves
    const cycle = nextHalfMove % 10;
    if (cycle >= 8) {
      floodWarning = true;
      tip = 'Pozor: Za 2 půltahy přijde záplava! Brody budou neprůchodné.';
    }
    if (cycle === 0 || cycle === 1) {
      if (nextHalfMove >= 10) {
        isFloodActive = true;
        tip = 'Voda stoupla! Brody jsou zaplavené a neprůchodné.';
      }
    }
  }

  // 2. PRŮSMYK: Past na rampách (Spike Trap)
  if (prevState.mapId === 'prusmyk') {
    // Interval 8 half-moves, warning 2 half-moves, duration 2 half-moves on c4, c5, f4, f5
    const cycle = nextHalfMove % 8;
    if (cycle >= 6) {
      trapWarning = true;
      tip = 'Za 2 půltahy sklapne past na rampách (c4, c5, f4, f5)! Pozor na hroty.';
    }
    if (cycle === 0 || cycle === 1) {
      if (nextHalfMove >= 8) {
        isTrapActive = true;
        tip = 'Past sklapla! Boční rampy jsou pokryté ostrými hroty.';
      }
    }
  }

  // 3. OBLÉHÁNÍ: Katapult, Zásoby, Limit půltahů
  if (prevState.mapId === 'oblehani') {
    // Catapult charges for White (every 12 half-moves, first ready at 10)
    if (nextHalfMove >= 10) {
      catapultCharge = Math.min(12, catapultCharge + 1);
    }

    // Pending catapult shot execution
    if (catapultPending) {
      catapultPending.delay -= 1;
      if (catapultPending.delay <= 0) {
        // Wall smashed permanently into Ruins (1)
        nextGrid[catapultPending.row][catapultPending.col] = '1';
        tip = `💥 Katapult zasáhl hradbu na ${coordsToSquare(catapultPending.row, catapultPending.col)}! Vznikly průchozí Trosky (výška 1).`;
        catapultPending = null;
      }
    }

    // Supplies event: every 10 half-moves
    const supplyCycle = nextHalfMove % 10;
    if (supplyCycle >= 8) {
      tip = 'Za 2 půltahy shodí zásobovací vozy v předpolí nová vylepšení!';
    }
    if (supplyCycle === 0 && nextHalfMove >= 10) {
      const poolIndex = Math.floor(nextHalfMove / 10) % 2;
      const targetPool = poolIndex === 1 ? ['c4', 'f4'] : ['d5', 'e5'];
      for (const sq of targetPool) {
        spawnUpgrades.push(squareToCoords(sq));
      }
      tip = `📦 Zásoby dorazily! V předpolí na ${targetPool.join(', ')} leží vylepšení.`;
    }
  }

  return {
    nextState: {
      ...prevState,
      halfMoveCount: nextHalfMove,
      grid: nextGrid,
      isFloodActive,
      floodWarning,
      isTrapActive,
      trapWarning,
      catapultCharge,
      catapultPending,
      immobilizedPieces: nextImmobilized,
      activeTip: tip || prevState.activeTip,
    },
    tip,
    spawnUpgrades,
  };
}

/**
 * AI move selection for Battlefield mode.
 * Takes elevation advantage, terrain risks, and traps into account!
 */
export function selectBattlefieldAIMove(
  board: (Piece | null)[][],
  color: PieceColor,
  state: BattlefieldState,
  bonusItems: BonusItem[],
  difficulty: 'easy' | 'medium' | 'hard'
): { piece: Piece; move: { row: number; col: number } } | null {
  const allMoves: { piece: Piece; move: { row: number; col: number }; score: number }[] = [];
  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getBattlefieldLegalMoves(board, piece, state);
        for (const m of moves) {
          allMoves.push({ piece, move: m, score: 0 });
        }
      }
    }
  }

  if (allMoves.length === 0) return null;

  if (difficulty === 'easy') {
    if (Math.random() < 0.45) {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  const PIECE_VALS: Record<PieceType, number> = {
    pawn: 12,
    knight: 35,
    bishop: 35,
    rook: 54,
    queen: 98,
    king: 1000,
  };

  for (const entry of allMoves) {
    const { piece, move } = entry;
    const target = board[move.row][move.col];
    let score = 0;

    // Capture score
    if (target) {
      score += PIECE_VALS[target.type] * 2.5 - PIECE_VALS[piece.type] * 0.15;
    }

    // Bonus item collection
    const hasItem = bonusItems.find((it) => it.row === move.row && it.col === move.col);
    if (hasItem) {
      score += 26;
    }

    // Height advantage: occupying height 1 or 2 provides tactical superiority
    const targetHeight = getHeightAt(state, move.row, move.col);
    score += targetHeight * 8;

    // Terrain hazard avoidance: avoid landing on spikes / active traps
    const targetTerrain = getTerrainAt(state, move.row, move.col);
    if (targetTerrain.id === 'spike' && piece.type !== 'king') {
      score -= 24; // Will be immobilized
    }

    // Avoid warned flood squares
    if (isSquareWarnedFlood(state, move.row, move.col)) {
      score -= 18;
    }

    // Center proximity
    const distToCenter = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
    score += (7 - distToCenter) * 1.4;

    // Pawn advancement
    if (piece.type === 'pawn') {
      const adv = color === 'white' ? 6 - move.row : move.row - 1;
      score += adv * 3;
      if (move.row === 0 || move.row === 7) score += 95;
    }

    if (difficulty !== 'easy') {
      const simBoard = cloneBoard(board);
      simBoard[move.row][move.col] = { ...piece, row: move.row, col: move.col };
      simBoard[piece.row][piece.col] = null;

      if (isKingInCheckInBattlefield(simBoard, opponentColor, state)) {
        score += 24;
      }

      if (isSquareAttackedInBattlefield(simBoard, move.row, move.col, opponentColor, state)) {
        score -= PIECE_VALS[piece.type] * (difficulty === 'hard' ? 1.3 : 0.7);
      }
    }

    score += (Math.random() - 0.5) * (difficulty === 'hard' ? 2 : 6);
    entry.score = score;
  }

  allMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'medium') {
    const topChoices = allMoves.slice(0, Math.min(3, allMoves.length));
    return topChoices[Math.floor(Math.random() * topChoices.length)];
  }

  return allMoves[0];
}

