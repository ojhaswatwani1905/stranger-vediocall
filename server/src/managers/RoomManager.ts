import { Router, ActiveSpeakerObserver, Producer } from 'mediasoup/node/lib/types';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config';
import { workerManager } from './WorkerManager';
import { peerManager, Peer } from './PeerManager';

export interface Room {
  id: string;
  router: Router;
  workerPid: number;
  activeSpeakerObserver: ActiveSpeakerObserver;
  peers: Map<string, Peer>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private io?: SocketIOServer;

  setSocketIO(io: SocketIOServer): void {
    this.io = io;

    // Register worker crash handler for seamless room router migration
    workerManager.onWorkerCrash((deadPid) => {
      this.handleWorkerCrash(deadPid);
    });
  }

  /**
   * Gets or creates a room with an assigned router from the worker pool.
   */
  async getOrCreateRoom(roomId: string): Promise<Room | null> {
    let room = this.rooms.get(roomId);
    if (room) {
      return room;
    }

    if (!workerManager.hasWorkers()) {
      console.warn(`[RoomManager] No active Mediasoup workers in pool. Room "${roomId}" operating in WebRTC P2P mode.`);
      return null;
    }

    console.log(`[RoomManager] Creating new room "${roomId}"...`);
    const worker = workerManager.getNextWorker();
    const router = await worker.createRouter({
      mediaCodecs: config.mediasoup.routerOptions.mediaCodecs,
    });

    console.log(`[RoomManager] Room "${roomId}" router created [ID: ${router.id}] on Worker PID ${worker.pid}`);

    // Create ActiveSpeakerObserver for dominant speaker detection
    const activeSpeakerObserver = await router.createActiveSpeakerObserver({
      interval: 300, // 300ms evaluation interval
    });

    // Broadcast active speaker updates to room peers
    activeSpeakerObserver.on('dominantspeaker', ({ producer }: { producer: Producer }) => {
      const peer = Array.from(peerManager.getPeersInRoom(roomId)).find((p) =>
        Array.from(p.producers.values()).some((prod) => prod.id === producer.id)
      );

      if (peer && this.io) {
        console.log(`[RoomManager] Dominant active speaker in room "${roomId}": ${peer.displayName} (${peer.socketId})`);
        this.io.to(roomId).emit('active-speaker', {
          socketId: peer.socketId,
          displayName: peer.displayName,
          producerId: producer.id,
        });
      }
    });

    room = {
      id: roomId,
      router,
      workerPid: worker.pid,
      activeSpeakerObserver,
      peers: new Map(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Cleans up room resources when empty.
   */
  closeRoomIfEmpty(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const peers = peerManager.getPeersInRoom(roomId);
    if (peers.length === 0) {
      console.log(`[RoomManager] Room "${roomId}" is empty. Closing router...`);
      room.activeSpeakerObserver.close();
      room.router.close();
      this.rooms.delete(roomId);
    }
  }

  /**
   * Handles Worker crash recovery for rooms hosted on a dead worker.
   */
  private async handleWorkerCrash(deadPid: number): Promise<void> {
    console.warn(`[RoomManager] Worker PID ${deadPid} died. Inspecting rooms for migration...`);

    const affectedRooms = Array.from(this.rooms.values()).filter((r) => r.workerPid === deadPid);

    for (const oldRoom of affectedRooms) {
      const roomId = oldRoom.id;
      console.log(`[RoomManager] Migrating room "${roomId}" from crashed worker PID ${deadPid}...`);

      try {
        // Create new router on a healthy worker from pool
        const newWorker = workerManager.getNextWorker();
        const newRouter = await newWorker.createRouter({
          mediaCodecs: config.mediasoup.routerOptions.mediaCodecs,
        });

        const newActiveSpeakerObserver = await newRouter.createActiveSpeakerObserver({
          interval: 300,
        });

        newActiveSpeakerObserver.on('dominantspeaker', ({ producer }: { producer: Producer }) => {
          const peer = Array.from(peerManager.getPeersInRoom(roomId)).find((p) =>
            Array.from(p.producers.values()).some((prod) => prod.id === producer.id)
          );

          if (peer && this.io) {
            this.io.to(roomId).emit('active-speaker', {
              socketId: peer.socketId,
              displayName: peer.displayName,
              producerId: producer.id,
            });
          }
        });

        // Update room mapping
        oldRoom.router = newRouter;
        oldRoom.workerPid = newWorker.pid;
        oldRoom.activeSpeakerObserver = newActiveSpeakerObserver;

        console.log(`[RoomManager] Room "${roomId}" successfully migrated to Worker PID ${newWorker.pid}`);

        // Emit signal to connected clients to trigger auto-reconnection on new router
        if (this.io) {
          this.io.to(roomId).emit('room-worker-crashed', {
            roomId,
            message: 'Worker hosting room router recovered. Re-establishing WebRTC transports...',
          });
        }
      } catch (err) {
        console.error(`[RoomManager] Failed to migrate room "${roomId}" after worker crash:`, err);
      }
    }
  }

  /**
   * Collects room metrics and stats for debugging network performance.
   */
  async getRoomDiagnostics(roomId: string): Promise<unknown> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const peers = peerManager.getPeersInRoom(roomId);
    const peerStats = [];

    for (const peer of peers) {
      let sendStats = null;
      let recvStats = null;

      if (peer.sendTransport) {
        sendStats = await peer.sendTransport.getStats();
      }
      if (peer.recvTransport) {
        recvStats = await peer.recvTransport.getStats();
      }

      peerStats.push({
        socketId: peer.socketId,
        displayName: peer.displayName,
        producersCount: peer.producers.size,
        consumersCount: peer.consumers.size,
        sendTransportStats: sendStats,
        recvTransportStats: recvStats,
      });
    }

    return {
      roomId,
      workerPid: room.workerPid,
      peersCount: peers.length,
      peerStats,
    };
  }
}

export const roomManager = new RoomManager();
