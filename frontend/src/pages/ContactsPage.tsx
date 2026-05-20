import { useCallback, useEffect, useMemo, useState } from 'react';
import { contactsApi } from '../api/contacts';
import type { Contact } from '../types/api';
import { lightTheme } from '../components/shared/theme';
import { colorFor, initialsOf } from '../components/shared/format';

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const t = lightTheme;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactsApi.list();
      setContacts(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить контакты');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!filter) return contacts;
    const q = filter.toLowerCase();
    return contacts.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.emails.some((e) => e.toLowerCase().includes(q)) ||
        (c.organization ?? '').toLowerCase().includes(q),
    );
  }, [contacts, filter]);

  async function onDelete(c: Contact) {
    if (!confirm(`Удалить контакт ${c.fullName}?`)) return;
    try {
      await contactsApi.remove(c.url, c.etag);
      setContacts((prev) => prev.filter((x) => x.uid !== c.uid));
      if (selected?.uid === c.uid) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить');
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%', overflow: 'hidden' }}>
      <aside
        style={{
          borderRight: `1px solid ${t.border}`,
          background: t.surface,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: 16, borderBottom: `1px solid ${t.border}`, display: 'flex', gap: 8 }}>
          <input
            placeholder="Поиск контактов"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: 13,
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              background: t.bg,
              color: t.text,
              fontFamily: 'inherit',
            }}
          />
          <button type="button" onClick={() => setShowForm(true)} style={primaryBtn(t)}>
            +
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 16, color: t.textMuted }}>Загружаем…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 16, color: t.textMuted, fontSize: 13 }}>Нет контактов</div>
          )}
          {filtered.map((c) => {
            const active = selected?.uid === c.uid;
            return (
              <button
                key={c.uid}
                type="button"
                onClick={() => setSelected(c)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: active ? t.accentSoft : 'transparent',
                  borderBottom: `1px solid ${t.border}`,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: t.text,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: colorFor(c.fullName),
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: 11,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {initialsOf(c.fullName)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.fullName}
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.emails[0] || c.organization || ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section style={{ background: t.bg, overflow: 'auto', padding: 32 }}>
        {error && (
          <div style={{ padding: '10px 14px', background: '#FBE8E5', color: t.danger, borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}
        {!selected && <div style={{ color: t.textMuted }}>Выберите контакт</div>}
        {selected && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: colorFor(selected.fullName),
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: 24,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {initialsOf(selected.fullName)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{selected.fullName}</h2>
                {selected.title && (
                  <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{selected.title}</div>
                )}
                {selected.organization && (
                  <div style={{ fontSize: 13, color: t.textMuted }}>{selected.organization}</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section label="Email" t={t}>
                {selected.emails.length === 0 ? (
                  <span style={{ color: t.textMuted }}>—</span>
                ) : (
                  selected.emails.map((e) => (
                    <div key={e} style={{ fontSize: 14 }}>
                      <a href={`mailto:${e}`} style={{ color: t.accent }}>
                        {e}
                      </a>
                    </div>
                  ))
                )}
              </Section>
              <Section label="Телефон" t={t}>
                {selected.phones.length === 0 ? (
                  <span style={{ color: t.textMuted }}>—</span>
                ) : (
                  selected.phones.map((p) => (
                    <div key={p} style={{ fontSize: 14 }}>
                      {p}
                    </div>
                  ))
                )}
              </Section>
              {selected.notes && (
                <Section label="Заметки" t={t}>
                  <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{selected.notes}</div>
                </Section>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => void onDelete(selected)} style={dangerBtn(t)}>
                Удалить
              </button>
            </div>
          </div>
        )}
      </section>

      {showForm && (
        <ContactForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void refresh();
          }}
          t={t}
        />
      )}
    </div>
  );
}

function Section({ label, children, t }: { label: string; children: React.ReactNode; t: typeof lightTheme }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ContactForm({
  onClose,
  onSaved,
  t,
}: {
  onClose: () => void;
  onSaved: () => void;
  t: typeof lightTheme;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await contactsApi.create({
        fullName,
        emails: email ? [email] : undefined,
        phones: phone ? [phone] : undefined,
        organization: organization || undefined,
      });
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,24,20,0.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: t.surface,
          borderRadius: 12,
          padding: 24,
          width: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Новый контакт</h3>
        <Lbl t={t}>Имя</Lbl>
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inp(t)} />
        <Lbl t={t}>Email</Lbl>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp(t)} />
        <Lbl t={t}>Телефон</Lbl>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inp(t)} />
        <Lbl t={t}>Организация</Lbl>
        <input value={organization} onChange={(e) => setOrganization(e.target.value)} style={inp(t)} />
        {err && <div style={{ color: t.danger, fontSize: 12 }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={navBtn(t)}>
            Отмена
          </button>
          <button type="submit" disabled={saving} style={primaryBtn(t)}>
            {saving ? 'Сохраняем…' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Lbl({ children, t }: { children: React.ReactNode; t: typeof lightTheme }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
      {children}
    </span>
  );
}

function inp(t: typeof lightTheme): React.CSSProperties {
  return {
    padding: '8px 10px',
    fontSize: 13,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    fontFamily: 'inherit',
    background: t.bg,
    color: t.text,
  };
}

function navBtn(t: typeof lightTheme): React.CSSProperties {
  return {
    padding: '6px 12px',
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: t.text,
  };
}

function primaryBtn(t: typeof lightTheme): React.CSSProperties {
  return {
    padding: '6px 14px',
    background: t.accent,
    color: '#FFF',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

function dangerBtn(t: typeof lightTheme): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: 'transparent',
    border: `1px solid ${t.danger}`,
    color: t.danger,
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}
