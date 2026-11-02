/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Piece, Trap, TrapType, BonusItem, ItemType, FloatingNotification } from '../types/game';
import { BOARD_SIZE, isInsideBoard } from './chessLogic';
import { soundEngine } from '../audio/soundEngine';

export const TRAP_CONFIG: Record<
  TrapType,
  { name: string; emoji: string; description: string; color: string }
> = {
  banana: {
    name: 'Banánová slupka',
    emoji: '🍌',
    description: 'Figurka uklouzla, udělala otočku o 360° a sjela o políčko dál!',
    color: '#eab308',
  },
  spring: {
    name: 'Pérová odpalovací rampa',
    emoji: '🦘',
    description: 'BOING! Pružina vystřelila figurku o 2 pole kupředu!',
    color: '#f97316',
  },
  teleport: {
    name: 'Červí díra',
    emoji: '🌀',
    description: 'Vznikla časoprostorová anomálie a figurka se teleportovala na náhodné místo!',
    color: '#a855f7',
  },
  freeze: {
    name: 'Mrazivá past',
    emoji: '🧊',
    description: 'Figurka zmrzla na kost v ledovém bloku! Nemůže se příští tah hýbat.',
    color: '#38bdf8',
  },
  swap: {
    name: 'Prohození těl',
    emoji: '🔄',
    description: 'Kouzlo výměny! Figurka si prohodila pozici s náhodným pěšcem!',
    color: '#ec4899',
  },
  confetti_pop: {
    name: 'Dělo z konfet',
    emoji: '🎉',
    description: 'Bum! Z figurky vystřelily konfety a získala ochranný bublinový štít!',
    color: '#10b981',
  },
};

export const ITEM_CONFIG: Record<
  ItemType,
  { name: string; emoji: string; description: string; color: string }
> = {
  rocket_boots: {
    name: 'Raketové trysky',
    emoji: '🚀',
    description: 'Může přeskakovat libovolné překážky a nepřátelské figurky!',
    color: '#ef4444',
  },
  mega_hammer: {
    name: 'Obří kreslené kladivo',
    emoji: '🔨',
    description: 'Masivní útočná síla! Odhazuje figurky v dosahu.',
    color: '#f59e0b',
  },
  bubble_shield: {
    name: 'Bublinový štít',
    emoji: '🛡️',
    description: 'Odrazí příští pokus soupeře o vyhození!',
    color: '#06b6d4',
  },
  magic_mirror: {
    name: 'Kouzelné zrcadlo',
    emoji: '🪞',
    description: 'Odráží nepříjemné efekty a pasti!',
    color: '#8b5cf6',
  },
  speed_potion: {
    name: 'Lektvar zrychlení',
    emoji: '⚡',
    description: 'Okamžitý dvojitý tah!',
    color: '#22c55e',
  },
};

// Generate initial traps (only on neutral middle rows 2, 3, 4, 5)
export function generateInitialTraps(count: number = 6): Trap[] {
  const traps: Trap[] = [];
  const trapTypes: TrapType[] = ['banana', 'spring', 'teleport', 'freeze', 'swap', 'confetti_pop'];
  const possibleCoords: { r: number; c: number }[] = [];

  for (let r = 2; r <= 5; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      possibleCoords.push({ r, c });
    }
  }

  // Shuffle coords
  for (let i = possibleCoords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possibleCoords[i], possibleCoords[j]] = [possibleCoords[j], possibleCoords[i]];
  }

  const selected = possibleCoords.slice(0, Math.min(count, possibleCoords.length));
  selected.forEach(({ r, c }, index) => {
    traps.push({
      row: r,
      col: c,
      type: trapTypes[index % trapTypes.length],
      revealed: false, // hidden until stepped on for maximum comedy surprise!
    });
  });

  return traps;
}

// Generate random bonus items
export function generateBonusItem(
  board: (Piece | null)[][],
  existingItems: BonusItem[],
  traps: Trap[]
): BonusItem | null {
  const itemTypes: ItemType[] = ['rocket_boots', 'mega_hammer', 'bubble_shield', 'speed_potion'];
  const emptyCoords: { r: number; c: number }[] = [];

  for (let r = 2; r <= 5; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const isPieceThere = !!board[r][c];
      const isItemThere = existingItems.some((it) => it.row === r && it.col === c);
      const isTrapThere = traps.some((t) => t.row === r && t.col === c);
      if (!isPieceThere && !isItemThere && !isTrapThere) {
        emptyCoords.push({ r, c });
      }
    }
  }

  if (emptyCoords.length === 0) return null;

  const pick = emptyCoords[Math.floor(Math.random() * emptyCoords.length)];
  const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    row: pick.r,
    col: pick.c,
    type: itemType,
  };
}

