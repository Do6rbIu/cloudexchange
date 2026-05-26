import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import { Icon } from '../components/shared/Icon';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? '';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? '';
const HAS_DEMO = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

export function LoginPage() {
  const { login, completeTwoFa, status } = useAuth();
  const { theme: t, dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState(HAS_DEMO ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(HAS_DEMO ? DEMO_PASSWORD : '');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twofaCode, setTwofaCode] = useState('');

  if (status === 'authenticated') {
    navigate('/inbox', { replace: true });
    return null;
  }

  async function submitWith(emailValue: string, passwordValue: string, nameValue?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const twofaRequired = await login({ email: emailValue, password: passwordValue, displayName: nameValue });
      if (!twofaRequired) {
        navigate('/inbox', { replace: true });
      }
      // Otherwise the component re-renders into the 2FA challenge (status === 'twofa').
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submitWith(email, password, displayName || undefined);
  }

  async function onDemoClick() {
    await submitWith(DEMO_EMAIL, DEMO_PASSWORD, 'Игорь Петров');
  }

  async function onTwoFaSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await completeTwoFa(twofaCode);
      navigate('/inbox', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'twofa') {
    return (
      <TwoFaChallenge
        t={t}
        code={twofaCode}
        setCode={setTwofaCode}
        onSubmit={onTwoFaSubmit}
        submitting={submitting}
        error={error}
      />
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 480px',
        background: t.bg,
        fontFamily: 'Inter, sans-serif',
        color: t.text,
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(45,79,224,0.45) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -120,
            left: -120,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(122,79,224,0.25) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, color: '#A8B8FF' }}>
          <Icon name="logo" size={28} />
          <span style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>
            Cloud24 Exchange
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 44, lineHeight: 1.15, letterSpacing: -1, fontWeight: 600, margin: 0 }}>
            Корпоративная почта<br />и календарь —<br />в защищённом контуре
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#A39B89', maxWidth: 520, marginTop: 18 }}>
            Альтернатива Microsoft Exchange на базе открытых протоколов IMAP, SMTP,
            CalDAV и CardDAV. Совместима с grommunio в роли почтового ядра.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 32, color: '#A39B89', fontSize: 13 }}>
            <Stat label="Экранов" value="6" />
            <Stat label="Протоколов" value="4" />
            <Stat label="Без vendor lock-in" value="✓" />
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 12, color: '#6B6557' }}>© Cloud24 · 2026</div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 48, position: 'relative' }}>
        <button
          type="button"
          onClick={toggle}
          title={dark ? 'Светлая тема' : 'Тёмная тема'}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            color: t.textMuted,
            fontSize: 11,
            fontFamily: 'inherit',
          }}
        >
          {dark ? '☀ Светлая' : '☾ Тёмная'}
        </button>
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

          <Field label="Email" t={t}>
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

          <Field label="Пароль" t={t}>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle(t)}
            />
          </Field>

          <Field label="Отображаемое имя (необязательно)" t={t}>
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
                background: dark ? '#3A1F1B' : '#FBE8E5',
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
              fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Входим…' : 'Войти'}
          </button>

          {HAS_DEMO && (
            <button
              type="button"
              onClick={onDemoClick}
              disabled={submitting}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: t.accent,
                background: t.accentSoft,
                border: `1px solid ${t.accent}33`,
                borderRadius: 8,
                cursor: submitting ? 'progress' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Icon name="user" size={14} />
              Войти как демо-пользователь (Игорь Петров)
            </button>
          )}

          <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
            Учётные данные используются для входа в IMAP/SMTP-сервер. В dev-окружении
            создайте ящик через <code style={{ background: t.surfaceAlt, padding: '1px 6px', borderRadius: 4 }}>scripts/bootstrap-demo.sh</code>.
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#F0EBE0' }}>{value}</div>
      <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function Field({ label, children, t }: { label: string; children: React.ReactNode; t: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(t: ReturnType<typeof useTheme>['theme']): React.CSSProperties {
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

function TwoFaChallenge({
  t,
  code,
  setCode,
  onSubmit,
  submitting,
  error,
}: {
  t: ReturnType<typeof useTheme>['theme'];
  code: string;
  setCode: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: t.bg, color: t.text }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 32,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: t.accent }}>
          <Icon name="shield" size={22} />
          <span style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase' }}>
            Двухфакторная защита
          </span>
        </div>
        <h2 style={{ fontSize: 22, margin: 0, letterSpacing: -0.4 }}>Введите код</h2>
        <p style={{ fontSize: 13, color: t.textMuted, margin: 0, lineHeight: 1.5 }}>
          Откройте приложение-аутентификатор (Google Authenticator, Aegis, 1Password)
          и введите 6-значный код. Можно использовать резервный код.
        </p>
        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          style={{
            ...inputStyle(t),
            fontSize: 24,
            letterSpacing: 8,
            textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
        {error && (
          <div
            style={{
              fontSize: 13,
              color: t.danger,
              background: 'rgba(192,57,43,0.12)',
              padding: '10px 12px',
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || code.length < 6}
          style={{
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            color: '#FFF',
            background: submitting ? t.textDim : t.accent,
            border: 'none',
            borderRadius: 8,
            cursor: submitting ? 'progress' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Проверяем…' : 'Подтвердить'}
        </button>
      </form>
    </div>
  );
}
