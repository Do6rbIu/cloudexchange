import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Icon } from '../components/shared/Icon';
import { lightTheme } from '../components/shared/theme';

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') {
    navigate('/inbox', { replace: true });
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password, displayName: displayName || undefined });
      navigate('/inbox', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  }

  const t = lightTheme;

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 480px',
        background: t.bg,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          background:
            'linear-gradient(135deg, #1A1814 0%, #2D2A26 50%, #2D4FE0 140%)',
          color: '#F0EBE0',
          padding: 64,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#A8B8FF' }}>
          <Icon name="logo" size={28} />
          <span style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>
            Cloud24 Exchange
          </span>
        </div>
        <div>
          <h1 style={{ fontSize: 44, lineHeight: 1.15, letterSpacing: -1, fontWeight: 600, margin: 0 }}>
            Корпоративная почта<br />и календарь —<br />в защищённом контуре
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#A39B89', maxWidth: 520, marginTop: 18 }}>
            Альтернатива Microsoft Exchange на базе открытых протоколов IMAP, SMTP,
            CalDAV и CardDAV. Совместима с grommunio в роли почтового ядра.
          </p>
        </div>
        <div style={{ fontSize: 12, color: '#6B6557' }}>© Cloud24 · 2026</div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
        <form
          onSubmit={onSubmit}
          style={{
            width: '100%',
            maxWidth: 380,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Вход в аккаунт
            </div>
            <h2 style={{ fontSize: 26, margin: '8px 0 0', letterSpacing: -0.4 }}>Добро пожаловать</h2>
          </div>

          <Field label="Email">
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@cloud24.ru"
              style={inputStyle(t)}
            />
          </Field>

          <Field label="Пароль">
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle(t)}
            />
          </Field>

          <Field label="Отображаемое имя (необязательно)">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Иван Иванов"
              style={inputStyle(t)}
            />
          </Field>

          {error && (
            <div
              style={{
                fontSize: 13,
                color: t.danger,
                background: '#FBE8E5',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${t.danger}33`,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            style={{
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#FFF',
              background: submitting ? t.textDim : t.accent,
              border: 'none',
              borderRadius: 8,
              cursor: submitting ? 'progress' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Входим…' : 'Войти'}
          </button>

          <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
            Учётные данные используются для входа в IMAP/SMTP-сервер. В dev-окружении
            создайте ящик через инфраструктурный скрипт <code>scripts/setup-mailbox.sh</code>.
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B6557', textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(t: typeof lightTheme): React.CSSProperties {
  return {
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.text,
    outline: 'none',
  };
}
