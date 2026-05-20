import { useCallback, useEffect, useMemo, useState } from 'react';
import { calendarApi } from '../api/calendar';
import type { CalendarEvent, CalendarSummary } from '../types/api';
import { useTheme } from '../store/theme';
import type { Theme } from '../components/shared/theme';

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - day);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 — 19:00

export function CalendarPage() {
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { theme: t } = useTheme();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cals, evts] = await Promise.all([
        calendarApi.calendars(),
        calendarApi.events(weekStart.toISOString(), addDays(weekStart, 7).toISOString()),
      ]);
      setCalendars(cals);
      setEvents(evts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить календарь');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  function eventsForDay(day: Date): CalendarEvent[] {
    return events.filter((e) => {
      const start = new Date(e.start);
      return (
        start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate()
      );
    });
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      <header
        style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: t.surface,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Календарь</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            {weekStart.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })} —{' '}
            {addDays(weekStart, 6).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} style={navBtn(t)}>
            ← Назад
          </button>
          <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))} style={navBtn(t)}>
            Сегодня
          </button>
          <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} style={navBtn(t)}>
            Вперёд →
          </button>
          <button type="button" onClick={() => setShowForm(true)} style={primaryBtn(t)}>
            + Событие
          </button>
        </div>
      </header>

      {error && (
        <div style={{ margin: 16, padding: '10px 14px', background: '#FBE8E5', color: t.danger, borderRadius: 8 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {loading && <div style={{ color: t.textMuted, padding: 20 }}>Загружаем события…</div>}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px repeat(7, 1fr)',
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              style={{
                padding: '10px 12px',
                borderBottom: `1px solid ${t.border}`,
                borderLeft: `1px solid ${t.border}`,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <div style={{ color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                {d.toLocaleDateString('ru-RU', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: 18, marginTop: 4 }}>{d.getDate()}</div>
            </div>
          ))}

          {HOURS.map((hour) => (
            <Hour key={hour} hour={hour} days={days} eventsForDay={eventsForDay} t={t} />
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: t.textMuted }}>
          Календарей: {calendars.length}. События отображаются с 07:00 до 20:00.
        </div>
      </div>

      {showForm && (
        <EventForm
          calendars={calendars}
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

function Hour({
  hour,
  days,
  eventsForDay,
  t,
}: {
  hour: number;
  days: Date[];
  eventsForDay: (d: Date) => CalendarEvent[];
  t: Theme;
}) {
  return (
    <>
      <div
        style={{
          padding: '8px 6px',
          borderTop: `1px solid ${t.border}`,
          fontSize: 11,
          color: t.textMuted,
          textAlign: 'right',
        }}
      >
        {String(hour).padStart(2, '0')}:00
      </div>
      {days.map((d) => {
        const dayEvents = eventsForDay(d).filter((e) => new Date(e.start).getHours() === hour);
        return (
          <div
            key={`${hour}-${d.toISOString()}`}
            style={{
              padding: 4,
              borderTop: `1px solid ${t.border}`,
              borderLeft: `1px solid ${t.border}`,
              minHeight: 52,
            }}
          >
            {dayEvents.map((e) => (
              <div
                key={e.uid}
                title={`${fmtTime(e.start)}–${fmtTime(e.end)} · ${e.title}`}
                style={{
                  background: t.accentSoft,
                  color: t.accent,
                  borderLeft: `3px solid ${t.accent}`,
                  padding: '4px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 4,
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fmtTime(e.start)} {e.title}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function EventForm({
  calendars,
  onClose,
  onSaved,
  t,
}: {
  calendars: CalendarSummary[];
  onClose: () => void;
  onSaved: () => void;
  t: Theme;
}) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [calendarUrl, setCalendarUrl] = useState(calendars[0]?.url ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!calendarUrl) {
      setErr('Нет доступных календарей');
      return;
    }
    setSaving(true);
    try {
      await calendarApi.create({
        calendarUrl,
        title,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        location: location || undefined,
        description: description || undefined,
      });
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Ошибка сохранения');
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
          width: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Новое событие</h3>
        <Lbl t={t}>Календарь</Lbl>
        <select value={calendarUrl} onChange={(e) => setCalendarUrl(e.target.value)} style={inp(t)}>
          {calendars.map((c) => (
            <option key={c.url} value={c.url}>
              {c.displayName}
            </option>
          ))}
        </select>
        <Lbl t={t}>Название</Lbl>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} style={inp(t)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Lbl t={t}>Начало</Lbl>
            <input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} style={inp(t)} />
          </div>
          <div>
            <Lbl t={t}>Конец</Lbl>
            <input type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} style={inp(t)} />
          </div>
        </div>
        <Lbl t={t}>Место</Lbl>
        <input value={location} onChange={(e) => setLocation(e.target.value)} style={inp(t)} />
        <Lbl t={t}>Описание</Lbl>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inp(t), resize: 'vertical', fontFamily: 'inherit' }}
        />
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

function Lbl({ children, t }: { children: React.ReactNode; t: Theme }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
      {children}
    </span>
  );
}

function inp(t: Theme): React.CSSProperties {
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

function navBtn(t: Theme): React.CSSProperties {
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

function primaryBtn(t: Theme): React.CSSProperties {
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
