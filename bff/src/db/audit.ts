import { db } from './pool.js';

export interface AuditEntry {
  actorEmail?: string | null;
  action: string;
  target?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  result?: 'success' | 'failure';
  detail?: Record<string, unknown>;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db().query(
      `INSERT INTO audit_log
         (actor_email, action, target, ip_address, user_agent, result, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.actorEmail ?? null,
        entry.action,
        entry.target ?? null,
        entry.ipAddress ?? null,
        entry.userAgent ?? null,
        entry.result ?? 'success',
        JSON.stringify(entry.detail ?? {}),
      ],
    );
  } catch (err) {
    // Audit is best-effort — never break the user-facing flow because
    // the log table is unreachable. The error will still surface in
    // BFF logs via the caller's try/catch if it matters.
    // eslint-disable-next-line no-console
    console.warn('[audit] failed to record entry:', (err as Error).message);
  }
}

export interface AuditQuery {
  actorEmail?: string;
  action?: string;
  limit?: number;
}

interface AuditRowRaw {
  id: string;
  occurred_at: Date;
  actor_email: string | null;
  action: string;
  target: string | null;
  ip_address: string | null;
  user_agent: string | null;
  result: 'success' | 'failure';
  detail: Record<string, unknown>;
}

export async function listAudit(q: AuditQuery = {}): Promise<AuditRowRaw[]> {
  const limit = Math.min(Math.max(q.limit ?? 100, 1), 500);
  const filters: string[] = [];
  const params: unknown[] = [];
  if (q.actorEmail) {
    params.push(q.actorEmail);
    filters.push(`actor_email = $${params.length}`);
  }
  if (q.action) {
    params.push(q.action);
    filters.push(`action = $${params.length}`);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  params.push(limit);
  const res = await db().query<AuditRowRaw>(
    `SELECT id, occurred_at, actor_email, action, target, ip_address,
            user_agent, result, detail
       FROM audit_log
       ${where}
       ORDER BY occurred_at DESC
       LIMIT $${params.length}`,
    params,
  );
  return res.rows;
}
