/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Piece,
  PieceColor,
  Move,
  Trap,
  BonusItem,
  GameMode,
  AIDifficulty,
  BoardTheme,
  FloatingNotification,
  PeerMessage,
} from './types/game';
import {
  createInitialBoard,
  getLegalMoves,
  evaluateGameStatus,
  selectAIMove,
  cloneBoard,
  isInsideBoard,
} from './game/chessLogic';
import {
  generateInitialTraps,
  generateBonusItem,
  handleTrapTrigger,
  ITEM_CONFIG,
} from './game/trapsAndItems';
import { getRandomQuote, CharacterQuote } from './game/characterQuotes';
import { soundEngine } from './audio/soundEngine';
import { voiceEngine } from './audio/voiceEngine';
import { peerMultiplayer } from './network/peerMultiplayer';
import { checkForGitHubUpdate, AppReleaseInfo } from './services/updateService';
import { ChessScene } from './three/ChessScene';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { SettingsModal } from './components/SettingsModal';
import { UpdateModal } from './components/UpdateModal';

interface BoardHistoryEntry {
  board: (Piece | null)[][];
  currentTurn: PieceColor;
  turnNumber: number;
  traps: Trap[];
  bonusItems: BonusItem[];
  capturedWhite: Piece[];
  capturedBlack: Piece[];
}

