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
    description: 'BOING! Pružina vystřelila figurku o 2 pole kupředu přes překážky!',
    color: '#f97316',
  },
  teleport: {
    name: 'Červí díra',
    emoji: '🌀',
    description: 'Vznikla časoprostorová anomálie a figurka se teleportovala na náhodné prázdné pole!',
    color: '#a855f7',
  },
  freeze: {
    name: 'Mrazivá past',
    emoji: '🧊',
    description: 'Figurka zmrzla na kost v ledovém bloku! Nemůže se v příštím kole hýbat.',
    color: '#38bdf8',
  },
  swap: {
    name: 'Prohození těl',
    emoji: '🔄',
    description: 'Kouzlo výměny! Figurka si okamžitě prohodila pozici s náhodnou figurkou soupeře!',
    color: '#ec4899',
  },
  confetti_pop: {
    name: 'Dělo z konfet',
    emoji: '🎉',
    description: 'Bum! Z figurky vystřelily oslavné konfety a získala ochranný bublinový štít!',
    color: '#10b981',
  },
  tnt: {
    name: 'TNT Výbušnina',
    emoji: '💣',
    description: 'KABOOM! Obrovský výbuch otřese šachovnicí a omráčí všechny okolní figurky!',
    color: '#ef4444',
  },
  glue: {
    name: 'Lepivý sliz',
    emoji: '🧪',
    description: 'Plác! Figurka uvízla v lepkavém zeleném slizu a její pohyb je na 1 tah omezen na 1 pole.',
    color: '#84cc16',
  },
};

export const ITEM_CONFIG: Record<
  ItemType,
  { name: string; emoji: string; description: string; color: string; durationText: string }
> = {
  rocket_boots: {
    name: 'Raketové trysky',
    emoji: '🚀',
    description: 'Umožní figurce přeletět překážky a skočit až o 3 pole kterýmkoliv směrem!',
    color: '#ef4444',
    durationText: '1 tah (použití skokem)',
  },
  mega_hammer: {
    name: 'Obří kreslené kladivo',
    emoji: '🔨',
    description: 'Drtivý skok do okruhu 2 polí! Při dopadu tlaková vlna omráčí okolní nepřátele.',
    color: '#f59e0b',
    durationText: '1 tah (při útoku)',
  },
  bubble_shield: {
    name: 'Bublinový štít',
    emoji: '🛡️',
    description: 'Nafoukne kolem figurky energetickou bublinu, která odrazí příští útok soupeře!',
    color: '#06b6d4',
    durationText: 'Do 1. zásahu soupeřem',
  },
  magic_mirror: {
    name: 'Kouzelné zrcadlo',
    emoji: '🪞',
    description: 'Chrání před pastmi a pokud na figurku zaútočí soupeř, odrazí útok a vyhodí útočníka!',
    color: '#8b5cf6',
    durationText: 'Do 1. napadení',
  },
  speed_potion: {
    name: 'Lektvar zrychlení',
    emoji: '⚡',
    description: 'Okamžitý příval turbo energie – hráč po tomto tahu hraje hned ještě jednou!',
    color: '#22c55e',
    durationText: 'Okamžitý tah navíc',
  },
  lightning_rod: {
    name: 'Blesková hůl',
    emoji: '⚡',
    description: 'Nabije figurku elektřinou! Umožní provést dalekonosný útok po celé linii jako věž.',
    color: '#eab308',
    durationText: '1 tah (paprsek věže)',
  },
  magnet: {
    name: 'Super Magnet',
    emoji: '🧲',
    description: 'Přitáhne nejbližší bonusy a předměty ze šachovnice přímo pod nohy!',
    color: '#ec4899',
    durationText: 'Okamžitý efekt',
  },
};

