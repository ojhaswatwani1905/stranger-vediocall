import * as mediasoupClient from 'mediasoup-client';
import { socketService } from './socketService';

export class MediasoupClientService {
  constructor() {
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;

    this.producers = new Map(); // kind ('audio' | 'video' | 'screen') -> Producer
    this.consumers = new Map(); // consumerId -> RemoteConsumerInfo
    this.pendingProducers = []; // Producer queue if recvTransport is not ready

    this.localTracks = {
      audioTrack: null,
      videoTrack: null,
      screenTrack: null,
    };

    this.currentRoomId = '';
    this.currentDisplayName = '';
    this.isReconnecting = false;

    this.onRemoteTrackAdded = null;
    this.onRemoteTrackRemoved = null;
    this.onConnectionStateChange = null;
  }

  /**
   * Initializes the mediasoup-client Device using the server's Router RTP Capabilities.
   */
  async loadDevice(routerRtpCapabilities) {
    if (!this.device) {
      this.device = new mediasoupClient.Device();
    }

    if (!this.device.loaded) {
      await this.device.load({ routerRtpCapabilities });
      console.log('[MediasoupClient] Device loaded successfully. Handler:', this.device.handlerName);
    }

    return this.device;
  }

  /**
   * Joins a room, creates send/recv transports, produces local tracks, and consumes existing room producers.
   */
  async joinRoom(roomId, displayName, localTracks = {}) {
    socketService.connect();
    this.currentRoomId = roomId;
    this.currentDisplayName = displayName;
    this.localTracks = localTracks;
    this.pendingProducers = [];

    // Listen for new producers in the room
    this.unSubNewProducer = socketService.on('new-producer', async ({ producerId, socketId, displayName, appData }) => {
      console.log(`[MediasoupClient] New remote producer announced: ${producerId} from ${displayName}`);
      if (!this.recvTransport) {
        console.log('[MediasoupClient] recvTransport not ready yet, queuing producer:', producerId);
        this.pendingProducers.push({ roomId, producerId, socketId, displayName, appData });
        return;
      }
      try {
        await this.consumeRemoteProducer(roomId, producerId, socketId, displayName, appData);
      } catch (err) {
        console.error('[MediasoupClient] Error consuming new producer:', err);
      }
    });

    this.unSubUserJoined = socketService.on('user-joined', ({ socketId, displayName }) => {
      console.log(`[MediasoupClient] Remote user joined: ${displayName} (${socketId})`);
    });

    this.unSubUserLeft = socketService.on('user-left', ({ socketId }) => {
      console.log(`[MediasoupClient] Remote user left: ${socketId}`);
      for (const [consumerId, consumerInfo] of Array.from(this.consumers.entries())) {
        if (consumerInfo.socketId === socketId) {
          this.removeConsumer(consumerId);
        }
      }
    });

    this.unSubProducerClosed = socketService.on('producer-closed', ({ producerId }) => {
      for (const [consumerId, consumerInfo] of Array.from(this.consumers.entries())) {
        if (consumerInfo.producerId === producerId) {
          this.removeConsumer(consumerId);
        }
      }
    });

    // 1. Join room on signaling server
    const joinRes = await socketService.request('join-room', { roomId, displayName });

    if (!joinRes || !joinRes.routerRtpCapabilities) {
      console.warn('[MediasoupClient] Server operating without SFU router capabilities (Direct WebRTC P2P Active). Skipping SFU setup.');
      return;
    }

    // 2. Load device
    await this.loadDevice(joinRes.routerRtpCapabilities);

    // 3. Create WebRtcTransports
    await this.initSendTransport(roomId);
    await this.initRecvTransport(roomId);

    // Process queued producers received while initializing transports
    await this.flushPendingProducers(roomId);

    // 4. Produce local tracks (Audio, Camera Video, Screen)
    if (localTracks.audioTrack) {
      await this.produceTrack('audio', localTracks.audioTrack);
    }
    if (localTracks.videoTrack) {
      await this.produceTrack('video', localTracks.videoTrack);
    }
    if (localTracks.screenTrack) {
      await this.produceTrack('screen', localTracks.screenTrack);
    }

    // 5. Consume existing producers in the room from join response
    if (joinRes.existingPeers) {
      for (const peer of joinRes.existingPeers) {
        for (const prod of peer.producers) {
          await this.consumeRemoteProducer(roomId, prod.id, peer.socketId, peer.displayName, prod.appData);
        }
      }
    }

    // 6. Double-check latest room producers from server to prevent any race condition
    try {
      const res = await socketService.request('get-room-producers', { roomId });
      if (res && res.producers) {
        for (const prod of res.producers) {
          const alreadyConsumed = Array.from(this.consumers.values()).some((c) => c.producerId === prod.producerId);
          if (!alreadyConsumed) {
            await this.consumeRemoteProducer(roomId, prod.producerId, prod.socketId, prod.displayName, prod.appData);
          }
        }
      }
    } catch (e) {}
  }

