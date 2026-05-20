import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mailApi } from '../api/mail';
import { useTheme } from '../store/theme';
import type { Theme } from '../components/shared/theme';
import { Icon } from '../components/shared/Icon';

interface ComposerState {
  to?: string;
  subject?: string;
  inReplyTo?: string;
  references?: string[];
  quote?: string | null;
}

export function ComposerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: t } = useTheme();
  const initial = (location.state ?? {}) as ComposerState;

  const [to, setTo] = useState(initial.to ?? '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [body, setBody] = useState(
    initial.quote
      ? `\n\n---\n${initial.quote.split('\n').slice(0, 30).map((l) => `> ${l}`).join('\n')}`
      : '',
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function parseAddressList(input: string): string[] {
    return input
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      const result = await mailApi.send({
        to: parseAddressList(to),
        cc: cc ? parseAddressList(cc) : undefined,
        subject,
        text: body,
        inReplyTo: initial.inReplyTo ?? undefined,
        references: initial.references,
      });
      setSuccess(`Письмо отправлено. ID: ${result.messageId}`);
      setTimeout(() => navigate('/inbox'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', background: t.bg, color: t.text }}>
      <header
        style={{
          padding: '16px 32px',
          borderBottom: `1px solid ${t.border}`,
          background: t.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{initial.subject ? 'Ответ на письмо' : 'Новое письмо'}</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            Письмо будет отправлено через SMTP-сервер с вашими IMAP-кредами
          </div>
        </div>
        <button type="button" onClick={() => navigate(-1)} style={secondaryBtn(t)}>
          Отмена
        </button>
      </header>

      <form
        onSubmit={onSubmit}
        style={{
          maxWidth: 820,
          margin: '32px auto',
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <Row label="Кому" t={t}>
          <input
            type="text"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com, second@example.com"
            style={inputStyle(t)}
          />
        </Row>
        <Row label="Копия" t={t}>
          <input
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="(необязательно)"
            style={inputStyle(t)}
          />
        </Row>
        <Row label="Тема" t={t}>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={inputStyle(t)}
          />
        </Row>
        <Row label="Сообщение" t={t}>
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            style={{
              ...inputStyle(t),
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.55,
            }}
          />
        </Row>

        {error && <Notice color={t.danger} bg="rgba(192,57,43,0.12)">{error}</Notice>}
        {success && <Notice color={t.success} bg="rgba(31,138,91,0.14)">{success}</Notice>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate(-1)} style={secondaryBtn(t)}>
            Отмена
          </button>
          <button type="submit" disabled={sending} style={primaryBtn(t, sending)}>
            <Icon name="send" size={14} color="#FFF" />
            <span style={{ marginLeft: 6 }}>{sending ? 'Отправляем…' : 'Отправить'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ label, children, t }: { label: string; children: React.ReactNode; t: Theme }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(t: Theme): React.CSSProperties {
  return {
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.text,
    outline: 'none',
  };
}

function primaryBtn(t: Theme, busy: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    background: busy ? t.textDim : t.accent,
    color: '#FFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: busy ? 'progress' : 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
  };
}

function secondaryBtn(t: Theme): React.CSSProperties {
  return {
    padding: '10px 16px',
    background: 'transparent',
    color: t.text,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

function Notice({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <div style={{ padding: '10px 12px', fontSize: 13, color, background: bg, borderRadius: 8 }}>
      {children}
    </div>
  );
}