export interface TrapResolutionResult {
  finalRow: number;
  finalCol: number;
  updatedPiece: Piece;
  notification: FloatingNotification | null;
  logText: string;
}

export function handleTrapTrigger(
  board: (Piece | null)[][],
  piece: Piece,
  trap: Trap,
  dr: number,
  dc: number
): TrapResolutionResult {
  let finalRow = trap.row;
  let finalCol = trap.col;
  const updatedPiece: Piece = { ...piece };
  const info = TRAP_CONFIG[trap.type];
  let logText = `${piece.color === 'white' ? 'Bílý' : 'Černý'} ${piece.type} šlápl na past: ${info.emoji} ${info.name}!`;

  switch (trap.type) {
    case 'banana': {
      soundEngine.playBanana();
      updatedPiece.isDizzy = true;
      // Slip 1 step in vector direction
      const slipR = trap.row + (dr !== 0 ? Math.sign(dr) : piece.color === 'white' ? -1 : 1);
      const slipC = trap.col + (dc !== 0 ? Math.sign(dc) : 0);
      if (isInsideBoard(slipR, slipC) && !board[slipR][slipC]) {
        finalRow = slipR;
        finalCol = slipC;
        logText += ' Šup! Uklouzl o políčko dál!';
      } else {
        logText += ' Zatočila se mu hlava a zavrávoral na místě!';
      }
      break;
    }

    case 'spring': {
      soundEngine.playSpring();
      const jumpR = trap.row + (dr !== 0 ? Math.sign(dr) * 2 : piece.color === 'white' ? -2 : 2);
      const jumpC = trap.col + (dc !== 0 ? Math.sign(dc) * 2 : 0);
      if (isInsideBoard(jumpR, jumpC) && !board[jumpR][jumpC]) {
        finalRow = jumpR;
        finalCol = jumpC;
        logText += ' BOING! Vystřelen o 2 pole dopředu!';
      } else {
        logText += ' Vystřelil do vzduchu a dopadl zpět na nohy!';
      }
      break;
    }

    case 'teleport': {
      soundEngine.playTeleport();
      // Find random empty tile
      const empties: { r: number; c: number }[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!board[r][c] && (r !== trap.row || c !== trap.col)) {
            empties.push({ r, c });
          }
        }
      }
      if (empties.length > 0) {
        const target = empties[Math.floor(Math.random() * empties.length)];
        finalRow = target.r;
        finalCol = target.c;
        logText += ` Teleportoval se do jiné dimenze na pole [${String.fromCharCode(65 + target.c)}${8 - target.r}]!`;
      }
      break;
    }

    case 'freeze': {
      soundEngine.playFreeze();
      updatedPiece.frozenTurns = 1;
      logText += ' Celý ztuhl v ledu a nemůže se hýbat!';
      break;
    }

    case 'swap': {
      soundEngine.playTeleport();
      // Look for any enemy pawn or piece to swap with
      const candidates: { r: number; c: number; piece: Piece }[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const p = board[r][c];
          if (p && p.color !== piece.color && p.type !== 'king') {
            candidates.push({ r, c, piece: p });
          }
        }
      }
      if (candidates.length > 0) {
        const swapTarget = candidates[Math.floor(Math.random() * candidates.length)];
        // Perform swap
        board[swapTarget.r][swapTarget.c] = {
          ...piece,
          row: swapTarget.r,
          col: swapTarget.c,
        };
        finalRow = swapTarget.r;
        finalCol = swapTarget.c;
        swapTarget.piece.row = trap.row;
        swapTarget.piece.col = trap.col;
        board[trap.row][trap.col] = swapTarget.piece;
        logText += ` Prohodil si tělo s nepřátelským ${swapTarget.piece.type}!`;
      }
      break;
    }

    case 'confetti_pop': {
      soundEngine.playVictory();
      updatedPiece.shield = true;
      logText += ' Oslava! Získal ochranný bublinový štít!';
      break;
    }
  }

  const notification: FloatingNotification = {
    id: `notif-${Date.now()}-${Math.random()}`,
    text: info.name,
    emoji: info.emoji,
    color: info.color,
  };

  return {
    finalRow,
    finalCol,
    updatedPiece,
    notification,
    logText,
  };
}
