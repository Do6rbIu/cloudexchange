import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mailApi } from '../api/mail';
import { lightTheme } from '../components/shared/theme';

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
  const t = lightTheme;

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
      setSuccess(`Письмо отправлено (id: ${result.messageId})`);
      setTimeout(() => navigate('/inbox'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', background: t.bg }}>
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
        <h2 style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>Новое письмо</h2>

        <Row label="Кому">
          <input
            type="text"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com, second@example.com"
            style={inputStyle(t)}
          />
        </Row>
        <Row label="Копия">
          <input
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="(необязательно)"
            style={inputStyle(t)}
          />
        </Row>
        <Row label="Тема">
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={inputStyle(t)}
          />
        </Row>
        <Row label="Сообщение">
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            style={{ ...inputStyle(t), resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55 }}
          />
        </Row>

        {error && <Notice color={t.danger} bg="#FBE8E5">{error}</Notice>}
        {success && <Notice color={t.success} bg="#E3F4EC">{success}</Notice>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate(-1)} style={secondaryBtn(t)}>
            Отмена
          </button>
          <button type="submit" disabled={sending} style={primaryBtn(t, sending)}>
            {sending ? 'Отправляем…' : 'Отправить'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6557', textTransform: 'uppercase', letterSpacing: 1.2 }}>
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
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.text,
    outline: 'none',
  };
}

function primaryBtn(t: typeof lightTheme, busy: boolean): React.CSSProperties {
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
  };
}

function secondaryBtn(t: typeof lightTheme): React.CSSProperties {
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
