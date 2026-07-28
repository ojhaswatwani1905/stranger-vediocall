import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { workerManager } from './managers/WorkerManager';
import { roomManager } from './managers/RoomManager';
import { setupSocketHandler } from './signaling/socketHandler';

async function bootstrap() {
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Health Check API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'mediasoup-sfu-server',
      timestamp: new Date().toISOString(),
    });
  });

  // Diagnostics API
  app.get('/api/diagnostics/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const diagnostics = await roomManager.getRoomDiagnostics(roomId);
    if (!diagnostics) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(diagnostics);
  });

  let server: http.Server | https.Server;

  if (config.https.useHttps && fs.existsSync(config.https.sslKey) && fs.existsSync(config.https.sslCrt)) {
    const sslOptions = {
      key: fs.readFileSync(config.https.sslKey),
      cert: fs.readFileSync(config.https.sslCrt),
    };
    server = https.createServer(sslOptions, app);
    console.log('[Server] Initialized HTTPS secure server context');
  } else {
    server = http.createServer(app);
    console.log('[Server] Initialized HTTP server context');
  }

  // Initialize Socket.IO with WebSockets and Polling transport options
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Initialize Mediasoup Worker Pool safely with fallback
  try {
    await workerManager.init();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[WorkerManager Warning]: Mediasoup native C++ binary not spawned:', msg);
    console.warn('[Server]: Running Socket.IO WebRTC signaling server in direct P2P mode.');
  }

  // Attach Signaling Handler
  setupSocketHandler(io);

  const port = config.https.port;
  const listenIp = config.https.listenIp;

  server.listen(port, listenIp, () => {
    console.log(`
============================================================
 MediaSoup SFU Server running at:
 ${config.https.useHttps ? 'https' : 'http'}://${listenIp}:${port}
 Protocol: ${config.https.useHttps ? 'WSS / HTTPS' : 'WS / HTTP'}
 Announced IP: ${config.mediasoup.webRtcTransportOptions.listenIps[0].announcedIp || 'auto/localhost'}
 RTC Port Range: ${config.mediasoup.workerSettings.rtcMinPort}-${config.mediasoup.workerSettings.rtcMaxPort}/udp
 Coturn Domain: ${config.turn.domain}:${config.turn.port}
============================================================
    `);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down server gracefully...');
    server.close(() => {
      console.log('[Server] Server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal Error during server bootstrap:', err);
  process.exit(1);
});
