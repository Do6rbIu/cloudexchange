import { db } from './pool.js';

export interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  quotaBytes: number;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface UserRowRaw {
  id: string;
  email: string;
  display_name: string;
  role: 'user' | 'admin';
  quota_bytes: string;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

function fromRow(r: UserRowRaw): UserRow {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    role: r.role,
    quotaBytes: Number(r.quota_bytes),
    isActive: r.is_active,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const res = await db().query<UserRowRaw>(
    `SELECT id, email, display_name, role, quota_bytes, is_active, created_at, last_login_at
       FROM users WHERE email = $1`,
    [email],
  );
  return res.rows[0] ? fromRow(res.rows[0]) : null;
}

export async function upsertUserOnLogin(
  email: string,
  displayName: string,
): Promise<UserRow> {
  const res = await db().query<UserRowRaw>(
    `INSERT INTO users (email, display_name)
        VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE
        SET display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), users.display_name),
            last_login_at = now(),
            updated_at = now()
     RETURNING id, email, display_name, role, quota_bytes, is_active, created_at, last_login_at`,
    [email, displayName],
  );
  return fromRow(res.rows[0]);
}

export async function listUsers(): Promise<UserRow[]> {
  const res = await db().query<UserRowRaw>(
    `SELECT id, email, display_name, role, quota_bytes, is_active, created_at, last_login_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 200`,
  );
  return res.rows.map(fromRow);
}