export default function App() {
  const [screen, setScreen] = useState<'title' | 'playing'>('title');

  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [theme, setTheme] = useState<BoardTheme>('royal_wood');
  const [trapCount, setTrapCount] = useState<number>(6);
  const [bonusItemsEnabled, setBonusItemsEnabled] = useState<boolean>(true);

  const [board, setBoard] = useState<(Piece | null)[][]>(createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('white');
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<Piece[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<Piece[]>([]);

  const [traps, setTraps] = useState<Trap[]>([]);
  const [bonusItems, setBonusItems] = useState<BonusItem[]>([]);

  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [isCheckmate, setIsCheckmate] = useState<boolean>(false);
  const [isStalemate, setIsStalemate] = useState<boolean>(false);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);

  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [myColor, setMyColor] = useState<PieceColor>('white');
  const [isMultiplayerConnected, setIsMultiplayerConnected] = useState<boolean>(false);

  const [activeCameraView, setActiveCameraView] = useState<'iso' | 'white' | 'black' | 'top'>('iso');
  const [isFlyInActive, setIsFlyInActive] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<FloatingNotification[]>([]);
  const [currentQuote, setCurrentQuote] = useState<CharacterQuote | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [isMusicOn, setIsMusicOn] = useState<boolean>(soundEngine.isMusicOn());
  const [isVoiceOn, setIsVoiceOn] = useState<boolean>(voiceEngine.isEnabled());

  const [releaseInfo, setReleaseInfo] = useState<AppReleaseInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);

  const historyRef = useRef<BoardHistoryEntry[]>([]);
  const quoteTimerRef = useRef<number | null>(null);
  const isAiThinkingRef = useRef<boolean>(false);
  const moveSeqRef = useRef<number>(0);

  const runUpdateCheck = useCallback(async (manual = false) => {
    setIsCheckingUpdate(true);
    try {
      const info = await checkForGitHubUpdate();
      setReleaseInfo(info);
      if (manual || info.hasUpdate) {
        setIsUpdateModalOpen(true);
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  useEffect(() => {
    runUpdateCheck(false);
    const interval = setInterval(() => runUpdateCheck(false), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runUpdateCheck]);

  // Trigger character quote and queue speech so voices never get interrupted mid-sentence!
  const triggerCharacterQuote = useCallback((quote: CharacterQuote, priority = false) => {
    setCurrentQuote(quote);
    voiceEngine.speak(quote.text, quote.pieceType || 'pawn', priority, () => {
      // Speech finished
    });

    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = window.setTimeout(() => {
      setCurrentQuote(null);
    }, 4200);
  }, []);

  const addNotification = useCallback((notif: FloatingNotification) => {
    setNotifications((prev) => [...prev, notif]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }, notif.duration || 2800);
  }, []);

  const startNewGame = useCallback(
    (mode: GameMode, diff: AIDifficulty, th: BoardTheme) => {
      const initialBoard = createInitialBoard();
      const initialTraps = generateInitialTraps(trapCount);
      const initialItems: BonusItem[] = bonusItemsEnabled
        ? [generateBonusItem(initialBoard, [], initialTraps)!].filter(Boolean)
        : [];

      setBoard(initialBoard);
      setCurrentTurn('white');
      setTurnNumber(1);
      setSelectedSquare(null);
      setLegalMoves([]);
      setLastMove(null);
      setCapturedWhite([]);
      setCapturedBlack([]);
      setTraps(initialTraps);
      setBonusItems(initialItems);
      setIsCheck(false);
      setIsCheckmate(false);
      setIsStalemate(false);
      setWinner(null);
      setIsAiThinking(false);
      isAiThinkingRef.current = false;
      setGameMode(mode);
      setAiDifficulty(diff);
      setTheme(th);
      setCurrentQuote(null);
      historyRef.current = [];
      setIsFlyInActive(true);

      setScreen('playing');
      soundEngine.playSelect();
      soundEngine.playFlyIn();
    },
    [trapCount, bonusItemsEnabled]
  );

  const saveHistory = useCallback(() => {
    historyRef.current.push({
      board: cloneBoard(board),
      currentTurn,
      turnNumber,
      traps: traps.map((t) => ({ ...t })),
      bonusItems: [...bonusItems],
      capturedWhite: [...capturedWhite],
      capturedBlack: [...capturedBlack],
    });
  }, [board, currentTurn, turnNumber, traps, bonusItems, capturedWhite, capturedBlack]);

  const executeMove = useCallback(
    (
      from: { row: number; col: number },
      to: { row: number; col: number },
      isRemote: boolean = false
    ) => {
      const movingPiece = board[from.row][from.col];
      if (!movingPiece) return;

      saveHistory();

      const newBoard = cloneBoard(board);
      let capturedPiece = newBoard[to.row][to.col];
      let trapTriggered: Trap | null = null;
      let itemCollected: BonusItem | null = null;
      let trapDesc = '';
      let moveEffect: Move['effect'] = 'normal';
      let extraTurnGranted = false;
      let attackTarget = { ...to };
      const stunnedSquares: { row: number; col: number }[] = [];

      const usedItem = movingPiece.equippedItem;

      // 1. Attack Target Defense Checks (Magic Mirror & Bubble Shield)
      if (capturedPiece) {
        if (capturedPiece.equippedItem === 'magic_mirror') {
          soundEngine.playMirror();
          capturedPiece.equippedItem = null;
          moveEffect = 'mirror_reflect';

          if (movingPiece.color === 'white') {
            setCapturedWhite((prev) => [...prev, movingPiece]);
          } else {
            setCapturedBlack((prev) => [...prev, movingPiece]);
          }
          newBoard[from.row][from.col] = null;

          addNotification({
            id: `mirror-${Date.now()}`,
            text: 'Kouzelné zrcadlo odrazilo útok a zničilo útočníka!',
            emoji: '🪞',
            color: '#8b5cf6',
          });

          const mirrorQuote = getRandomQuote(capturedPiece.type, 'mirror_reflect');
          triggerCharacterQuote(mirrorQuote, false);

          const nextTurn: PieceColor = currentTurn === 'white' ? 'black' : 'white';
          const status = evaluateGameStatus(newBoard, nextTurn);
          setIsCheck(status.isCheck);
          setIsCheckmate(status.isCheckmate);
          setIsStalemate(status.isStalemate);
          if (status.isCheckmate) setWinner(currentTurn === 'white' ? 'black' : 'white');

          moveSeqRef.current++;
          const moveObj: Move = {
            from,
            to: from,
            piece: movingPiece,
            captured: movingPiece,
            effect: 'mirror_reflect',
            attackTarget: to,
            seq: moveSeqRef.current,
          };

          setBoard(newBoard);
          setCurrentTurn(nextTurn);
          setTurnNumber((prev) => prev + 1);
          setSelectedSquare(null);
          setLegalMoves([]);
          setLastMove(moveObj);

          if (gameMode === 'multiplayer' && !isRemote) {
            peerMultiplayer.sendMessage({ type: 'MOVE', move: moveObj, nextTurn });
          }
          return;
        }

        if (capturedPiece.shield) {
          soundEngine.playShield();
          capturedPiece.shield = false;
          moveEffect = 'shield_block';

          addNotification({
            id: `shield-${Date.now()}`,
            text: 'Bublinový štít odrazil útok!',
            emoji: '🛡️',
            color: '#38bdf8',
          });

          const shieldQuote = getRandomQuote(capturedPiece.type, 'shield_block');
          triggerCharacterQuote(shieldQuote, false);

          const nextTurn: PieceColor = currentTurn === 'white' ? 'black' : 'white';
          const status = evaluateGameStatus(newBoard, nextTurn);
          setIsCheck(status.isCheck);
          setIsCheckmate(status.isCheckmate);
          setIsStalemate(status.isStalemate);

          moveSeqRef.current++;
          const moveObj: Move = {
            from,
            to: from,
            piece: movingPiece,
            captured: null,
            effect: 'shield_block',
            attackTarget: to,
            seq: moveSeqRef.current,
          };

          setBoard(newBoard);
          setCurrentTurn(nextTurn);
          setTurnNumber((prev) => prev + 1);
          setSelectedSquare(null);
          setLegalMoves([]);
          setLastMove(moveObj);

          if (gameMode === 'multiplayer' && !isRemote) {
            peerMultiplayer.sendMessage({ type: 'MOVE', move: moveObj, nextTurn });
          }
          return;
        }
      }

      // Handle normal capture
      if (capturedPiece) {
        if (capturedPiece.color === 'white') {
          setCapturedWhite((prev) => [...prev, capturedPiece!]);
        } else {
          setCapturedBlack((prev) => [...prev, capturedPiece!]);
        }
        const capQuote = getRandomQuote(movingPiece.type, 'capture');
        triggerCharacterQuote(capQuote, false);
      } else {
        if (Math.random() < 0.6) {
          const moveQuote = getRandomQuote(movingPiece.type, 'move');
          triggerCharacterQuote(moveQuote, false);
        }
      }

      // 2. Consume one-time items on move
      if (usedItem === 'mega_hammer') {
        moveEffect = 'hammer_smash';
        soundEngine.playHammerSmash();

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = to.row + dr;
            const nc = to.col + dc;
            if (isInsideBoard(nr, nc)) {
              const enemy = newBoard[nr][nc];
              if (enemy && enemy.color !== movingPiece.color && enemy.type !== 'king') {
                enemy.isDizzy = true;
                enemy.frozenTurns = 1;
                stunnedSquares.push({ row: nr, col: nc });
              }
            }
          }
        }

        addNotification({
          id: `hammer-${Date.now()}`,
          text: 'Mega Kladivo! Tlaková vlna omráčila okolní nepřátele!',
          emoji: '🔨',
          color: '#f59e0b',
        });
      } else if (usedItem === 'rocket_boots') {
        moveEffect = 'rocket_jump';
        soundEngine.playRocket();
        addNotification({
          id: `rocket-${Date.now()}`,
          text: 'Raketový skok úspěšně dokončen!',
          emoji: '🚀',
          color: '#ef4444',
        });
      } else if (usedItem === 'lightning_rod') {
        moveEffect = 'lightning_strike';
        soundEngine.playSpeedBoost();
        addNotification({
          id: `lightning-${Date.now()}`,
          text: 'Bleskový útok! Projel celou linii!',
          emoji: '⚡',
          color: '#eab308',
        });
      }

      newBoard[from.row][from.col] = null;
      const pieceCopy: Piece = {
        ...movingPiece,
        row: to.row,
        col: to.col,
        hasMoved: true,
        equippedItem: null,
        isSlimeStuck: false, // moving clears glue
      };
      newBoard[to.row][to.col] = pieceCopy;

      let finalRow = to.row;
      let finalCol = to.col;

      // 3. Trap Check
      const activeTrapIdx = traps.findIndex((t) => t.row === to.row && t.col === to.col);
      if (activeTrapIdx !== -1) {
        const trap = traps[activeTrapIdx];
        trapTriggered = trap;

        const updatedTraps = [...traps];
        updatedTraps[activeTrapIdx] = { ...trap, revealed: true };
        setTraps(updatedTraps);

        const dr = to.row - from.row;
        const dc = to.col - from.col;
        const resolution = handleTrapTrigger(newBoard, pieceCopy, trap, dr, dc);

        if (resolution.finalRow !== to.row || resolution.finalCol !== to.col) {
          newBoard[to.row][to.col] = null;
          resolution.updatedPiece.row = resolution.finalRow;
          resolution.updatedPiece.col = resolution.finalCol;
          newBoard[resolution.finalRow][resolution.finalCol] = resolution.updatedPiece;
          finalRow = resolution.finalRow;
          finalCol = resolution.finalCol;
        }

        if (resolution.bonusCaptured) {
          if (resolution.bonusCaptured.color === 'white') {
            setCapturedWhite((prev) => [...prev, resolution.bonusCaptured!]);
          } else {
            setCapturedBlack((prev) => [...prev, resolution.bonusCaptured!]);
          }
        }

        if (resolution.stunnedVictims) {
          stunnedSquares.push(...resolution.stunnedVictims);
        }

        trapDesc = resolution.logText;
        if (resolution.notification) {
          addNotification(resolution.notification);
        }

        const trapQuote = getRandomQuote(pieceCopy.type, 'trap', { trapType: trap.type });
        triggerCharacterQuote(trapQuote, false);
      }

      // 4. Bonus Item Check
      const activeItemIdx = bonusItems.findIndex((it) => it.row === finalRow && it.col === finalCol);
      if (activeItemIdx !== -1) {
        const item = bonusItems[activeItemIdx];
        itemCollected = item;
        soundEngine.playItemPickup();

        const currentP = newBoard[finalRow][finalCol]!;

        if (item.type === 'bubble_shield') {
          currentP.shield = true;
        } else if (item.type === 'speed_potion') {
          soundEngine.playSpeedBoost();
          extraTurnGranted = true;
        } else if (item.type === 'magnet') {
          soundEngine.playTeleport();
          // Pull other bonus items closer if any
          bonusItems.forEach((b) => {
            if (b !== item) {
              b.row = Math.max(0, Math.min(7, Math.round((b.row + finalRow) / 2)));
              b.col = Math.max(0, Math.min(7, Math.round((b.col + finalCol) / 2)));
            }
          });
          currentP.equippedItem = 'speed_potion'; // Grants quick boost
        } else {
          currentP.equippedItem = item.type;
        }

        setBonusItems((prev) => prev.filter((_, i) => i !== activeItemIdx));
        const info = ITEM_CONFIG[item.type];
        addNotification({
          id: `item-${Date.now()}`,
          text: `Získán bonus: ${info.name}! (${info.durationText})`,
          emoji: info.emoji,
          color: info.color,
        });

        const itemQuote = getRandomQuote(currentP.type, 'item', { itemType: item.type });
        triggerCharacterQuote(itemQuote, false);
      }

      // 5. Pawn Promotion Check
      if (pieceCopy.type === 'pawn') {
        const promoRow = pieceCopy.color === 'white' ? 0 : 7;
        if (finalRow === promoRow) {
          newBoard[finalRow][finalCol]!.type = 'queen';
          soundEngine.playVictory();
          addNotification({
            id: `promo-${Date.now()}`,
            text: 'Povýšení na Dámu!',
            emoji: '👑',
            color: '#facc15',
          });
          const promoQuote = getRandomQuote('queen', 'promotion');
          triggerCharacterQuote(promoQuote, false);
        }
      }

      // 6. Spawn Bonus Items
      if (bonusItemsEnabled && Math.random() < 0.28 && bonusItems.length < 3) {
        const newItem = generateBonusItem(newBoard, bonusItems, traps);
        if (newItem) {
          setBonusItems((prev) => [...prev, newItem]);
        }
      }

      // Decrement frozen turns for pieces of current player
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = newBoard[r][c];
          if (p && p.color === currentTurn && p !== pieceCopy) {
            if (p.frozenTurns && p.frozenTurns > 0) {
              p.frozenTurns--;
            }
            if (p.isDizzy) {
              p.isDizzy = false;
            }
          }
        }
      }

      // 7. Next Turn Calculation
      const nextTurn: PieceColor = extraTurnGranted
        ? currentTurn
        : currentTurn === 'white'
        ? 'black'
        : 'white';

      const status = evaluateGameStatus(newBoard, nextTurn);
      setIsCheck(status.isCheck);
      setIsCheckmate(status.isCheckmate);
      setIsStalemate(status.isStalemate);

      if (status.isCheck) {
        soundEngine.playCheck();
        addNotification({
          id: `check-${Date.now()}`,
          text: 'ŠACH! Král je v ohrožení!',
          emoji: '⚠️',
          color: '#ef4444',
        });
        const kingQuote = getRandomQuote('king', 'check');
        triggerCharacterQuote(kingQuote, false);
      }

      if (status.isCheckmate) {
        setWinner(currentTurn);
      } else if (status.isStalemate) {
        setWinner('draw');
      }

      moveSeqRef.current++;
      const moveObj: Move = {
        from,
        to: { row: finalRow, col: finalCol },
        piece: pieceCopy,
        captured: capturedPiece,
        trapTriggered,
        itemCollected,
        trapEffectDescription: trapDesc,
        effect: moveEffect,
        attackTarget,
        stunnedSquares,
        extraTurn: extraTurnGranted,
        seq: moveSeqRef.current,
      };

      setBoard(newBoard);
      setCurrentTurn(nextTurn);
      setTurnNumber((prev) => prev + 1);
      setSelectedSquare(null);
      setLegalMoves([]);
      setLastMove(moveObj);

      if (gameMode === 'multiplayer' && !isRemote) {
        peerMultiplayer.sendMessage({
          type: 'MOVE',
          move: moveObj,
          nextTurn,
        });
      }
    },
    [
      board,
      currentTurn,
      traps,
      bonusItems,
      bonusItemsEnabled,
      saveHistory,
      addNotification,
      triggerCharacterQuote,
      gameMode,
    ]
  );

  // AI Turn Trigger
  useEffect(() => {
    if (
      screen === 'playing' &&
      gameMode === 'ai' &&
      currentTurn === 'black' &&
      !winner &&
      !isAiThinkingRef.current
    ) {
      isAiThinkingRef.current = true;
      setIsAiThinking(true);

      const timer = window.setTimeout(() => {
        try {
          const aiMove = selectAIMove(board, 'black', traps, bonusItems, aiDifficulty);
          if (aiMove) {
            executeMove(
              { row: aiMove.piece.row, col: aiMove.piece.col },
              aiMove.move
            );
          }
        } finally {
          isAiThinkingRef.current = false;
          setIsAiThinking(false);
        }
      }, 700);

      return () => {
        clearTimeout(timer);
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
      };
    }
  }, [
    screen,
    gameMode,
    currentTurn,
    winner,
    board,
    traps,
    bonusItems,
    aiDifficulty,
    executeMove,
  ]);

  // Handle Square Selection and Clicking
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (winner || isAiThinking) return;

      if (gameMode === 'multiplayer' && currentTurn !== myColor) {
        return;
      }

      if (selectedSquare) {
        const isLegal = legalMoves.some((m) => m.row === row && m.col === col);
        if (isLegal) {
          executeMove(selectedSquare, { row, col });
          return;
        }

        const clickedPiece = board[row][col];
        if (clickedPiece && clickedPiece.color === currentTurn) {
          setSelectedSquare({ row, col });
          const moves = getLegalMoves(board, clickedPiece);
          setLegalMoves(moves);
          soundEngine.playSelect();
          return;
        }

        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const piece = board[row][col];
      if (piece && piece.color === currentTurn) {
        setSelectedSquare({ row, col });
        const moves = getLegalMoves(board, piece);
        setLegalMoves(moves);
        soundEngine.playSelect();

        if (Math.random() < 0.35) {
          const selectQuote = getRandomQuote(piece.type, 'select');
          triggerCharacterQuote(selectQuote, false);
        }
      }
    },
    [
      winner,
      isAiThinking,
      gameMode,
      currentTurn,
      myColor,
      selectedSquare,
      legalMoves,
      board,
      executeMove,
      triggerCharacterQuote,
    ]
  );

  const handleUndoMove = useCallback(() => {
    if (historyRef.current.length === 0 || gameMode === 'multiplayer') return;

    const stepsToUndo = gameMode === 'ai' && currentTurn === 'white' ? 2 : 1;
    let targetEntry: BoardHistoryEntry | null = null;

    for (let i = 0; i < stepsToUndo; i++) {
      if (historyRef.current.length > 0) {
        targetEntry = historyRef.current.pop()!;
      }
    }

    if (targetEntry) {
      setBoard(targetEntry.board);
      setCurrentTurn(targetEntry.currentTurn);
      setTurnNumber(targetEntry.turnNumber);
      setTraps(targetEntry.traps);
      setBonusItems(targetEntry.bonusItems);
      setCapturedWhite(targetEntry.capturedWhite);
      setCapturedBlack(targetEntry.capturedBlack);
      setSelectedSquare(null);
      setLegalMoves([]);
      setLastMove(null);
      setWinner(null);
      setIsCheck(false);
      setIsCheckmate(false);
      setIsAiThinking(false);
      isAiThinkingRef.current = false;
      soundEngine.playSelect();
    }
  }, [gameMode, currentTurn]);

  const handleSendEmote = useCallback(
    (emoji: string, text: string) => {
      addNotification({
        id: `emote-${Date.now()}`,
        text,
        emoji,
        color: '#facc15',
      });

      if (gameMode === 'multiplayer') {
        peerMultiplayer.sendMessage({
          type: 'EMOTE',
          emoji,
          text,
          sender: myColor,
        });
      }
    },
    [addNotification, gameMode, myColor]
  );

  const handleHostRoom = useCallback(async () => {
    return peerMultiplayer.init({
      onConnected: () => {
        setMyColor('white');
        setGameMode('multiplayer');
      },
      onOpponentJoined: () => {
        setIsMultiplayerConnected(true);
        setIsMultiplayerOpen(false);
        startNewGame('multiplayer', 'medium', theme);
        addNotification({
          id: `opp-joined-${Date.now()}`,
          text: 'Protihráč se připojil! Bitva začíná!',
          emoji: '🎉',
          color: '#10b981',
        });
      },
      onMessage: (msg: PeerMessage) => {
        if (msg.type === 'MOVE') {
          executeMove(msg.move.from, msg.move.to, true);
        } else if (msg.type === 'EMOTE') {
          addNotification({
            id: `remote-emote-${Date.now()}`,
            text: msg.text,
            emoji: msg.emoji,
            color: '#f43f5e',
          });
        }
      },
      onDisconnected: () => {
        setIsMultiplayerConnected(false);
        addNotification({
          id: `disc-${Date.now()}`,
          text: 'Protihráč se odpojil.',
          emoji: '🔌',
          color: '#ef4444',
        });
      },
      onError: (err) => {
        console.error(err);
      },
    });
  }, [theme, startNewGame, addNotification, executeMove]);

  const handleJoinRoom = useCallback(
    async (code: string) => {
      return peerMultiplayer.joinRoom(code, {
        onConnected: () => {
          setMyColor('black');
          setGameMode('multiplayer');
          setIsMultiplayerConnected(true);
          startNewGame('multiplayer', 'medium', theme);
          setActiveCameraView('black');
          addNotification({
            id: `joined-ok-${Date.now()}`,
            text: 'Připojeno k hostiteli! Hraješ za Černé.',
            emoji: '⚔️',
            color: '#10b981',
          });
        },
        onOpponentJoined: () => {},
        onMessage: (msg: PeerMessage) => {
          if (msg.type === 'MOVE') {
            executeMove(msg.move.from, msg.move.to, true);
          } else if (msg.type === 'EMOTE') {
            addNotification({
              id: `remote-emote-${Date.now()}`,
              text: msg.text,
              emoji: msg.emoji,
              color: '#f43f5e',
            });
          }
        },
        onDisconnected: () => {
          setIsMultiplayerConnected(false);
          addNotification({
            id: `disc-${Date.now()}`,
            text: 'Hostitel ukončil spojení.',
            emoji: '🔌',
            color: '#ef4444',
          });
        },
        onError: (err) => {
          console.error(err);
        },
      });
    },
    [theme, startNewGame, addNotification, executeMove]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Fredoka',sans-serif]">
      {/* 3D Scene Viewport */}
      <ChessScene
        board={board}
        selectedSquare={selectedSquare}
        legalMoves={legalMoves}
        lastMove={lastMove}
        traps={traps}
        bonusItems={bonusItems}
        currentTurn={currentTurn}
        theme={theme}
        isCheck={isCheck}
        winner={winner}
        activeCameraView={activeCameraView}
        isFlyInActive={isFlyInActive}
        onFlyInFinished={() => setIsFlyInActive(false)}
        onSquareClick={handleSquareClick}
      />

      {/* Cinematic Fly-In Intro Banner */}
      {isFlyInActive && screen === 'playing' && (
        <div className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-center animate-in zoom-in-75 fade-in duration-300">
          <div className="rotate-[-2deg] bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-['Bangers'] text-4xl sm:text-6xl tracking-wider px-8 py-3.5 rounded-3xl border-3 border-black shadow-[0_15px_40px_rgba(245,158,11,0.5)]">
            ⚔️ BITVA ZAČÍNÁ! ⚔️
          </div>
          <span className="text-white font-bold text-xs sm:text-sm uppercase bg-black/80 px-4 py-1.5 rounded-full mt-3 border border-white/20 animate-pulse">
            Přílet na šachovnici... (Klepnutím přeskočíte)
          </span>
        </div>
      )}

      {/* Screen 1: Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          onStartGame={startNewGame}
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUpdates={() => setIsUpdateModalOpen(true)}
          hasUpdateAvailable={releaseInfo?.hasUpdate}
        />
      )}

      {/* Screen 2: In-Game HUD */}
      {screen === 'playing' && (
        <GameHUD
          currentTurn={currentTurn}
          turnNumber={turnNumber}
          isCheck={isCheck}
          capturedWhite={capturedWhite}
          capturedBlack={capturedBlack}
          gameMode={gameMode}
          notifications={notifications}
          currentQuote={currentQuote}
          activeCameraView={activeCameraView}
          isMuted={isMuted}
          isMusicOn={isMusicOn}
          isVoiceOn={isVoiceOn}
          isAiThinking={isAiThinking}
          myColor={myColor}
          onCameraChange={(view) => setActiveCameraView(view)}
          onUndoMove={handleUndoMove}
          onToggleSound={() => {
            const next = !isMuted;
            setIsMuted(next);
            soundEngine.setMuted(next);
          }}
          onToggleMusic={() => {
            const next = soundEngine.toggleMusic();
            setIsMusicOn(next);
          }}
          onToggleVoice={() => {
            const next = !isVoiceOn;
            setIsVoiceOn(next);
            voiceEngine.setEnabled(next);
          }}
          onSendEmote={handleSendEmote}
          onReturnToTitle={() => {
            soundEngine.playSelect();
            setScreen('title');
          }}
          onRestartGame={() => startNewGame(gameMode, aiDifficulty, theme)}
          onDismissQuote={() => setCurrentQuote(null)}
          onChangeGameMode={(newMode) => {
            if (newMode === 'multiplayer') {
              setIsMultiplayerOpen(true);
            } else {
              startNewGame(newMode, aiDifficulty, theme);
            }
          }}
          onOpenUpdates={() => setIsUpdateModalOpen(true)}
          hasUpdateAvailable={releaseInfo?.hasUpdate}
        />
      )}

      {/* Victory / Game Over Modal */}
      <GameOverModal
        winner={winner}
        isCheckmate={isCheckmate}
        turnNumber={turnNumber}
        onRematch={() => startNewGame(gameMode, aiDifficulty, theme)}
        onReturnToTitle={() => {
          setWinner(null);
          setScreen('title');
        }}
      />

      {/* Multiplayer Setup Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        onHostRoom={handleHostRoom}
        onJoinRoom={handleJoinRoom}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={setTheme}
        trapCount={trapCount}
        onChangeTrapCount={setTrapCount}
        bonusItemsEnabled={bonusItemsEnabled}
        onToggleBonusItems={() => setBonusItemsEnabled(!bonusItemsEnabled)}
      />

      {/* GitHub Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        releaseInfo={releaseInfo}
        isChecking={isCheckingUpdate}
        onCheckAgain={() => runUpdateCheck(true)}
      />
    </div>
  );
}