export function generateInitialTraps(count: number = 6): Trap[] {
  const traps: Trap[] = [];
  const trapTypes: TrapType[] = ['banana', 'spring', 'teleport', 'freeze', 'swap', 'confetti_pop', 'tnt', 'glue'];
  const possibleCoords: { r: number; c: number }[] = [];

  for (let r = 2; r <= 5; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      possibleCoords.push({ r, c });
    }
  }

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
      revealed: false,
    });
  });

  return traps;
}

export function generateBonusItem(
  board: (Piece | null)[][],
  existingItems: BonusItem[],
  traps: Trap[]
): BonusItem | null {
  const itemTypes: ItemType[] = [
    'rocket_boots',
    'mega_hammer',
    'bubble_shield',
    'magic_mirror',
    'speed_potion',
    'lightning_rod',
    'magnet',
  ];
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
  swappedTarget?: { piece: Piece; fromRow: number; fromCol: number; toRow: number; toCol: number };
  bonusCaptured?: Piece | null;
  stunnedVictims?: { row: number; col: number }[];
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
  let swappedTarget: TrapResolutionResult['swappedTarget'] = undefined;
  let bonusCaptured: Piece | null = null;
  const stunnedVictims: { row: number; col: number }[] = [];

  if (
    updatedPiece.equippedItem === 'magic_mirror' &&
    (trap.type === 'banana' || trap.type === 'freeze' || trap.type === 'teleport' || trap.type === 'tnt' || trap.type === 'glue')
  ) {
    soundEngine.playShield();
    updatedPiece.equippedItem = null;
    updatedPiece.shield = true;
    return {
      finalRow,
      finalCol,
      updatedPiece,
      notification: {
        id: `mirror-trap-${Date.now()}`,
        text: `Kouzelné zrcadlo odrazilo past ${info.name}!`,
        emoji: '🪞',
        color: '#8b5cf6',
      },
      logText: 'Kouzelné zrcadlo odrazilo past a proměnilo ji ve štít!',
    };
  }

  let logText = `${piece.color === 'white' ? 'Bílý' : 'Černý'} ${piece.type} šlápl na past: ${info.emoji} ${info.name}!`;

  switch (trap.type) {
    case 'banana': {
      soundEngine.playBanana();
      updatedPiece.isDizzy = true;
      const stepR = dr !== 0 ? Math.sign(dr) : piece.color === 'white' ? -1 : 1;
      const stepC = dc !== 0 ? Math.sign(dc) : 0;
      const slipR = trap.row + stepR;
      const slipC = trap.col + stepC;

      if (isInsideBoard(slipR, slipC)) {
        const obstacle = board[slipR][slipC];
        if (!obstacle) {
          finalRow = slipR;
          finalCol = slipC;
          logText += ' Šup! Uklouzl o políčko dál!';
        } else if (obstacle.color !== piece.color && obstacle.type !== 'king' && !obstacle.shield) {
          bonusCaptured = obstacle;
          finalRow = slipR;
          finalCol = slipC;
          logText += ' Při uklouznutí srazil soupeřovu figurku jako kuželku!';
        } else {
          const sideCols = [trap.col - 1, trap.col + 1];
          const freeCol = sideCols.find((c) => isInsideBoard(trap.row, c) && !board[trap.row][c]);
          if (freeCol !== undefined) {
            finalRow = trap.row;
            finalCol = freeCol;
            logText += ' Uklouzl bokem na vedlejší pole!';
          } else {
            logText += ' Zatočila se mu hlava a udělal piruetu na místě!';
          }
        }
      }
      break;
    }

    case 'spring': {
      soundEngine.playSpring();
      const stepR = dr !== 0 ? Math.sign(dr) : piece.color === 'white' ? -1 : 1;
      const stepC = dc !== 0 ? Math.sign(dc) : 0;
      const jump2R = trap.row + stepR * 2;
      const jump2C = trap.col + stepC * 2;
      const jump1R = trap.row + stepR;
      const jump1C = trap.col + stepC;

      if (isInsideBoard(jump2R, jump2C) && !board[jump2R][jump2C]) {
        finalRow = jump2R;
        finalCol = jump2C;
        logText += ' BOING! Vystřelen o 2 pole dopředu!';
      } else if (
        isInsideBoard(jump2R, jump2C) &&
        board[jump2R][jump2C] &&
        board[jump2R][jump2C]!.color !== piece.color &&
        board[jump2R][jump2C]!.type !== 'king' &&
        !board[jump2R][jump2C]!.shield
      ) {
        bonusCaptured = board[jump2R][jump2C];
        finalRow = jump2R;
        finalCol = jump2C;
        logText += ' BOING! Pružina ho vystřelila přímo na soupeře!';
      } else if (isInsideBoard(jump1R, jump1C) && !board[jump1R][jump1C]) {
        finalRow = jump1R;
        finalCol = jump1C;
        logText += ' BOING! Odrazil se o pole vpřed!';
      } else {
        logText += ' Vystřelil vysoko do vzduchu a dopadl zpět!';
      }
      break;
    }

    case 'teleport': {
      soundEngine.playTeleport();
      const empties: { r: number; c: number }[] = [];
      for (let r = 1; r < BOARD_SIZE - 1; r++) {
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
        logText += ` Teleportoval se červí dírou na pole ${String.fromCharCode(65 + target.c)}${8 - target.r}!`;
      }
      break;
    }

    case 'freeze': {
      soundEngine.playFreeze();
      if (piece.type === 'king') {
        updatedPiece.isDizzy = true;
        logText += ' Král se otřásl zimou, ale královský plášť ho zahřál!';
      } else {
        updatedPiece.frozenTurns = 1;
        logText += ' Celý zamrzl v kostce ledu a příští tah vynechává!';
      }
      break;
    }

    case 'swap': {
      soundEngine.playTeleport();
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
        finalRow = swapTarget.r;
        finalCol = swapTarget.c;
        const enemyCopy: Piece = {
          ...swapTarget.piece,
          row: trap.row,
          col: trap.col,
        };
        board[trap.row][trap.col] = enemyCopy;
        swappedTarget = {
          piece: enemyCopy,
          fromRow: swapTarget.r,
          fromCol: swapTarget.c,
          toRow: trap.row,
          toCol: trap.col,
        };
        logText += ` Vyměnil si pozici s nepřátelským ${swapTarget.piece.type}!`;
      }
      break;
    }

    case 'confetti_pop': {
      soundEngine.playVictory();
      updatedPiece.shield = true;
      logText += ' Oslava! Získal ochranný bublinový štít!';
      break;
    }

    case 'tnt': {
      soundEngine.playHammerSmash();
      updatedPiece.isDizzy = true;
      // Stun all adjacent pieces
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = trap.row + dr;
          const nc = trap.col + dc;
          if (isInsideBoard(nr, nc)) {
            const victim = board[nr][nc];
            if (victim) {
              victim.isDizzy = true;
              if (victim.type !== 'king') {
                victim.frozenTurns = 1;
              }
              stunnedVictims.push({ row: nr, col: nc });
            }
          }
        }
      }
      logText += ' KABOOM! Tlaková vlna omráčila všechny okolo!';
      break;
    }

    case 'glue': {
      soundEngine.playStep();
      updatedPiece.isSlimeStuck = true;
      logText += ' Plác! Figurka uvízla v lepkavém slizu a na 1 tah může udělat jen 1 krok!';
      break;
    }
  }

  const effectText = logText.substring(logText.indexOf(info.name) + info.name.length + 1).trim();
  const notification: FloatingNotification = {
    id: `notif-${Date.now()}-${Math.random()}`,
    text: `${info.name}! ${effectText || info.description}`,
    emoji: info.emoji,
    color: info.color,
  };

  return {
    finalRow,
    finalCol,
    updatedPiece,
    swappedTarget,
    bonusCaptured,
    stunnedVictims,
    notification,
    logText,
  };
}
