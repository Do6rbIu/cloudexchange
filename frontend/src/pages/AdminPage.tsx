import { useCallback, useEffect, useState, type FormEvent } from 'react';
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

  const refreshUsers = useCallback(() => {
    adminApi.users().then(setUsers).catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'));
  }, []);

  const refreshAudit = useCallback(() => {
    adminApi.audit({ limit: 50 }).then(setAudit).catch(() => undefined);
  }, []);

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
          {tab === 'users' && (
            <UsersTab
              users={users}
              t={t}
              onRefresh={() => {
                refreshUsers();
                refreshAudit();
              }}
            />
          )}
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

function UsersTab({ users, t, onRefresh }: { users: AdminUser[] | null; t: Theme; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onToggleActive(u: AdminUser) {
    setBusy(u.email);
    setError(null);
    try {
      await adminApi.setActive(u.email, !u.isActive);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  }

  async function onToggleRole(u: AdminUser) {
    setBusy(u.email);
    setError(null);
    try {
      await adminApi.setRole(u.email, u.role === 'admin' ? 'user' : 'admin');
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  }

  async function onDelete(u: AdminUser) {
    if (!window.confirm(`Удалить пользователя ${u.email}? Действие необратимо — ящик и метаданные будут удалены.`)) return;
    setBusy(u.email);
    setError(null);
    try {
      await adminApi.deleteUser(u.email);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  }

  if (!users) return <div style={{ padding: 32, color: t.textMuted }}>Загружаем…</div>;

  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
        <div style={{ fontSize: 13, color: t.textMuted }}>
          Всего: {users.length}{users.length > 0 && ` · активных: ${users.filter((u) => u.isActive).length}`}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            padding: '8px 14px',
            background: t.accent,
            color: '#FFF',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Создать пользователя
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(192,57,43,0.12)', color: t.danger, borderRadius: 6, fontSize: 12 }}>
          {error}
        </div>
      )}

      {users.length === 0 && <div style={{ padding: 32, color: t.textMuted }}>Пока ни одного пользователя</div>}
      {users.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: t.surfaceAlt }}>
              <Th t={t}>Пользователь</Th>
              <Th t={t}>Роль</Th>
              <Th t={t}>Квота</Th>
              <Th t={t}>Статус</Th>
              <Th t={t}>Последний вход</Th>
              <Th t={t}>Действия</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${t.border}`, opacity: busy === u.email ? 0.5 : 1 }}>
                <Td t={t}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: colorFor(u.email), color: '#FFF',
                        fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0,
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
                  <button
                    type="button"
                    onClick={() => onToggleRole(u)}
                    disabled={busy === u.email}
                    title="Переключить роль"
                    style={{
                      background: u.role === 'admin' ? 'rgba(122,79,224,0.18)' : t.surfaceAlt,
                      color: u.role === 'admin' ? '#7A4FE0' : t.textMuted,
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {u.role}
                  </button>
                </Td>
                <Td t={t}>{formatBytes(u.quotaBytes)}</Td>
                <Td t={t}>
                  <button
                    type="button"
                    onClick={() => onToggleActive(u)}
                    disabled={busy === u.email}
                    style={{
                      background: u.isActive ? 'rgba(31,138,91,0.18)' : 'rgba(192,57,43,0.18)',
                      color: u.isActive ? '#1F8A5B' : t.danger,
                      fontSize: 11, fontWeight: 600, padding: '2px 10px',
                      borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {u.isActive ? 'активен' : 'заблокирован'}
                  </button>
                </Td>
                <Td t={t}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ru-RU') : '—'}</Td>
                <Td t={t}>
                  <button
                    type="button"
                    onClick={() => onDelete(u)}
                    disabled={busy === u.email}
                    style={{
                      background: 'transparent', border: `1px solid ${t.danger}`,
                      color: t.danger, padding: '4px 10px', borderRadius: 6,
                      fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Удалить
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <CreateUserForm
          t={t}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function CreateUserForm({ t, onClose, onCreated }: { t: Theme; onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [quotaGb, setQuotaGb] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await adminApi.createUser({
        email,
        displayName,
        password,
        role,
        quotaBytes: quotaGb * 1024 * 1024 * 1024,
      });
      onCreated();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,24,20,0.5)',
        display: 'grid', placeItems: 'center', zIndex: 50,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: t.surface, borderRadius: 12, padding: 28, width: 460,
          display: 'flex', flexDirection: 'column', gap: 12,
          border: `1px solid ${t.border}`,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Создать пользователя</h3>
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: -4 }}>
          Будет создан почтовый ящик в Postfix/Dovecot и запись в Postgres.
          Пользователь сразу сможет залогиниться по SMTP/IMAP/SOGo.
        </div>
        <FormRow label="Email" t={t}>
          <input
            required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ivan.ivanov@cloudexchange.local" style={fInput(t)}
          />
        </FormRow>
        <FormRow label="Имя" t={t}>
          <input
            required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Иван Иванов" style={fInput(t)}
          />
        </FormRow>
        <FormRow label="Пароль (минимум 8 символов)" t={t}>
          <input
            required type="text" value={password} onChange={(e) => setPassword(e.target.value)}
            minLength={8} style={fInput(t)}
          />
        </FormRow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormRow label="Роль" t={t}>
            <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'admin')} style={fInput(t)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </FormRow>
          <FormRow label="Квота (ГБ)" t={t}>
            <input
              type="number" min={1} max={500} value={quotaGb}
              onChange={(e) => setQuotaGb(Number(e.target.value))}
              style={fInput(t)}
            />
          </FormRow>
        </div>
        {err && (
          <div style={{ padding: '8px 10px', background: 'rgba(192,57,43,0.12)', color: t.danger, borderRadius: 6, fontSize: 12 }}>
            {err}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button" onClick={onClose}
            style={{
              padding: '8px 14px', background: 'transparent',
              color: t.text, border: `1px solid ${t.border}`,
              borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Отмена
          </button>
          <button
            type="submit" disabled={busy}
            style={{
              padding: '8px 14px', background: busy ? t.textDim : t.accent,
              color: '#FFF', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 600, cursor: busy ? 'progress' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {busy ? 'Создаём…' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormRow({ label, children, t }: { label: string; children: React.ReactNode; t: Theme }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function fInput(t: Theme): React.CSSProperties {
  return {
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'inherit',
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    color: t.text,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
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
