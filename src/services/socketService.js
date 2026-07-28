import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(serverUrl) {
    if (this.socket && this.socket.connected) {
      console.log('[SOCKET] Already connected with ID:', this.socket.id);
      return this.socket;
    }

    const envUrl = typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SIGNALING_URL || import.meta.env.VITE_BACKEND_URL);
    let url = serverUrl || envUrl;

    if (!url) {
      if (typeof window !== 'undefined') {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        url = isLocal ? 'http://localhost:3000' : window.location.origin;
      } else {
        url = 'http://localhost:3000';
      }
    }

    console.log(`[SOCKET] Connecting to Socket.IO signaling server at: ${url}`);

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    });

    this.socket.on('connect', () => {
      console.log(`[SOCKET] Connected successfully! Socket ID: ${this.socket.id}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SOCKET] Error connection failed:', error.message || error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`[SOCKET] Partner Disconnected / Disconnected from server. Reason: ${reason}`);
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[SOCKET] Reconnecting attempt #${attempt}...`);
    });

    this.socket.io.on('reconnect', (attempt) => {
      console.log(`[SOCKET] Reconnected after ${attempt} attempts! Socket ID: ${this.socket?.id}`);
    });

    return this.socket;
  }

  request(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.connect();
      }

      if (!this.socket) {
        console.error('[SOCKET] Error: Socket is not initialized');
        return reject(new Error('Socket is not initialized'));
      }

      console.log(`[SOCKET] Requesting event "${event}" with data:`, data);
      this.socket.emit(event, data, (response) => {
        if (response && response.success === false) {
          console.error(`[SOCKET] Error response for "${event}":`, response.error);
          return reject(new Error(response.error || `Socket request "${event}" failed`));
        }
        resolve(response);
      });
    });
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.on(event, callback);
    return () => {
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  emit(event, data) {
    if (!this.socket) {
      this.connect();
    }
    if (this.socket) {
      console.log(`[SOCKET] Emitting event "${event}":`, data);
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('[SOCKET] Disconnecting socket connection...');
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