  async flushPendingProducers(roomId) {
    if (!this.recvTransport || this.pendingProducers.length === 0) return;
    console.log(`[MediasoupClient] Flushing ${this.pendingProducers.length} queued remote producers...`);
    const queue = [...this.pendingProducers];
    this.pendingProducers = [];
    for (const item of queue) {
      try {
        await this.consumeRemoteProducer(roomId, item.producerId, item.socketId, item.displayName, item.appData);
      } catch (err) {
        console.error('[MediasoupClient] Error consuming queued producer:', err);
      }
    }
  }

  /**
   * Creates the local Send WebRtcTransport.
   */
  async initSendTransport(roomId) {
    const res = await socketService.request('create-transport', { roomId, direction: 'send' });

    if (!this.device) throw new Error('Device not initialized');

    this.sendTransport = this.device.createSendTransport({
      id: res.params.id,
      iceParameters: res.params.iceParameters,
      iceCandidates: res.params.iceCandidates,
      dtlsParameters: res.params.dtlsParameters,
      iceServers: res.params.iceServers,
    });

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socketService.request('connect-transport', {
          transportId: this.sendTransport?.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const res = await socketService.request('produce', {
          transportId: this.sendTransport?.id,
          kind,
          rtpParameters,
          appData,
        });
        callback({ id: res.id });
      } catch (error) {
        errback(error);
      }
    });

