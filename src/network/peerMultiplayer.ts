/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Peer, DataConnection } from 'peerjs';
import { PeerMessage, PieceColor } from '../types/game';

export interface MultiplayerCallbacks {
  onConnected: (peerId: string, isHost: boolean) => void;
  onOpponentJoined: () => void;
  onMessage: (msg: PeerMessage) => void;
  onDisconnected: () => void;
  onError: (errorText: string) => void;
}

export class PeerMultiplayer {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private isHost: boolean = false;
  private callbacks: MultiplayerCallbacks | null = null;

  public init(
    callbacks: MultiplayerCallbacks,
    customRoomCode?: string
  ): Promise<string> {
    this.cleanup();
    this.callbacks = callbacks;

    return new Promise((resolve, reject) => {
      // Create random 5-char room id or use requested
      const roomId =
        customRoomCode ||
        `wchess-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      try {
        this.peer = new Peer(roomId, {
          debug: 1,
        });

        this.peer.on('open', (id) => {
          this.isHost = true;
          this.callbacks?.onConnected(id, true);
          resolve(id);
        });

        this.peer.on('connection', (connection) => {
          this.conn = connection;
          this.setupConnectionListeners(connection);
          // Only report the opponent once the data channel is open, otherwise the initial
          // game state sync would be dropped.
          if (connection.open) {
            this.callbacks?.onOpponentJoined();
          } else {
            connection.on('open', () => this.callbacks?.onOpponentJoined());
          }
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error:', err);
          this.callbacks?.onError(err.message || 'Chyba síťového spojení.');
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Join existing room
  public joinRoom(
    roomCode: string,
    callbacks: MultiplayerCallbacks
  ): Promise<void> {
    this.cleanup();
    this.callbacks = callbacks;

    return new Promise((resolve, reject) => {
      try {
        const clientPeerId = `wchess-guest-${Math.random().toString(36).substring(2, 7)}`;
        this.peer = new Peer(clientPeerId, { debug: 1 });

        this.peer.on('open', () => {
          this.isHost = false;
          const targetId = roomCode.startsWith('wchess-') ? roomCode : `wchess-${roomCode.toUpperCase()}`;
          const connection = this.peer!.connect(targetId, { reliable: true });

          this.conn = connection;
          this.setupConnectionListeners(connection);

          connection.on('open', () => {
            this.callbacks?.onConnected(clientPeerId, false);
            resolve();
          });
        });

        this.peer.on('error', (err) => {
          this.callbacks?.onError(err.message || 'Nepodařilo se připojit k místnosti.');
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private setupConnectionListeners(connection: DataConnection) {
    connection.on('data', (data) => {
      if (this.conn !== connection) return;
      const msg = data as PeerMessage;
      this.callbacks?.onMessage(msg);
    });

    connection.on('close', () => {
      if (this.conn !== connection) return; // stale connection
      this.callbacks?.onDisconnected();
    });

    connection.on('error', (err) => {
      this.callbacks?.onError(err.message);
    });
  }

  public sendMessage(msg: PeerMessage) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    }
  }

  public isConnected(): boolean {
    return !!(this.conn && this.conn.open);
  }

  public cleanup() {
    // Detach callbacks first so closing an old connection does not report a disconnect
    const cb = this.callbacks;
    this.callbacks = null;
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.callbacks = cb;
  }
}

export const peerMultiplayer = new PeerMultiplayer();
