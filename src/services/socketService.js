import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(serverUrl) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SIGNALING_URL;
    const url = serverUrl || envUrl || (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : 'http://localhost:3000');

    console.log(`[SocketService] Connecting to Socket.IO signaling server at ${url}...`);

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log(`[SocketService] Connected to signaling server [ID: ${this.socket?.id}]`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Signaling connection error:', error);
    });

    return this.socket;
  }

  request(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.connect();
      }

      if (!this.socket) {
        return reject(new Error('Socket is not initialized'));
      }

      this.socket.emit(event, data, (response) => {
        if (response && response.success === false) {
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
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
