/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Piece, PieceColor, PieceType, Trap, BonusItem } from '../types/game';

export const BOARD_SIZE = 8;

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

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
  const { row, col, color, type, equippedItem, isSlimeStuck } = piece;
  const isWhite = color === 'white';
  const forwardDir = isWhite ? -1 : 1;

  // If stuck in glue, piece can only move 1 square in any adjacent direction
  if (isSlimeStuck) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (isInsideBoard(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
    }
    return moves;
  }

  const hasRocket = checkSpecialItems && equippedItem === 'rocket_boots';
  const hasHammer = checkSpecialItems && equippedItem === 'mega_hammer';
  const hasLightning = checkSpecialItems && equippedItem === 'lightning_rod';

  // LIGHTNING ROD: Gives full cardinal rook beams to any piece!
  if (hasLightning) {
    const cardinalDirs: [number, number][] = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];
    for (const [dr, dc] of cardinalDirs) {
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
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }

  // MEGA HAMMER POWER: Can smash any square in a 2-square radius or leap & crush!
  if (hasHammer) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (Math.abs(dr) <= 1 || Math.abs(dc) <= 1 || Math.abs(dr) === Math.abs(dc)) {
          const hr = row + dr;
          const hc = col + dc;
          if (isInsideBoard(hr, hc)) {
            const target = board[hr][hc];
            if (!target || target.color !== color) {
              moves.push({ row: hr, col: hc });
            }
          }
        }
      }
    }
  }

  // ROCKET BOOTS POWER: Any piece can jet-boost up to 3 squares in all 8 directions jumping over obstacles!
  if (hasRocket) {
    const allDirs: [number, number][] = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];
    for (const [dr, dc] of allDirs) {
      for (let dist = 1; dist <= 3; dist++) {
        const rr = row + dr * dist;
        const rc = col + dc * dist;
        if (isInsideBoard(rr, rc)) {
          const dest = board[rr][rc];
          if (!dest || dest.color !== color) {
            moves.push({ row: rr, col: rc });
          }
        }
      }
    }
  }

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
            break;
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

      // Castling
      if (checkSpecialItems && !piece.hasMoved) {
        const oppColor: PieceColor = color === 'white' ? 'black' : 'white';
        // Kingside castling (col 7 rook)
        const kingsideRook = board[row][7];
        if (
          kingsideRook &&
          kingsideRook.type === 'rook' &&
          kingsideRook.color === color &&
          !kingsideRook.hasMoved &&
          board[row][5] === null &&
          board[row][6] === null &&
          !isSquareUnderAttack(board, row, col, oppColor) &&
          !isSquareUnderAttack(board, row, 5, oppColor) &&
          !isSquareUnderAttack(board, row, 6, oppColor)
        ) {
          moves.push({ row, col: 6 });
        }

        // Queenside castling (col 0 rook)
        const queensideRook = board[row][0];
        if (
          queensideRook &&
          queensideRook.type === 'rook' &&
          queensideRook.color === color &&
          !queensideRook.hasMoved &&
          board[row][1] === null &&
          board[row][2] === null &&
          board[row][3] === null &&
          !isSquareUnderAttack(board, row, col, oppColor) &&
          !isSquareUnderAttack(board, row, 3, oppColor) &&
          !isSquareUnderAttack(board, row, 2, oppColor)
        ) {
          moves.push({ row, col: 2 });
        }
      }
      break;
    }
  }

  // Deduplicate moves
  const seen = new Set<string>();
  const uniqueMoves: { row: number; col: number }[] = [];
  for (const m of moves) {
    const key = `${m.row},${m.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMoves.push(m);
    }
  }

  return uniqueMoves;
}

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

export function isSquareUnderAttack(
  board: (Piece | null)[][],
  row: number,
  col: number,
  byColor: PieceColor
): boolean {
  // 1. Pawn attacks (pawns only attack diagonally forward towards opponent, so in reverse from target)
  const pawnPdr = byColor === 'white' ? 1 : -1;
  const pawnRow = row + pawnPdr;
  for (const dc of [-1, 1]) {
    const pawnCol = col + dc;
    if (isInsideBoard(pawnRow, pawnCol)) {
      const p = board[pawnRow][pawnCol];
      if (p && p.color === byColor && p.type === 'pawn' && (!p.frozenTurns || p.frozenTurns <= 0)) {
        return true;
      }
    }
  }

  // 2. Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const r = row + dr;
    const c = col + dc;
    if (isInsideBoard(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === 'knight' && (!p.frozenTurns || p.frozenTurns <= 0)) {
        return true;
      }
    }
  }

  // 3. King attacks (adjacent squares)
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (isInsideBoard(r, c)) {
        const p = board[r][c];
        if (p && p.color === byColor && p.type === 'king' && (!p.frozenTurns || p.frozenTurns <= 0)) {
          return true;
        }
      }
    }
  }

  // 4. Diagonal rays (Bishop, Queen)
  const diagDirs: [number, number][] = [
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];
  for (const [dr, dc] of diagDirs) {
    let r = row + dr;
    let c = col + dc;
    while (isInsideBoard(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === 'bishop' || p.type === 'queen') && (!p.frozenTurns || p.frozenTurns <= 0)) {
          return true;
        }
        break; // Blocked by piece
      }
      r += dr;
      c += dc;
    }
  }

  // 5. Orthogonal rays (Rook, Queen, or Lightning Rod item)
  const orthoDirs: [number, number][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];
  for (const [dr, dc] of orthoDirs) {
    let r = row + dr;
    let c = col + dc;
    while (isInsideBoard(r, c)) {
      const p = board[r][c];
      if (p) {
        if (
          p.color === byColor &&
          (p.type === 'rook' || p.type === 'queen' || p.equippedItem === 'lightning_rod') &&
          (!p.frozenTurns || p.frozenTurns <= 0)
        ) {
          return true;
        }
        break; // Blocked by piece
      }
      r += dr;
      c += dc;
    }
  }

  // 6. Mega Hammer check: any enemy piece with mega_hammer within 2-square radius
  for (let r = Math.max(0, row - 2); r <= Math.min(BOARD_SIZE - 1, row + 2); r++) {
    for (let c = Math.max(0, col - 2); c <= Math.min(BOARD_SIZE - 1, col + 2); c++) {
      const p = board[r][c];
      if (p && p.color === byColor && p.equippedItem === 'mega_hammer' && (!p.frozenTurns || p.frozenTurns <= 0)) {
        const dr = Math.abs(r - row);
        const dc = Math.abs(c - col);
        if (dr <= 1 || dc <= 1 || dr === dc) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isKingInCheck(board: (Piece | null)[][], color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPos.row, kingPos.col, opponentColor);
}

export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map((row) =>
    row.map((piece) => (piece ? { ...piece } : null))
  );
}

export function getLegalMoves(
  board: (Piece | null)[][],
  piece: Piece
): { row: number; col: number }[] {
  const pseudoMoves = getPseudoLegalMoves(board, piece, true);
  const legal: { row: number; col: number }[] = [];

  for (const move of pseudoMoves) {
    const testBoard = cloneBoard(board);
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

export function evaluateGameStatus(
  board: (Piece | null)[][],
  currentTurn: PieceColor
): { isCheck: boolean; isCheckmate: boolean; isStalemate: boolean } {
  const inCheck = isKingInCheck(board, currentTurn);

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

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 12,
  knight: 34,
  bishop: 35,
  rook: 52,
  queen: 95,
  king: 1000,
};

export function selectAIMove(
  board: (Piece | null)[][],
  color: PieceColor,
  traps: Trap[],
  bonusItems: BonusItem[],
  difficulty: 'easy' | 'medium' | 'hard'
): { piece: Piece; move: { row: number; col: number } } | null {
  const allMoves: { piece: Piece; move: { row: number; col: number }; score: number }[] = [];
  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';

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
    if (Math.random() < 0.5) {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  for (const entry of allMoves) {
    const { piece, move } = entry;
    const target = board[move.row][move.col];
    let score = 0;

    if (target) {
      if (target.equippedItem === 'magic_mirror') {
        score -= PIECE_VALUES[piece.type] * 2;
      } else if (target.shield) {
        score += 6;
      } else {
        score += PIECE_VALUES[target.type] * 2.4 - PIECE_VALUES[piece.type] * 0.15;
      }
    }

    const hasItem = bonusItems.find((it) => it.row === move.row && it.col === move.col);
    if (hasItem) {
      score += 28;
    }

    const trap = traps.find((t) => t.row === move.row && t.col === move.col && t.revealed);
    if (trap) {
      if (trap.type === 'freeze' || trap.type === 'banana' || trap.type === 'tnt' || trap.type === 'glue') {
        score -= 20;
      } else if (trap.type === 'confetti_pop') {
        score += 15;
      }
    }

    const distToCenter = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
    score += (7 - distToCenter) * 1.6;

    if (piece.type === 'pawn') {
      const adv = color === 'white' ? 6 - move.row : move.row - 1;
      score += adv * 3.5;
      if (move.row === 0 || move.row === 7) {
        score += 90;
      }
    }

    if (difficulty !== 'easy') {
      const simBoard = cloneBoard(board);
      simBoard[move.row][move.col] = { ...piece, row: move.row, col: move.col };
      simBoard[piece.row][piece.col] = null;

      if (isKingInCheck(simBoard, opponentColor)) {
        score += 22;
      }

      if (isSquareUnderAttack(simBoard, move.row, move.col, opponentColor)) {
        if (!piece.shield && piece.equippedItem !== 'magic_mirror') {
          score -= PIECE_VALUES[piece.type] * (difficulty === 'hard' ? 1.2 : 0.6);
        }
      }
    }

    score += (Math.random() - 0.5) * (difficulty === 'hard' ? 2.5 : 8);
    entry.score = score;
  }

  allMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'medium') {
    const topChoices = allMoves.slice(0, Math.min(3, allMoves.length));
    return topChoices[Math.floor(Math.random() * topChoices.length)];
  }

  return allMoves[0];
}
