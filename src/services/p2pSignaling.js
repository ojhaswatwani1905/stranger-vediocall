import { socketService } from './socketService';

class P2PSignaling {
  constructor() {
    this.channelName = 'stranger_p2p_signaling_v7';
    this.storagePrefix = 'stranger_p2p_sig_v7_';
    this.channel = null;
    this.peerId = `peer_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    this.listeners = new Map();
    this.processedMsgIds = new Set();
    this.onIncomingCall = null;
    this.init();
  }

  setPeerId(customId) {
    if (!customId || this.peerId === customId) return;
    console.log(`[SOCKET] Setting custom PeerID: ${customId}`);
    this.peerId = customId;
    if (socketService.socket) {
      socketService.emit('register-peer', { peerId: this.peerId });
    }
  }

  init() {
    if (typeof window !== 'undefined') {
      console.log(`[SOCKET] Initializing Socket.IO signaling engine. Local PeerID: ${this.peerId}`);

      // Connect Socket.IO signaling
      const socket = socketService.connect();

      socketService.on('connect', () => {
        console.log(`[SOCKET] Socket connected. Registering PeerID "${this.peerId}" with server...`);
        socketService.emit('register-peer', { peerId: this.peerId });
      });

      // Register immediately if already connected
      if (socket && socket.connected) {
        socketService.emit('register-peer', { peerId: this.peerId });
      }

      // Listen for socket signaling events
      socketService.on('signaling-event', ({ type, payload }) => {
        if (payload) {
          this.handleIncomingMessage({ type, payload, msgId: payload.msgId }, 'SocketIOServer');
        }
      });

      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data, 'BroadcastChannel');
        };
      }

      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith(this.storagePrefix) && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            this.handleIncomingMessage(data, 'LocalStorageEvent');
          } catch (e) {}
        }
      });
    }
  }

  callPeer(targetPeerId, localStream, onRemoteStream) {
    console.log(`%c[SFU SIGNALING] Initiating MediaSoup Call to ${targetPeerId}`, 'color: #3b82f6; font-weight: bold;');
    return null;
  }

  handleIncomingMessage(data, source = 'Unknown') {
    if (!data || !data.type) return;

    if (data.msgId) {
      if (this.processedMsgIds.has(data.msgId)) return;
      this.processedMsgIds.add(data.msgId);
      if (this.processedMsgIds.size > 500) {
        const arr = Array.from(this.processedMsgIds);
        this.processedMsgIds = new Set(arr.slice(-250));
      }
    }

    const { type, payload } = data;

    if (payload && payload.senderPeerId === this.peerId) return;

    console.log(`%c[P2P SIGNALING 📥 Received via ${source}] Event: ${type}`, 'color: #10b981; font-weight: bold;', payload);

    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach((cb) => cb(payload));
    }
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
    return () => {
      const list = this.listeners.get(type) || [];
      this.listeners.set(type, list.filter((cb) => cb !== callback));
    };
  }

  send(type, payload = {}) {
    const msgId = `msg_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const fullPayload = {
      ...payload,
      msgId,
      senderPeerId: this.peerId
    };

    const message = {
      msgId,
      type,
      payload: fullPayload,
      timestamp: Date.now()
    };

    console.log(`%c[P2P SIGNALING 📤 Sent] Event: ${type}`, 'color: #8b5cf6; font-weight: bold;', payload);

    // 1. Socket.IO Signaling Server
    socketService.emit('signaling-event', { type, payload: fullPayload });

    // 2. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {}
    }

    // 3. LocalStorage Event & 50ms Polling
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storageKey = `${this.storagePrefix}${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        window.localStorage.setItem(storageKey, JSON.stringify(message));
        setTimeout(() => {
          try { window.localStorage.removeItem(storageKey); } catch (e) {}
        }, 2000);
      } catch (e) {}
    }
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const p2pSignaling = new P2PSignaling();
