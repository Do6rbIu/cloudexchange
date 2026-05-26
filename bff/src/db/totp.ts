import { db } from './pool.js';

export interface TotpRow {
  email: string;
  secretEnc: string;
  confirmed: boolean;
  backupCodes: string[];
}

interface TotpRowRaw {
  email: string;
  secret_enc: string;
  confirmed: boolean;
  backup_codes: string[];
}

function fromRow(r: TotpRowRaw): TotpRow {
  return {
    email: r.email,
    secretEnc: r.secret_enc,
    confirmed: r.confirmed,
    backupCodes: r.backup_codes,
  };
}

export async function getTotp(email: string): Promise<TotpRow | null> {
  const res = await db().query<TotpRowRaw>(
    `SELECT email, secret_enc, confirmed, backup_codes FROM user_totp WHERE email = $1`,
    [email],
  );
  return res.rows[0] ? fromRow(res.rows[0]) : null;
}

export async function isTotpEnabled(email: string): Promise<boolean> {
  const res = await db().query(
    `SELECT 1 FROM user_totp WHERE email = $1 AND confirmed = true`,
    [email],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function upsertTotpSecret(
  email: string,
  secretEnc: string,
  backupCodes: string[],
): Promise<void> {
  await db().query(
    `INSERT INTO user_totp (email, secret_enc, confirmed, backup_codes)
        VALUES ($1, $2, false, $3::jsonb)
     ON CONFLICT (email) DO UPDATE
        SET secret_enc = EXCLUDED.secret_enc,
            confirmed = false,
            backup_codes = EXCLUDED.backup_codes,
            created_at = now(),
            confirmed_at = NULL`,
    [email, secretEnc, JSON.stringify(backupCodes)],
  );
}

export async function confirmTotp(email: string): Promise<void> {
  await db().query(
    `UPDATE user_totp SET confirmed = true, confirmed_at = now() WHERE email = $1`,
    [email],
  );
}

export async function consumeBackupCode(email: string, remaining: string[]): Promise<void> {
  await db().query(`UPDATE user_totp SET backup_codes = $2::jsonb WHERE email = $1`, [
    email,
    JSON.stringify(remaining),
  ]);
}

export async function deleteTotp(email: string): Promise<void> {
  await db().query(`DELETE FROM user_totp WHERE email = $1`, [email]);
}
