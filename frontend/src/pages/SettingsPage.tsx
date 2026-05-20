import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import type { Theme } from '../components/shared/theme';
import { mailApi } from '../api/mail';
import { calendarApi } from '../api/calendar';
import { contactsApi } from '../api/contacts';

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
          <Row label="Совместимость" value="grommunio · Postfix+Dovecot · Radicale" t={t} />
          <Row label="Версия API" value="0.1.0" t={t} />
        </Card>
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
