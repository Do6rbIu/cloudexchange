import { useEffect, useState } from 'react';
import { adminApi } from '../api/admin';
import { ApiError } from '../api/client';
import { useTheme } from '../store/theme';
import type { Theme } from '../components/shared/theme';
import type { AdminUser, AuditEntry, MailStackStatus } from '../types/api';
import { colorFor, initialsOf } from '../components/shared/format';

export function AdminPage() {
  const { theme: t } = useTheme();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [mailStack, setMailStack] = useState<MailStackStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'audit' | 'stack'>('stack');

  useEffect(() => {
    Promise.all([
      adminApi.users().catch((e) => e),
      adminApi.audit({ limit: 50 }).catch((e) => e),
      adminApi.mailStack().catch((e) => e),
    ])
      .then(([u, a, m]) => {
        if (u instanceof Error) {
          setError(u instanceof ApiError && u.status === 403 ? 'Доступ только для администраторов' : u.message);
          return;
        }
        setUsers(u as AdminUser[]);
        if (!(a instanceof Error)) setAudit(a as AuditEntry[]);
        if (!(m instanceof Error)) setMailStack(m as MailStackStatus);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'));
  }, []);

  return (
    <div style={{ height: '100%', overflow: 'auto', background: t.bg, color: t.text }}>
      <header style={{ padding: '20px 32px', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Администрирование</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: t.textMuted }}>
          Управление пользователями, ролями и журналом событий
        </p>
      </header>

      {error && (
        <div style={{ margin: 24, padding: '12px 16px', background: 'rgba(192,57,43,0.12)', color: t.danger, borderRadius: 8 }}>
          {error}
        </div>
      )}

      {!error && (
        <>
          <div style={{ display: 'flex', gap: 8, padding: '16px 32px 0' }}>
            <Tab label="Mail-стек" active={tab === 'stack'} onClick={() => setTab('stack')} t={t} />
            <Tab label="Пользователи" active={tab === 'users'} onClick={() => setTab('users')} t={t} />
            <Tab label="Аудит-лог" active={tab === 'audit'} onClick={() => setTab('audit')} t={t} />
          </div>

          {tab === 'stack' && <StackTab status={mailStack} t={t} />}
          {tab === 'users' && <UsersTab users={users} t={t} />}
          {tab === 'audit' && <AuditTab entries={audit} t={t} />}
        </>
      )}
    </div>
  );
}

function StackTab({ status, t }: { status: MailStackStatus | null; t: Theme }) {
  if (!status) return <div style={{ padding: 32, color: t.textMuted }}>Загружаем…</div>;
  const checks: Array<{ name: string; description: string; probe: typeof status.imap }> = [
    { name: 'IMAP', description: 'Чтение почты через Dovecot', probe: status.imap },
    { name: 'SMTP submission', description: 'Отправка через Postfix (port 587)', probe: status.smtp },
    { name: 'ManageSieve', description: 'Серверные фильтры (port 4190)', probe: status.managesieve },
    { name: 'Rspamd controller', description: 'Веб-консоль антиспама (port 11334)', probe: status.rspamdController },
  ];
  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div
        style={{
          marginTop: 12,
          marginBottom: 16,
          fontSize: 13,
          color: t.textMuted,
          lineHeight: 1.5,
          maxWidth: 720,
        }}
      >
        Mail-стек в Phase 2 включает Postfix + Dovecot + Rspamd (антиспам) + ClamAV
        (антивирус) + OpenDKIM (подпись) + OpenDMARC (проверка) + Fail2ban
        (защита от брутфорса). Ниже — статус сетевых endpoint'ов.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {checks.map((c) => (
          <div
            key={c.name}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
              {c.probe.open ? (
                <Pill text="up" bg="rgba(31,138,91,0.18)" color="#1F8A5B" />
              ) : (
                <Pill text="down" bg="rgba(192,57,43,0.18)" color={t.danger} />
              )}
            </div>
            <div style={{ fontSize: 12, color: t.textMuted }}>{c.description}</div>
            <div style={{ fontSize: 11, color: t.textDim, fontFamily: 'JetBrains Mono, monospace' }}>
              {c.probe.host}:{c.probe.port}{c.probe.responseMs !== null ? ` · ${c.probe.responseMs}ms` : ''}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: t.surfaceAlt,
          borderRadius: 10,
          fontSize: 12,
          color: t.textMuted,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: t.text }}>DNS-записи для production-деплоя</strong>
        <pre style={{ marginTop: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap' }}>
{`example.com.        MX   10  mail.example.com.
example.com.        TXT  "v=spf1 mx -all"
_dmarc.example.com. TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
default._domainkey.example.com. TXT "(см. вывод bootstrap-demo.sh)"`}
        </pre>
        <div style={{ marginTop: 8 }}>
          Публичный DKIM-ключ генерируется в скрипте <code>bootstrap-demo.sh</code> на этапе
          инициализации домена. Опубликуйте его на DNS-провайдере перед запуском.
        </div>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick, t }: { label: string; active: boolean; onClick: () => void; t: Theme }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        background: active ? t.surface : 'transparent',
        color: active ? t.text : t.textMuted,
        border: `1px solid ${active ? t.border : 'transparent'}`,
        borderBottom: 'none',
        borderRadius: '8px 8px 0 0',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function UsersTab({ users, t }: { users: AdminUser[] | null; t: Theme }) {
  if (!users) return <div style={{ padding: 32, color: t.textMuted }}>Загружаем…</div>;
  if (users.length === 0) return <div style={{ padding: 32, color: t.textMuted }}>Пока ни одного пользователя</div>;
  return (
    <div style={{ padding: '0 32px 32px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: t.surfaceAlt }}>
            <Th t={t}>Пользователь</Th>
            <Th t={t}>Роль</Th>
            <Th t={t}>Квота</Th>
            <Th t={t}>Статус</Th>
            <Th t={t}>Создан</Th>
            <Th t={t}>Последний вход</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderTop: `1px solid ${t.border}` }}>
              <Td t={t}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: colorFor(u.email),
                      color: '#FFF',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {initialsOf(u.displayName || u.email)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.displayName || u.email}</div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>{u.email}</div>
                  </div>
                </div>
              </Td>
              <Td t={t}>
                <Pill
                  text={u.role}
                  bg={u.role === 'admin' ? 'rgba(122,79,224,0.18)' : t.surfaceAlt}
                  color={u.role === 'admin' ? '#7A4FE0' : t.textMuted}
                />
              </Td>
              <Td t={t}>{formatBytes(u.quotaBytes)}</Td>
              <Td t={t}>
                {u.isActive ? <Pill text="активен" bg="rgba(31,138,91,0.18)" color="#1F8A5B" /> : <Pill text="заблокирован" bg="rgba(192,57,43,0.18)" color={t.danger} />}
              </Td>
              <Td t={t}>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</Td>
              <Td t={t}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ru-RU') : '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab({ entries, t }: { entries: AuditEntry[] | null; t: Theme }) {
  if (!entries) return <div style={{ padding: 32, color: t.textMuted }}>Загружаем…</div>;
  if (entries.length === 0) return <div style={{ padding: 32, color: t.textMuted }}>Журнал пуст</div>;
  return (
    <div style={{ padding: '0 32px 32px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: t.surfaceAlt }}>
            <Th t={t}>Время</Th>
            <Th t={t}>Действие</Th>
            <Th t={t}>Пользователь</Th>
            <Th t={t}>IP</Th>
            <Th t={t}>Результат</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} style={{ borderTop: `1px solid ${t.border}` }}>
              <Td t={t}>{new Date(e.occurredAt).toLocaleString('ru-RU')}</Td>
              <Td t={t}>
                <code style={{ fontSize: 11, background: t.surfaceAlt, padding: '2px 6px', borderRadius: 4 }}>{e.action}</code>
              </Td>
              <Td t={t}>{e.actorEmail ?? '—'}</Td>
              <Td t={t}>{e.ipAddress ?? '—'}</Td>
              <Td t={t}>
                {e.result === 'success' ? (
                  <Pill text="success" bg="rgba(31,138,91,0.18)" color="#1F8A5B" />
                ) : (
                  <Pill text="failure" bg="rgba(192,57,43,0.18)" color={t.danger} />
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, t }: { children: React.ReactNode; t: Theme }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 14px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: t.textMuted,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, t }: { children: React.ReactNode; t: Theme }) {
  return <td style={{ padding: '10px 14px', fontSize: 13, color: t.text }}>{children}</td>;
}

function Pill({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
      {text}
    </span>
  );
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(0)} ГБ`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} МБ`;
}
