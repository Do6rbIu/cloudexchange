import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  confirmTotp,
  consumeBackupCode,
  deleteTotp,
  getTotp,
  isTotpEnabled,
  upsertTotpSecret,
} from '../db/totp.js';
import { encryptSecret, decryptSecret } from '../services/crypto.js';
import {
  buildOtpAuthUrl,
  buildQrDataUrl,
  generateBackupCodes,
  generateSecret,
  hashBackupCode,
  verifyToken,
} from '../services/totp.js';
import { audit } from '../db/audit.js';

const codeSchema = z.object({ code: z.string().min(6).max(12) });

export async function twofaRoutes(app: FastifyInstance) {
  // ── Status
  app.get('/status', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const enabled = await isTotpEnabled(user.email);
    return { enabled };
  });

  // ── Begin setup: generate a secret + QR. Not yet active until confirmed.
  app.post('/setup', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const secret = generateSecret();
    const { plain, hashed } = generateBackupCodes();
    await upsertTotpSecret(user.email, encryptSecret(secret), hashed);
    const otpauth = buildOtpAuthUrl(user.email, secret);
    const qr = await buildQrDataUrl(otpauth);
    return {
      otpauthUrl: otpauth,
      qrDataUrl: qr,
      secret, // shown once so the user can enter it manually
      backupCodes: plain, // shown once
    };
  });

  // ── Confirm setup with a code from the authenticator app.
  app.post('/confirm', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = codeSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    const row = await getTotp(user.email);
    if (!row) return reply.status(409).send({ error: 'Conflict', message: '2FA setup not started' });
    const secret = decryptSecret(row.secretEnc);
    if (!verifyToken(parse.data.code, secret)) {
      return reply.status(400).send({ error: 'InvalidCode', message: 'Неверный код' });
    }
    await confirmTotp(user.email);
    await audit({ actorEmail: user.email, action: 'auth.2fa.enable', ipAddress: request.ip });
    return { ok: true };
  });

  // ── Disable (requires a valid current code).
  app.post('/disable', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = codeSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    const row = await getTotp(user.email);
    if (!row || !row.confirmed) {
      return reply.status(409).send({ error: 'Conflict', message: '2FA not enabled' });
    }
    const secret = decryptSecret(row.secretEnc);
    const codeOk = verifyToken(parse.data.code, secret) || consumeBackup(row.backupCodes, parse.data.code);
    if (!codeOk) {
      return reply.status(400).send({ error: 'InvalidCode', message: 'Неверный код' });
    }
    await deleteTotp(user.email);
    await audit({ actorEmail: user.email, action: 'auth.2fa.disable', ipAddress: request.ip });
    return { ok: true };
  });

  // ── Login challenge: completes a session that's waiting on 2FA.
  app.post(
    '/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const pending = request.session.pending2fa;
      if (!pending) {
        return reply.status(409).send({ error: 'Conflict', message: 'No pending 2FA challenge' });
      }
      // Expire stale challenges after 5 minutes.
      if (Date.now() - pending.since > 5 * 60 * 1000) {
        delete request.session.pending2fa;
        return reply.status(440).send({ error: 'Expired', message: 'Сессия истекла, войдите заново' });
      }
      const parse = codeSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
      }
      const row = await getTotp(pending.email);
      if (!row || !row.confirmed) {
        // 2FA was disabled between password and challenge — let them in.
        request.session.user = {
          email: pending.email,
          password: pending.password,
          displayName: pending.displayName,
          role: pending.role,
        };
        delete request.session.pending2fa;
        return { ok: true, user: serialize(pending) };
      }
      const secret = decryptSecret(row.secretEnc);
      let ok = verifyToken(parse.data.code, secret);
      if (!ok) {
        const remaining = tryConsumeBackup(row.backupCodes, parse.data.code);
        if (remaining) {
          await consumeBackupCode(pending.email, remaining);
          ok = true;
        }
      }
      if (!ok) {
        await audit({
          actorEmail: pending.email,
          action: 'auth.2fa.challenge',
          result: 'failure',
          ipAddress: request.ip,
        });
        return reply.status(400).send({ error: 'InvalidCode', message: 'Неверный код' });
      }
      request.session.user = {
        email: pending.email,
        password: pending.password,
        displayName: pending.displayName,
        role: pending.role,
      };
      delete request.session.pending2fa;
      await audit({
        actorEmail: pending.email,
        action: 'auth.login',
        result: 'success',
        ipAddress: request.ip,
        detail: { via: '2fa' },
      });
      return { ok: true, user: serialize(pending) };
    },
  );
}

function serialize(p: { email: string; displayName: string; role: 'user' | 'admin' }) {
  return { email: p.email, displayName: p.displayName, role: p.role };
}

function consumeBackup(hashes: string[], code: string): boolean {
  return hashes.includes(hashBackupCode(code));
}

// Returns the remaining hashes if the code matched, else null.
function tryConsumeBackup(hashes: string[], code: string): string[] | null {
  const h = hashBackupCode(code);
  if (!hashes.includes(h)) return null;
  return hashes.filter((x) => x !== h);
}
