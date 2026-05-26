import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';

// AES-256-GCM with a key derived from SESSION_SECRET. Used to encrypt TOTP
// secrets at rest so a database dump alone can't mint valid 2FA codes.
//
// NOTE: rotating SESSION_SECRET invalidates all stored TOTP secrets — in
// production keep a dedicated TOTP_ENC_KEY and a key-rotation procedure.

const key = createHash('sha256').update(config.sessionSecret).digest(); // 32 bytes

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('malformed encrypted secret');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}
