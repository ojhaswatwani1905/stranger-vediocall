import { Server as SocketIOServer, Socket } from 'socket.io';
import { roomManager } from '../managers/RoomManager';
import { peerManager, Peer } from '../managers/PeerManager';
import { transportManager } from '../managers/TransportManager';

export function setupSocketHandler(io: SocketIOServer): void {
  roomManager.setSocketIO(io);

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    /**
     * Register socket with a custom PeerID room for P2P/WebRTC signaling routing
     */
    socket.on('register-peer', ({ peerId }) => {
      if (peerId) {
        console.log(`[Socket.IO] Socket ${socket.id} registered peerId room: ${peerId}`);
        socket.join(peerId);
      }
    });

    /**
     * Pass-through signaling relay for WebRTC & chat app events
     */
    socket.on('signaling-event', ({ type, payload }) => {
      console.log(`[Signaling Relay] Type: ${type} from ${socket.id}`, payload?.targetPeerId || payload?.roomId || 'broadcast');
      if (payload && payload.targetPeerId) {
        socket.to(payload.targetPeerId).emit('signaling-event', { type, payload });
      } else if (payload && payload.roomId) {
        socket.to(payload.roomId).emit('signaling-event', { type, payload });
      } else {
        socket.broadcast.emit('signaling-event', { type, payload });
      }
    });

    /**
     * Join Room
     */
    socket.on('join-room', async ({ roomId, displayName }, callback) => {
      try {
        console.log(`[Signaling] Peer "${displayName}" (${socket.id}) joining room "${roomId}"`);

        const room = await roomManager.getOrCreateRoom(roomId);
        const peer = peerManager.addPeer(socket.id, displayName || 'Stranger', roomId);

        socket.join(roomId);

        // Get list of existing peers and their producers in room
        const existingPeersInRoom = peerManager.getPeersInRoom(roomId).filter((p) => p.socketId !== socket.id);
        
        const existingPeersData = existingPeersInRoom.map((p) => ({
          socketId: p.socketId,
          displayName: p.displayName,
          producers: Array.from(p.producers.values()).map((prod) => ({
            id: prod.id,
            kind: prod.kind,
            appData: prod.appData,
          })),
        }));

        // Notify other room members
        socket.to(roomId).emit('user-joined', {
          socketId: socket.id,
          displayName: peer.displayName,
        });

        callback({
          success: true,
          routerRtpCapabilities: room ? room.router.rtpCapabilities : null,
          existingPeers: existingPeersData,
        });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Signaling] Error joining room: ${errMessage}`);
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Get Room Producers
     */
    socket.on('get-room-producers', async ({ roomId }, callback) => {
      try {
        const peers = peerManager.getPeersInRoom(roomId).filter((p) => p.socketId !== socket.id);
        const producers: Array<{ producerId: string; socketId: string; displayName: string; appData: Record<string, unknown> }> = [];

        for (const p of peers) {
          for (const prod of Array.from(p.producers.values())) {
            producers.push({
              producerId: prod.id,
              socketId: p.socketId,
              displayName: p.displayName,
              appData: prod.appData,
            });
          }
        }
        callback({ success: true, producers });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        callback({ success: false, error: errMessage, producers: [] });
      }
    });

    /**
     * Get Router RTP Capabilities
     */
    socket.on('get-router-rtp-capabilities', async ({ roomId }, callback) => {
      try {
        const room = await roomManager.getOrCreateRoom(roomId);
        callback({ success: true, routerRtpCapabilities: room ? room.router.rtpCapabilities : null });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Create WebRtcTransport (Send or Receive)
     */
    socket.on('create-transport', async ({ roomId, direction }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const room = roomManager.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        const { transport, params } = await transportManager.createWebRtcTransport(
          room.router,
          socket.id,
          direction
        );

        if (direction === 'send') {
          peer.sendTransport = transport;
        } else {
          peer.recvTransport = transport;
        }

        callback({ success: true, params });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Signaling] Error creating transport: ${errMessage}`);
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Connect WebRtcTransport
     */
    socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const transport =
          peer.sendTransport?.id === transportId
            ? peer.sendTransport
            : peer.recvTransport?.id === transportId
            ? peer.recvTransport
            : null;

        if (!transport) throw new Error('Transport not found for peer');

        await transport.connect({ dtlsParameters });
        console.log(`[Signaling] Transport connected successfully [ID: ${transportId}]`);

        callback({ success: true });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Signaling] Error connecting transport: ${errMessage}`);
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Produce Media Track (Audio, Video, Screen)
     */
    socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        if (!peer.sendTransport || peer.sendTransport.id !== transportId) {
          throw new Error('Send transport mismatch or not initialized');
        }

        const producer = await peer.sendTransport.produce({
          kind,
          rtpParameters,
          appData,
        });

        peer.addProducer(producer);
        console.log(`[Signaling] Producer created [ID: ${producer.id}, Kind: ${kind}] for Peer ${peer.displayName}`);

        // Register audio producer with ActiveSpeakerObserver
        if (kind === 'audio') {
          const room = roomManager.getRoom(peer.roomId);
          if (room) {
            room.activeSpeakerObserver.addProducer({ producerId: producer.id }).catch((err) => {
              console.error('[Signaling] Failed to add audio producer to ActiveSpeakerObserver:', err);
            });
          }
        }

        // Notify other room members about new producer
        socket.to(peer.roomId).emit('new-producer', {
          socketId: peer.socketId,
          displayName: peer.displayName,
          producerId: producer.id,
          kind: producer.kind,
          appData: producer.appData,
        });

        callback({ success: true, id: producer.id });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Signaling] Error producing media: ${errMessage}`);
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Consume Media Track
     */
    socket.on('consume', async ({ roomId, producerId, rtpCapabilities }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const room = roomManager.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        if (!peer.recvTransport) throw new Error('Receive transport not created');

        if (!room.router.canConsume({ producerId, rtpCapabilities })) {
          throw new Error('Router cannot consume producer with client RTP capabilities');
        }

        const consumer = await peer.recvTransport.consume({
          producerId,
          rtpCapabilities,
          paused: true, // Recommended practice: consume paused then resume
        });

        peer.addConsumer(consumer);

        console.log(`[Signaling] Consumer created [ID: ${consumer.id}, Kind: ${consumer.kind}] for Peer ${peer.displayName}`);

        callback({
          success: true,
          id: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          type: consumer.type,
        });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Signaling] Error consuming media: ${errMessage}`);
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Resume Consumer
     */
    socket.on('resume-consumer', async ({ consumerId }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const consumer = peer.getConsumer(consumerId);
        if (!consumer) throw new Error('Consumer not found');

        await consumer.resume();
        console.log(`[Signaling] Consumer ${consumerId} resumed`);

        if (callback) callback({ success: true });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        if (callback) callback({ success: false, error: errMessage });
      }
    });

    /**
     * Set Consumer Preferred Simulcast Layers
     */
    socket.on('set-consumer-preferred-layers', async ({ consumerId, spatialLayer, temporalLayer }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const consumer = peer.getConsumer(consumerId);
        if (!consumer) throw new Error('Consumer not found');

        await consumer.setPreferredLayers({ spatialLayer, temporalLayer });
        console.log(
          `[Signaling] Consumer ${consumerId} preferred layers updated -> Spatial: ${spatialLayer}, Temporal: ${temporalLayer}`
        );

        if (callback) callback({ success: true });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        if (callback) callback({ success: false, error: errMessage });
      }
    });

    /**
     * Pause / Resume Producer (Mute Camera / Mic)
     */
    socket.on('pause-producer', async ({ producerId }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const producer = peer.getProducer(producerId);
        if (!producer) throw new Error('Producer not found');

        await producer.pause();
        socket.to(peer.roomId).emit('producer-paused', { socketId: socket.id, producerId });

        if (callback) callback({ success: true });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        if (callback) callback({ success: false, error: errMessage });
      }
    });

    socket.on('resume-producer', async ({ producerId }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const producer = peer.getProducer(producerId);
        if (!producer) throw new Error('Producer not found');

        await producer.resume();
        socket.to(peer.roomId).emit('producer-resumed', { socketId: socket.id, producerId });

        if (callback) callback({ success: true });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        if (callback) callback({ success: false, error: errMessage });
      }
    });

    /**
     * Close Producer (e.g. Stop Screen Share)
     */
    socket.on('close-producer', async ({ producerId }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (peer) {
          peer.removeProducer(producerId);
          socket.to(peer.roomId).emit('producer-closed', { socketId: socket.id, producerId });
        }
        if (callback) callback({ success: true });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        if (callback) callback({ success: false, error: errMessage });
      }
    });

    /**
     * ICE Restart Trigger
     */
    socket.on('restart-ice', async ({ transportId }, callback) => {
      try {
        const peer = peerManager.getPeer(socket.id);
        if (!peer) throw new Error('Peer not found');

        const transport =
          peer.sendTransport?.id === transportId
            ? peer.sendTransport
            : peer.recvTransport?.id === transportId
            ? peer.recvTransport
            : null;

        if (!transport) throw new Error('Transport not found');

        const iceParameters = await transportManager.restartIce(transport);
        console.log(`[Signaling] ICE restart parameters issued for transport ${transportId}`);

        callback({ success: true, iceParameters });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Signaling] Error in restart-ice: ${errMessage}`);
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Fetch Room Diagnostics / Metrics
     */
    socket.on('get-room-diagnostics', async ({ roomId }, callback) => {
      try {
        const diagnostics = await roomManager.getRoomDiagnostics(roomId);
        callback({ success: true, diagnostics });
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        callback({ success: false, error: errMessage });
      }
    });

    /**
     * Disconnect / Cleanup
     */
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      const peer = peerManager.removePeer(socket.id);
      if (peer) {
        io.to(peer.roomId).emit('user-left', {
          socketId: socket.id,
          displayName: peer.displayName,
        });
        roomManager.closeRoomIfEmpty(peer.roomId);
      }
    });
  });
}
