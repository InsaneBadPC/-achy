/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Piece, PieceColor, PieceType, GameState, Trap, BonusItem } from '../types/game';

export const BOARD_SIZE = 8;

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Back rows layout
  const backRow: PieceType[] = [
    'rook',
    'knight',
    'bishop',
    'queen',
    'king',
    'bishop',
    'knight',
    'rook',
  ];

  // Black pieces (top: row 0 & 1)
  for (let c = 0; c < BOARD_SIZE; c++) {
    board[0][c] = {
      id: `black-${backRow[c]}-${c}`,
      type: backRow[c],
      color: 'black',
      row: 0,
      col: c,
      hasMoved: false,
    };
    board[1][c] = {
      id: `black-pawn-${c}`,
      type: 'pawn',
      color: 'black',
      row: 1,
      col: c,
      hasMoved: false,
    };
  }

  // White pieces (bottom: row 7 & 6)
  for (let c = 0; c < BOARD_SIZE; c++) {
    board[6][c] = {
      id: `white-pawn-${c}`,
      type: 'pawn',
      color: 'white',
      row: 6,
      col: c,
      hasMoved: false,
    };
    board[7][c] = {
      id: `white-${backRow[c]}-${c}`,
      type: backRow[c],
      color: 'white',
      row: 7,
      col: c,
      hasMoved: false,
    };
  }

  return board;
}

export function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

// Pseudo-legal moves for a piece on the board
export function getPseudoLegalMoves(
  board: (Piece | null)[][],
  piece: Piece,
  checkSpecialItems: boolean = true
): { row: number; col: number }[] {
  if (piece.frozenTurns && piece.frozenTurns > 0) {
    return [];
  }

  const moves: { row: number; col: number }[] = [];
  const { row, col, color, type, equippedItem } = piece;
  const isWhite = color === 'white';
  const forwardDir = isWhite ? -1 : 1;

  const hasRocket = checkSpecialItems && equippedItem === 'rocket_boots';

  // Helper for linear ray moves
  const addRayMoves = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      while (isInsideBoard(r, c)) {
        const destPiece = board[r][c];
        if (!destPiece) {
          moves.push({ row: r, col: c });
        } else {
          if (destPiece.color !== color) {
            moves.push({ row: r, col: c });
          }
          if (!hasRocket) {
            break; // Stop at collision unless rocket boots
          }
        }
        r += dr;
        c += dc;
      }
    }
  };

  switch (type) {
    case 'pawn': {
      // 1-step forward
      const f1 = row + forwardDir;
      if (isInsideBoard(f1, col) && !board[f1][col]) {
        moves.push({ row: f1, col });
        // 2-step forward from starting row
        const startingRow = isWhite ? 6 : 1;
        const f2 = row + forwardDir * 2;
        if (row === startingRow && isInsideBoard(f2, col) && !board[f2][col]) {
          moves.push({ row: f2, col });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const tr = row + forwardDir;
        const tc = col + dc;
        if (isInsideBoard(tr, tc)) {
          const target = board[tr][tc];
          if (target && target.color !== color) {
            moves.push({ row: tr, col: tc });
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
        if (isInsideBoard(r, c)) {
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
          if (isInsideBoard(r, c)) {
            const target = board[r][c];
            if (!target || target.color !== color) {
              moves.push({ row: r, col: c });
            }
          }
        }
      }
      break;
    }
  }

  return moves;
}

// Find position of king
export function findKing(board: (Piece | null)[][], color: PieceColor): { row: number; col: number } | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Check if square is under attack by opponent
export function isSquareUnderAttack(
  board: (Piece | null)[][],
  row: number,
  col: number,
  byColor: PieceColor
): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        const moves = getPseudoLegalMoves(board, piece, false);
        if (moves.some((m) => m.row === row && m.col === col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Check if a color is in check
export function isKingInCheck(board: (Piece | null)[][], color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPos.row, kingPos.col, opponentColor);
}

// Clone board helper
export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map((row) =>
    row.map((piece) => (piece ? { ...piece } : null))
  );
}

// Strict legal moves: filters out moves that leave king in check
export function getLegalMoves(
  board: (Piece | null)[][],
  piece: Piece
): { row: number; col: number }[] {
  const pseudoMoves = getPseudoLegalMoves(board, piece, true);
  const legal: { row: number; col: number }[] = [];

  for (const move of pseudoMoves) {
    const testBoard = cloneBoard(board);
    // Execute simulated move
    testBoard[move.row][move.col] = {
      ...piece,
      row: move.row,
      col: move.col,
    };
    testBoard[piece.row][piece.col] = null;

    if (!isKingInCheck(testBoard, piece.color)) {
      legal.push(move);
    }
  }

  return legal;
}

// Check for checkmate or stalemate
export function evaluateGameStatus(
  board: (Piece | null)[][],
  currentTurn: PieceColor
): { isCheck: boolean; isCheckmate: boolean; isStalemate: boolean } {
  const inCheck = isKingInCheck(board, currentTurn);

  // Check if current turn player has any legal moves
  let hasLegalMoves = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === currentTurn) {
        const moves = getLegalMoves(board, piece);
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
      return { isCheck: true, isCheckmate: true, isStalemate: false };
    } else {
      return { isCheck: false, isCheckmate: false, isStalemate: true };
    }
  }

  return { isCheck: inCheck, isCheckmate: false, isStalemate: false };
}

// AI evaluation values
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 10,
  knight: 32,
  bishop: 33,
  rook: 50,
  queen: 90,
  king: 1000,
};

export function selectAIMove(
  board: (Piece | null)[][],
  color: PieceColor,
  traps: Trap[],
  bonusItems: BonusItem[],
  difficulty: 'easy' | 'medium' | 'hard'
): { piece: Piece; move: { row: number; col: number } } | null {
  // Collect all possible moves
  const allMoves: { piece: Piece; move: { row: number; col: number }; score: number }[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, piece);
        for (const m of moves) {
          allMoves.push({ piece, move: m, score: 0 });
        }
      }
    }
  }

  if (allMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // 60% random, 40% simple capture preference
    if (Math.random() < 0.6) {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  // Score evaluation for Medium & Hard
  for (const entry of allMoves) {
    const { piece, move } = entry;
    const target = board[move.row][move.col];
    let score = 0;

    // 1. Capture score
    if (target) {
      score += PIECE_VALUES[target.type] * 2 - PIECE_VALUES[piece.type] * 0.1;
    }

    // 2. Bonus item score
    const hasItem = bonusItems.find((it) => it.row === move.row && it.col === move.col);
    if (hasItem) {
      score += 15;
    }

    // 3. Known trap penalty
    const trap = traps.find((t) => t.row === move.row && t.col === move.col && t.revealed);
    if (trap) {
      if (trap.type === 'freeze' || trap.type === 'banana') {
        score -= 12;
      }
    }

    // 4. Center control (d4, d5, e4, e5)
    const distToCenter = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
    score += (7 - distToCenter) * 1.5;

    // 5. Pawn advance score
    if (piece.type === 'pawn') {
      const adv = color === 'white' ? 6 - move.row : move.row - 1;
      score += adv * 3;
      if (move.row === 0 || move.row === 7) {
        score += 80; // Promotion imminent
      }
    }

    // Add small random noise for personality
    score += (Math.random() - 0.5) * (difficulty === 'hard' ? 2 : 8);

    entry.score = score;
  }

  allMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'medium') {
    // Pick from top 3
    const topChoices = allMoves.slice(0, Math.min(3, allMoves.length));
    return topChoices[Math.floor(Math.random() * topChoices.length)];
  }

  // Hard: best move
  return allMoves[0];
}
