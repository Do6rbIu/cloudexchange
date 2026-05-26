import { authenticator } from 'otplib';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import QRCode from 'qrcode';

// Allow a ±1 step (30s) clock drift so users with slightly-off device
// clocks aren't locked out.
authenticator.options = { window: 1 };

const ISSUER = 'Cloud24 Exchange';

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export async function buildQrDataUrl(otpauthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
}

export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s+/g, ''), secret });
  } catch {
    return false;
  }
}

// Backup codes: 10 single-use codes, shown once to the user. We store
// only their hashes (sha256) so a DB leak can't reuse them.
export function generateBackupCodes(count = 10): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = `${randomInt(0, 1e5).toString().padStart(5, '0')}-${randomInt(0, 1e5)
      .toString()
      .padStart(5, '0')}`;
    plain.push(raw);
    hashed.push(hashBackupCode(raw));
  }
  return { plain, hashed };
}

export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code.replace(/\s+/g, '')).digest('hex');
}

export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}
