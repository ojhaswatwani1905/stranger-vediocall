import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { RtpCodecCapability, WorkerLogLevel, WorkerLogTag } from 'mediasoup/node/lib/types';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const LISTEN_IP = process.env.LISTEN_IP || '0.0.0.0';
const ANNOUNCED_IP = process.env.ANNOUNCED_IP || '127.0.0.1';

/**
 * Standardized Media Codec Capabilities shared across ALL routers.
 * Ensures identical codec configuration across all worker router instances.
 */
const mediaCodecs: RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
    preferredPayloadType: 111,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    preferredPayloadType: 96,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    preferredPayloadType: 125,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    preferredPayloadType: 98,
    parameters: {
      'profile-id': 2,
      'x-google-start-bitrate': 1000,
    },
  },
];

export const config = {
  domain: process.env.DOMAIN || 'localhost',
  https: {
    port: parseInt(process.env.PORT || '3000', 10),
    listenIp: LISTEN_IP,
    useHttps: process.env.USE_HTTPS === 'true',
    sslKey: path.resolve(__dirname, '../ssl/server.key'),
    sslCrt: path.resolve(__dirname, '../ssl/server.crt'),
  },
  mediasoup: {
    numWorkers: parseInt(process.env.MEDIASOUP_NUM_WORKERS || '0', 10) || Math.min(Object.keys(os.cpus()).length || 2, 2),
    workerSettings: {
      logLevel: (process.env.MEDIASOUP_LOG_LEVEL || 'warn') as WorkerLogLevel,
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
        'rtx',
        'bwe',
        'score',
        'simulcast',
        'svc',
        'sctp',
      ] as WorkerLogTag[],
      rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '40000', 10),
      rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '49999', 10),
    },
    routerOptions: {
      mediaCodecs,
    },
    webRtcTransportOptions: {
      listenIps: [
        {
          ip: LISTEN_IP,
          announcedIp: ANNOUNCED_IP !== '0.0.0.0' ? ANNOUNCED_IP : undefined,
        },
      ],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    },
  },
  turn: {
    domain: process.env.TURN_DOMAIN || ANNOUNCED_IP,
    port: parseInt(process.env.TURN_PORT || '3478', 10),
    tlsPort: parseInt(process.env.TURN_TLS_PORT || '5349', 10),
    secret: process.env.TURN_SECRET || 'mediasoup_super_secret_turn_key_2026',
    expirySeconds: 24 * 3600,
  },
};