    this.setupTransportStateListeners(this.sendTransport, 'Send');
    return this.sendTransport;
  }

  /**
   * Creates the local Receive WebRtcTransport.
   */
  async initRecvTransport(roomId) {
    const res = await socketService.request('create-transport', { roomId, direction: 'recv' });

    if (!this.device) throw new Error('Device not initialized');

    this.recvTransport = this.device.createRecvTransport({
      id: res.params.id,
      iceParameters: res.params.iceParameters,
      iceCandidates: res.params.iceCandidates,
      dtlsParameters: res.params.dtlsParameters,
      iceServers: res.params.iceServers,
    });

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socketService.request('connect-transport', {
          transportId: this.recvTransport?.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    this.setupTransportStateListeners(this.recvTransport, 'Recv');
    return this.recvTransport;
  }

  /**
   * Monitors ICE and Connection states for automatic ICE restart and reconnection.
   */
  setupTransportStateListeners(transport, label) {
    transport.on('connectionstatechange', async (state) => {
      console.log(`[MediasoupClient] ${label} Transport Connection State -> ${state}`);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }

      if (state === 'disconnected' || state === 'failed') {
        console.warn(`[MediasoupClient] ${label} Transport connection degraded (${state}). Attempting ICE restart...`);
        await this.handleIceRestartOrReconnect(transport);
      }
    });
  }

  /**
   * Triggers ICE Restart on disconnected transport, or re-initiates transport pipeline if needed.
   */
  async handleIceRestartOrReconnect(transport) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    try {
      const res = await socketService.request('restart-ice', {
        transportId: transport.id,
      });

      await transport.restartIce({
        iceParameters: res.iceParameters,
      });

      console.log('[MediasoupClient] ICE Restart executed successfully on transport', transport.id);
    } catch (err) {
      console.error('[MediasoupClient] ICE restart failed. Triggering full transport re-connection pipeline...', err);
      await this.reconnectTransportPipeline();
    } finally {
      this.isReconnecting = false;
    }
  }

  /**
   * Re-creates transports and re-produces preserved tracks after server worker crash or transport failure.
   */
  async reconnectTransportPipeline() {
    console.log('[MediasoupClient] Starting full transport re-connection pipeline...');

    if (this.sendTransport) this.sendTransport.close();
    if (this.recvTransport) this.recvTransport.close();

    const res = await socketService.request('get-router-rtp-capabilities', {
      roomId: this.currentRoomId,
    });

    if (this.device) {
      await this.loadDevice(res.routerRtpCapabilities);
    }

    await this.initSendTransport(this.currentRoomId);
    await this.initRecvTransport(this.currentRoomId);

    for (const [type, producer] of Array.from(this.producers.entries())) {
      const track = producer.track;
      producer.close();
      this.producers.delete(type);

      if (track && track.readyState === 'live') {
        await this.produceTrack(type, track);
      }
    }

    console.log('[MediasoupClient] Transport re-connection pipeline completed successfully!');
  }

  /**
   * Produces a MediaStreamTrack with SIMULCAST enabled for camera video.
   */
  async produceTrack(type, track) {
    if (!this.sendTransport) throw new Error('Send transport not initialized');

    let producer;

    if (type === 'video') {
      producer = await this.sendTransport.produce({
        track,
        encodings: [
          { maxBitrate: 100000, scaleResolutionDownBy: 4 },
          { maxBitrate: 300000, scaleResolutionDownBy: 2 },
          { maxBitrate: 900000, scaleResolutionDownBy: 1 },
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000,
        },
        appData: { type: 'camera' },
      });
    } else if (type === 'screen') {
      producer = await this.sendTransport.produce({
        track,
        encodings: [{ maxBitrate: 1500000, maxFramerate: 30 }],
        appData: { type: 'screen' },
      });
    } else {
      producer = await this.sendTransport.produce({
        track,
        appData: { type: 'audio' },
      });
    }

    this.producers.set(type, producer);
    console.log(`[MediasoupClient] Produced track [Type: ${type}, Producer ID: ${producer.id}]`);

    return producer;
  }

  /**
   * Consumes a remote producer track.
   */
  async consumeRemoteProducer(roomId, producerId, socketId, displayName, appData) {
    if (this.consumers.has(producerId) || Array.from(this.consumers.values()).some((c) => c.producerId === producerId)) {
      console.log(`[MediasoupClient] Producer ${producerId} already consumed, skipping.`);
      return;
    }

    if (!this.device) throw new Error('Device not loaded');
    if (!this.recvTransport) throw new Error('Receive transport not initialized');

    const res = await socketService.request('consume', {
      roomId,
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
    });

    const consumer = await this.recvTransport.consume({
      id: res.id,
      producerId: res.producerId,
      kind: res.kind,
      rtpParameters: res.rtpParameters,
    });

    // Resume consumer on server
    await socketService.request('resume-consumer', { consumerId: consumer.id });

    const consumerInfo = {
      consumerId: consumer.id,
      producerId,
      socketId,
      displayName,
      kind: consumer.kind,
      track: consumer.track,
      appData,
      consumer,
    };

    this.consumers.set(consumer.id, consumerInfo);

    if (this.onRemoteTrackAdded) {
      this.onRemoteTrackAdded(consumerInfo);
    }

    return consumerInfo;
  }

  /**
   * Mute or Unmute local Audio producer.
   */
  async toggleAudio(muted) {
    const audioProducer = this.producers.get('audio');
    if (!audioProducer) return false;

    if (muted) {
      audioProducer.pause();
      await socketService.request('pause-producer', { producerId: audioProducer.id });
    } else {
      audioProducer.resume();
      await socketService.request('resume-producer', { producerId: audioProducer.id });
    }
    return audioProducer.paused;
  }

  /**
   * Enable or Disable local Video producer.
   */
  async toggleVideo(enabled) {
    const videoProducer = this.producers.get('video');
    if (!videoProducer) return false;

    if (!enabled) {
      videoProducer.pause();
      await socketService.request('pause-producer', { producerId: videoProducer.id });
    } else {
      videoProducer.resume();
      await socketService.request('resume-producer', { producerId: videoProducer.id });
    }
    return !videoProducer.paused;
  }

  /**
   * Removes remote consumer track on user leave or producer close.
   */
  removeConsumer(consumerId) {
    const consumerInfo = this.consumers.get(consumerId);
    if (consumerInfo) {
      consumerInfo.consumer.close();
      this.consumers.delete(consumerId);
      if (this.onRemoteTrackRemoved) {
        this.onRemoteTrackRemoved(consumerId);
      }
    }
  }

  /**
   * Cleans up all local resources when leaving call.
   */
  leave() {
    if (this.unSubNewProducer) this.unSubNewProducer();
    if (this.unSubUserJoined) this.unSubUserJoined();
    if (this.unSubUserLeft) this.unSubUserLeft();
    if (this.unSubProducerClosed) this.unSubProducerClosed();

    this.pendingProducers = [];
    this.producers.forEach((p) => p.close());
    this.producers.clear();

    this.consumers.forEach((c) => c.consumer.close());
    this.consumers.clear();

    if (this.sendTransport) this.sendTransport.close();
    if (this.recvTransport) this.recvTransport.close();

    this.sendTransport = null;
    this.recvTransport = null;
    this.device = null;
  }
}

export const mediasoupClientService = new MediasoupClientService();
