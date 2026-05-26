import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import type { Theme } from '../components/shared/theme';
import { mailApi } from '../api/mail';
import { calendarApi } from '../api/calendar';
import { contactsApi } from '../api/contacts';
import { authApi, type TwoFaSetup } from '../api/auth';

interface Counts {
  folders: number;
  unread: number;
  events: number;
  contacts: number;
}

export function SettingsPage() {
  const { user } = useAuth();
  const { theme: t, dark, toggle } = useTheme();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      mailApi.folders().catch(() => []),
      calendarApi.events().catch(() => []),
      contactsApi.list().catch(() => []),
    ])
      .then(([folders, events, contacts]) => {
        if (cancelled) return;
        const unread = folders.reduce((sum, f) => sum + (f.unread ?? 0), 0);
        setCounts({ folders: folders.length, unread, events: events.length, contacts: contacts.length });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: 32, overflow: 'auto', background: t.bg, color: t.text, height: '100%' }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Настройки</h2>
      <p style={{ color: t.textMuted, marginTop: 8, fontSize: 13, maxWidth: 580 }}>
        Cloud24 Exchange — фронтенд, который подключается к открытому почтовому ядру
        (Postfix + Dovecot + Radicale в dev-окружении или grommunio в production)
        через стандартные протоколы IMAP, SMTP, CalDAV и CardDAV.
      </p>

      <section style={{ marginTop: 24, maxWidth: 720, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card t={t} title="Учётная запись">
          <Row label="Email" value={user?.email ?? '—'} t={t} />
          <Row label="Имя" value={user?.displayName ?? '—'} t={t} />
        </Card>

        <Card t={t} title="Интерфейс">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ fontSize: 13, color: t.textMuted }}>Тема</span>
            <button
              type="button"
              onClick={toggle}
              style={{
                padding: '6px 12px',
                background: t.surface,
                color: t.text,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {dark ? '☾ Тёмная' : '☀ Светлая'}
            </button>
          </div>
        </Card>

        <Card t={t} title="Содержимое">
          <Row label="Папок" value={loading ? '…' : String(counts?.folders ?? 0)} t={t} />
          <Row label="Непрочитанных" value={loading ? '…' : String(counts?.unread ?? 0)} t={t} />
          <Row label="Событий в календаре" value={loading ? '…' : String(counts?.events ?? 0)} t={t} />
          <Row label="Контактов" value={loading ? '…' : String(counts?.contacts ?? 0)} t={t} />
        </Card>

        <Card t={t} title="Бэкенд">
          <Row label="Тип" value="IMAP / SMTP / CalDAV / CardDAV" t={t} />
          <Row label="Совместимость" value="grommunio · Postfix+Dovecot · SOGo" t={t} />
          <Row label="Версия API" value="0.2.0" t={t} />
        </Card>
      </section>

      <section style={{ marginTop: 12, maxWidth: 720 }}>
        <TwoFactorCard t={t} />
      </section>

      <section style={{ marginTop: 12, maxWidth: 720 }}>
        <Card t={t} title="О проекте">
          <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textMuted, margin: 0 }}>
            Альтернатива Microsoft Exchange на базе открытого ПО. Совместима с любым
            почтовым сервером, поддерживающим стандартные протоколы. Дизайн-канвас
            с экранами хранится в корне репозитория как референс для дальнейшей
            доработки UI.
          </p>
          <p style={{ fontSize: 12, color: t.textDim, marginTop: 12, marginBottom: 0 }}>
            Документация:{' '}
            <a
              href="https://github.com/Do6rbIu/cloudexchange/blob/main/docs/ARCHITECTURE.md"
              style={{ color: t.accent }}
            >
              docs/ARCHITECTURE.md
            </a>
          </p>
        </Card>
      </section>
    </div>
  );
}

