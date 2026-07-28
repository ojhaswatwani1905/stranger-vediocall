import crypto from 'crypto';
import { config } from '../config';

export interface IceServer {
  urls: string[];
  username?: string;
  credential?: string;
}

/**
 * Generates dynamic time-limited HMAC-SHA1 TURN credentials compatible with Coturn use-auth-secret.
 * @param usernamePrefix Identifier for the user/peer session
 */
export function getIceServers(usernamePrefix = 'peer'): IceServer[] {
  const unixTimeStamp = Math.floor(Date.now() / 1000) + config.turn.expirySeconds;
  const username = `${unixTimeStamp}:${usernamePrefix}`;
  
  const hmac = crypto.createHmac('sha1', config.turn.secret);
  hmac.update(username);
  const credential = hmac.digest('base64');

  const domain = config.turn.domain;
  const port = config.turn.port;
  const tlsPort = config.turn.tlsPort;

  return [
    // Standard public STUN server for local NAT discovery
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        `stun:${domain}:${port}`,
      ],
    },
    // Dynamic TURN over UDP (preferred for performance)
    {
      urls: [`turn:${domain}:${port}?transport=udp`],
      username,
      credential,
    },
    // Dynamic TURN over TCP (fallback when UDP is blocked by firewalls)
    {
      urls: [`turn:${domain}:${port}?transport=tcp`],
      username,
      credential,
    },
    // Dynamic TURN over TLS (port 5349 fallback for strict corporate proxies)
    {
      urls: [`turns:${domain}:${tlsPort}?transport=tcp`],
      username,
      credential,
    },
  ];
}
