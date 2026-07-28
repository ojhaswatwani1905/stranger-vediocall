import { WebRtcTransport, Producer, Consumer } from 'mediasoup/node/lib/types';

export interface PeerInfo {
  socketId: string;
  displayName: string;
  roomId: string;
}

export class Peer {
  public socketId: string;
  public displayName: string;
  public roomId: string;
  public sendTransport?: WebRtcTransport;
  public recvTransport?: WebRtcTransport;
  public producers: Map<string, Producer> = new Map(); // producerId -> Producer
  public consumers: Map<string, Consumer> = new Map(); // consumerId -> Consumer

  constructor(socketId: string, displayName: string, roomId: string) {
    this.socketId = socketId;
    this.displayName = displayName;
    this.roomId = roomId;
  }

  addProducer(producer: Producer): void {
    this.producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      console.log(`[Peer ${this.socketId}] Producer ${producer.id} transport closed`);
      this.producers.delete(producer.id);
    });
  }

  getProducer(producerId: string): Producer | undefined {
    return this.producers.get(producerId);
  }

  removeProducer(producerId: string): void {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }
  }

  addConsumer(consumer: Consumer): void {
    this.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      console.log(`[Peer ${this.socketId}] Consumer ${consumer.id} transport closed`);
      this.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      console.log(`[Peer ${this.socketId}] Consumer ${consumer.id} underlying producer closed`);
      this.consumers.delete(consumer.id);
    });
  }

  getConsumer(consumerId: string): Consumer | undefined {
    return this.consumers.get(consumerId);
  }

  removeConsumer(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  close(): void {
    console.log(`[Peer ${this.socketId}] Closing all transports, producers, and consumers...`);
    this.producers.forEach((p) => p.close());
    this.producers.clear();

    this.consumers.forEach((c) => c.close());
    this.consumers.clear();

    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = undefined;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = undefined;
    }
  }
}

export class PeerManager {
  private peers: Map<string, Peer> = new Map(); // socketId -> Peer

  addPeer(socketId: string, displayName: string, roomId: string): Peer {
    const peer = new Peer(socketId, displayName, roomId);
    this.peers.set(socketId, peer);
    return peer;
  }

  getPeer(socketId: string): Peer | undefined {
    return this.peers.get(socketId);
  }

  removePeer(socketId: string): Peer | undefined {
    const peer = this.peers.get(socketId);
    if (peer) {
      peer.close();
      this.peers.delete(socketId);
    }
    return peer;
  }

  getPeersInRoom(roomId: string): Peer[] {
    return Array.from(this.peers.values()).filter((p) => p.roomId === roomId);
  }
}

export const peerManager = new PeerManager();
