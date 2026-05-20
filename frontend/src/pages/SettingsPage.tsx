import { useAuth } from '../store/auth';
import { lightTheme } from '../components/shared/theme';

export function SettingsPage() {
  const { user } = useAuth();
  const t = lightTheme;

  return (
    <div style={{ padding: 32, overflow: 'auto', background: t.bg, height: '100%' }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Настройки</h2>
      <p style={{ color: t.textMuted, marginTop: 8, fontSize: 13, maxWidth: 580 }}>
        Cloud24 Exchange — фронтенд, который подключается к открытому почтовому ядру
        (Postfix + Dovecot + Radicale в dev-окружении или grommunio в production)
        через стандартные протоколы IMAP, SMTP, CalDAV и CardDAV.
      </p>

      <section style={{ marginTop: 24, maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card t={t} title="Учётная запись">
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="Имя" value={user?.displayName ?? '—'} />
        </Card>

        <Card t={t} title="Бэкенд">
          <Row label="Тип" value="IMAP / SMTP / CalDAV / CardDAV" />
          <Row label="Совместимость" value="grommunio · Postfix+Dovecot · Radicale" />
        </Card>

        <Card t={t} title="О проекте">
          <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textMuted, margin: 0 }}>
            Альтернатива Microsoft Exchange на базе открытого ПО. Совместима с любым
            почтовым сервером, поддерживающим стандартные протоколы. Дизайн-канвас
            с экранами хранится в корне репозитория как референс для дальнейшей
            доработки UI.
          </p>
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children, t }: { title: string; children: React.ReactNode; t: typeof lightTheme }) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
      <span style={{ color: '#6B6557' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
