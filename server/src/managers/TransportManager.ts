import { Router, WebRtcTransport } from 'mediasoup/node/lib/types';
import { config } from '../config';
import { getIceServers, IceServer } from '../utils/turnAuth';

export interface TransportParams {
  id: string;
  iceParameters: unknown;
  iceCandidates: unknown;
  dtlsParameters: unknown;
  sctpParameters?: unknown;
  iceServers: IceServer[];
}

export class TransportManager {
  /**
   * Creates a WebRtcTransport on the specified router for a given peer.
   */
  async createWebRtcTransport(
    router: Router,
    socketId: string,
    direction: 'send' | 'recv'
  ): Promise<{ transport: WebRtcTransport; params: TransportParams }> {
    const transportOptions = {
      ...config.mediasoup.webRtcTransportOptions,
    };

    const transport = await router.createWebRtcTransport(transportOptions);

    console.log(
      `[TransportManager] Created ${direction} WebRtcTransport [ID: ${transport.id}] for Peer ${socketId} on Router ${router.id}`
    );

    // Monitor ICE state changes for real-world network debugging
    transport.on('icestatechange', (iceState) => {
      console.log(
        `[TransportManager] Transport ${transport.id} (${direction}) ICE State -> ${iceState} [Peer: ${socketId}]`
      );
      if ((iceState as string) === 'failed' || (iceState as string) === 'disconnected') {
        console.warn(
          `[TransportManager] WARNING: Transport ${transport.id} ICE state degradation: ${iceState}. Inspecting active tuple...`,
          transport.iceSelectedTuple
        );
      }
    });

    transport.on('dtlsstatechange', (dtlsState) => {
      console.log(
        `[TransportManager] Transport ${transport.id} (${direction}) DTLS State -> ${dtlsState} [Peer: ${socketId}]`
      );
      if (dtlsState === 'failed' || dtlsState === 'closed') {
        console.warn(`[TransportManager] Transport ${transport.id} DTLS state closed/failed: ${dtlsState}`);
      }
    });

    // Generate dynamic STUN/TURN credentials for cross-network connectivity
    const iceServers = getIceServers(socketId);

    const params: TransportParams = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
      iceServers,
    };

    return { transport, params };
  }

  /**
   * Triggers an ICE restart on an existing transport when switching networks (e.g. Wi-Fi to cellular).
   */
  async restartIce(transport: WebRtcTransport): Promise<unknown> {
    console.log(`[TransportManager] Restarting ICE for transport ${transport.id}...`);
    const iceParameters = await transport.restartIce();
    return iceParameters;
  }
}

export const transportManager = new TransportManager();