function TwoFactorCard({ t }: { t: Theme }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<TwoFaSetup | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disableMode, setDisableMode] = useState(false);

  useEffect(() => {
    authApi.twofaStatus().then((s) => setEnabled(s.enabled)).catch(() => setEnabled(false));
  }, []);

  async function startSetup() {
    setBusy(true);
    setError(null);
    try {
      setSetup(await authApi.twofaSetup());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.twofaConfirm(code);
      setEnabled(true);
      setSetup(null);
      setCode('');
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Неверный код');
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.twofaDisable(code);
      setEnabled(false);
      setDisableMode(false);
      setCode('');
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Неверный код');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card t={t} title="Двухфакторная аутентификация (2FA)">
      {enabled === null && <div style={{ fontSize: 13, color: t.textMuted }}>Загружаем…</div>}

      {enabled === true && !disableMode && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5 }}>
            <span style={{ color: '#1F8A5B', fontWeight: 600 }}>● Включена.</span> При входе
            требуется код из приложения-аутентификатора.
          </div>
          <button type="button" onClick={() => setDisableMode(true)} style={dangerBtn(t)}>
            Отключить
          </button>
        </div>
      )}

      {enabled === true && disableMode && (
        <form onSubmit={disable} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: t.textMuted }}>
            Введите текущий код (или резервный), чтобы отключить 2FA:
          </div>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" style={inp(t)} />
          {error && <ErrLine t={t}>{error}</ErrLine>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy} style={dangerBtn(t)}>
              {busy ? 'Отключаем…' : 'Подтвердить отключение'}
            </button>
            <button type="button" onClick={() => { setDisableMode(false); setError(null); }} style={ghostBtn(t)}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {enabled === false && !setup && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5 }}>
            <span style={{ color: t.warn, fontWeight: 600 }}>○ Выключена.</span> Рекомендуем
            включить для защиты от компрометации пароля.
          </div>
          <button type="button" onClick={startSetup} disabled={busy} style={primaryBtn(t)}>
            {busy ? '…' : 'Включить'}
          </button>
        </div>
      )}

      {setup && (
        <form onSubmit={confirm} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5 }}>
            1. Отсканируйте QR-код в приложении-аутентификаторе:
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <img
              src={setup.qrDataUrl}
              alt="QR код для 2FA"
              style={{ width: 180, height: 180, borderRadius: 8, border: `1px solid ${t.border}`, background: '#FFF' }}
            />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Или введите ключ вручную
              </div>
              <code style={{ display: 'block', marginTop: 4, fontSize: 12, wordBreak: 'break-all', background: t.surfaceAlt, padding: 8, borderRadius: 6 }}>
                {setup.secret}
              </code>
              <div style={{ fontSize: 11, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12 }}>
                Резервные коды (сохраните!)
              </div>
              <div style={{ marginTop: 4, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', columns: 2, color: t.text }}>
                {setup.backupCodes.map((c) => (
                  <div key={c}>{c}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: t.textMuted }}>2. Введите код из приложения для подтверждения:</div>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" style={inp(t)} />
          {error && <ErrLine t={t}>{error}</ErrLine>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy} style={primaryBtn(t)}>
              {busy ? 'Проверяем…' : 'Подтвердить и включить'}
            </button>
            <button type="button" onClick={() => { setSetup(null); setError(null); setCode(''); }} style={ghostBtn(t)}>
              Отмена
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

function inp(t: Theme): React.CSSProperties {
  return {
    padding: '10px 12px', fontSize: 16, letterSpacing: 4, textAlign: 'center',
    fontFamily: 'JetBrains Mono, monospace', background: t.bg,
    border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, outline: 'none', maxWidth: 200,
  };
}
function primaryBtn(t: Theme): React.CSSProperties {
  return { padding: '8px 16px', background: t.accent, color: '#FFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
}
function dangerBtn(t: Theme): React.CSSProperties {
  return { padding: '8px 14px', background: 'transparent', border: `1px solid ${t.danger}`, color: t.danger, borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
}
function ghostBtn(t: Theme): React.CSSProperties {
  return { padding: '8px 14px', background: 'transparent', border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
}
function ErrLine({ children, t }: { children: React.ReactNode; t: Theme }) {
  return <div style={{ fontSize: 12, color: t.danger, background: 'rgba(192,57,43,0.12)', padding: '8px 10px', borderRadius: 6 }}>{children}</div>;
}

function Card({ title, children, t }: { title: string; children: React.ReactNode; t: Theme }) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: t.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1.4,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, t }: { label: string; value: string; t: Theme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
      <span style={{ color: t.textMuted }}>{label}</span>
      <span style={{ fontWeight: 500, color: t.text }}>{value}</span>
    </div>
  );
}
