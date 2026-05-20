// Cloud24 Exchange — Direction A "Steel" — additional screens
// Composer, Calendar, Contacts, Search, Settings

// ─────────────────────────────────────────────────────────────────────────
// Composer
// ─────────────────────────────────────────────────────────────────────────

function SteelComposer({ dark }) {
  const t = useSteelTokens(dark);
  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg,
      color: t.text, fontFamily: SteelType.fontFamily, fontSize: 13,
      padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%', maxWidth: 980, height: '100%',
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10,
        boxShadow: t.shadowLg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>Новое письмо</div>
          <span style={{ fontSize: 11, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success }} />
            Сохранено как черновик · 10:51
          </span>
          <button style={{
            width: 26, height: 26, borderRadius: 5, border: 'none', background: 'transparent',
            color: t.textMuted, cursor: 'pointer', fontSize: 16,
          }}>−</button>
          <button style={{
            width: 26, height: 26, borderRadius: 5, border: 'none', background: 'transparent',
            color: t.textMuted, cursor: 'pointer', fontSize: 14,
          }}>✕</button>
        </div>

        {/* Recipients */}
        <div style={{ padding: '4px 18px' }}>
          <ComposerField t={t} label="Кому">
            <ComposerChip t={t} name="Анна Соколова" email="a.sokolova@gazprom-tech.ru" external />
            <ComposerChip t={t} name="Михаил Дорохов" email="m.dorokhov@cloud24.ru" />
            <input placeholder="" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: t.text, flex: 1, minWidth: 100 }} />
          </ComposerField>
          <ComposerField t={t} label="Копия">
            <ComposerChip t={t} name="legal@cloud24.ru" group />
            <input placeholder="Добавить..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: t.textMuted, flex: 1 }} />
          </ComposerField>
          <ComposerField t={t} label="Тема">
            <input defaultValue="Re: Договор на поставку оборудования — финальная редакция"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontWeight: 600, color: t.text, flex: 1 }} />
          </ComposerField>
        </div>

        {/* AI bar */}
        <div style={{
          margin: '8px 18px 0', padding: '10px 12px',
          background: t.aiBg, border: `1px solid ${t.aiBorder}`, borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="sparkle" size={15} color={t.aiText} />
          <span style={{ fontSize: 12, color: t.aiText, fontWeight: 600 }}>AI помощь:</span>
          <SteelAIPill t={t}>Написать ответ</SteelAIPill>
          <SteelAIPill t={t}>Подобрать тон</SteelAIPill>
          <SteelAIPill t={t}>Исправить ошибки</SteelAIPill>
          <SteelAIPill t={t}>Сократить</SteelAIPill>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: t.aiText, fontFamily: SteelType.mono }}>⌘J</span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '16px 18px', overflow: 'auto' }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.7, color: t.text }}>
            <p style={{ margin: '0 0 12px' }}>Анна, добрый день.</p>
            <p style={{ margin: '0 0 12px' }}>
              Спасибо за финальную редакцию. По пункту 4.2 — сроки поставки в текущей формулировке нас устраивают.
              <span style={{ background: `${t.accent}22`, color: t.accentText, padding: '0 3px', borderRadius: 2 }}>По пункту 7.1 предлагаю обсудить завтра в 11:00 — есть несколько вопросов по разделу ответственности.</span>
            </p>
            <p style={{ margin: '0 0 12px', color: t.textMuted, fontStyle: 'italic' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: t.aiText, fontStyle: 'normal', marginRight: 8 }}>
                <Icon name="sparkle" size={11} /> AI
              </span>
              Готов согласовать остальное в текущей редакции. Подписание планируем на конец недели — отправлю подписанный экземпляр в пятницу.
            </p>
            <p style={{ margin: '12px 0 0', color: t.text }}>С уважением,<br/>Игорь Котов<br/>CEO, Cloud24</p>
          </div>
        </div>

        {/* Attachments inline */}
        <div style={{
          padding: '10px 18px', borderTop: `1px solid ${t.divider}`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginRight: 6 }}>
            Вложения · 2
          </span>
          <SteelFileChip t={t} type="DOC" name="Договор v5 (правки)" />
          <SteelFileChip t={t} type="PDF" name="Комментарии юристов" />
          <button style={{
            fontSize: 11.5, padding: '4px 10px', background: 'transparent',
            color: t.textMuted, border: `1px dashed ${t.borderStrong}`, borderRadius: 4, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="plus" size={11} /> добавить
          </button>
        </div>

        {/* Bottom action bar */}
        <div style={{
          padding: '12px 18px', borderTop: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', gap: 8, background: t.surfaceAlt,
        }}>
          <button style={{
            height: 34, padding: '0 18px', borderRadius: 6,
            background: t.accent, color: '#fff', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Отправить <span style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.2)', borderRadius: 3, fontFamily: SteelType.mono }}>⌘↵</span>
          </button>
          <button style={{
            height: 34, width: 34, borderRadius: 6, border: `1px solid ${t.border}`,
            background: t.surface, color: t.textMuted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="down" size={14} /></button>

          <div style={{ width: 1, height: 22, background: t.border, margin: '0 4px' }} />

          <SteelIconBtn2 t={t} icon="attach" label="Вложить" />
          <SteelIconBtn2 t={t} icon="tag" label="Метки" />
          <SteelIconBtn2 t={t} icon="snooze" label="Отложить отправку" />
          <SteelIconBtn2 t={t} icon="lock" label="Шифрование" highlighted />

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: t.textMuted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success }} />
              S/MIME · GOST шифрование
            </span>
            <SteelIconBtn2 t={t} icon="trash" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposerField({ t, label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, minHeight: 38,
      padding: '6px 0', borderBottom: `1px solid ${t.divider}`,
    }}>
      <div style={{ width: 70, fontSize: 11.5, color: t.textMuted, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function ComposerChip({ t, name, email, external, group }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px 3px 4px',
      background: external ? t.warnBg : t.surfaceSunken,
      border: `1px solid ${external ? '#E6C58F' : t.border}`,
      borderRadius: 12, fontSize: 11.5,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: external ? t.warn : (group ? t.accent : t.text),
        color: '#fff', fontSize: 9, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{group ? '@' : name.split(' ').map(x => x[0]).join('').slice(0, 2)}</span>
      <span style={{ color: t.text, fontWeight: 600 }}>{name}</span>
      {email && <span style={{ color: t.textMuted }}>· {email}</span>}
      {external && <span style={{ color: t.warn, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>внешний</span>}
    </span>
  );
}

function SteelAIPill({ t, children }) {
  return (
    <button style={{
      fontSize: 11.5, padding: '4px 10px', borderRadius: 4,
      background: 'rgba(255,255,255,0.6)', border: `1px solid ${t.aiBorder}`,
      color: t.aiText, fontWeight: 500, cursor: 'pointer',
    }}>{children}</button>
  );
}

function SteelFileChip({ t, type, name }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px',
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4, fontSize: 11.5,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 3, fontSize: 9, fontWeight: 700,
        background: type === 'PDF' ? t.dangerBg : t.accentBg,
        color: type === 'PDF' ? t.danger : t.accent,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: SteelType.mono,
      }}>{type}</span>
      <span style={{ color: t.text }}>{name}</span>
    </span>
  );
}

function SteelIconBtn2({ t, icon, label, highlighted }) {
  return (
    <button style={{
      height: 30, padding: label ? '0 10px 0 8px' : '0 8px',
      display: 'flex', alignItems: 'center', gap: 6,
      background: highlighted ? t.successBg : 'transparent',
      color: highlighted ? t.success : t.textMuted,
      border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11.5,
    }}>
      <Icon name={icon} size={14} /> {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Calendar — week view
// ─────────────────────────────────────────────────────────────────────────

function SteelCalendar({ dark }) {
  const t = useSteelTokens(dark);
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const ROW_H = 56;

  return (
    <SteelChrome dark={dark} active="calendar">
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '240px 1fr', background: t.surface }}>
        {/* Side panel */}
        <div style={{ borderRight: `1px solid ${t.border}`, padding: 16, overflow: 'auto', background: t.surfaceAlt }}>
          {/* Mini calendar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Май 2026</div>
            <button style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="arrowLeft" size={12} /></button>
            <button style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="arrowRight" size={12} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, fontSize: 11 }}>
            {['П','В','С','Ч','П','С','В'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '4px 0', color: t.textSubtle, fontWeight: 600 }}>{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 3; // May starts on a Friday-ish
              const isToday = day === 20;
              const inMonth = day >= 1 && day <= 31;
              const isWeekend = i % 7 === 5 || i % 7 === 6;
              return (
                <div key={i} style={{
                  textAlign: 'center', padding: '5px 0', fontSize: 11, borderRadius: 4,
                  color: isToday ? '#fff' : (inMonth ? (isWeekend ? t.textMuted : t.text) : t.textSubtle),
                  background: isToday ? t.accent : (day === 18 || day === 19 || day === 21 || day === 22 ? t.selected : 'transparent'),
                  fontWeight: isToday ? 700 : 500, cursor: 'pointer',
                }}>{inMonth ? day : (day < 1 ? 30 + day : day - 31)}</div>
              );
            })}
          </div>

          {/* Calendars */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: t.textSubtle, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Мои календари</div>
            <CalListItem t={t} color="#2D4FE0" label="Личный" checked />
            <CalListItem t={t} color="#1F8A5B" label="Cloud24 — команда" checked />
            <CalListItem t={t} color="#C0392B" label="Внешние встречи" checked />
            <CalListItem t={t} color="#B5773A" label="Дни рождения" />
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: t.textSubtle, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Подписки</div>
            <CalListItem t={t} color="#7A4FE0" label="Roadmap H2" checked />
            <CalListItem t={t} color="#6B7280" label="Праздники РФ" checked />
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: t.textSubtle, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Часовые пояса</div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginBottom: 4 }}><span style={{ fontFamily: SteelType.mono, color: t.text, fontWeight: 600 }}>10:42</span> Москва · GMT+3</div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginBottom: 4 }}><span style={{ fontFamily: SteelType.mono, color: t.text }}>13:42</span> Новосибирск · GMT+7</div>
            <div style={{ fontSize: 11.5, color: t.textMuted }}><span style={{ fontFamily: SteelType.mono, color: t.text }}>05:42</span> SF · GMT-7</div>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            height: 48, padding: '0 18px', borderBottom: `1px solid ${t.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>18–24 мая 2026</div>
            <div style={{ display: 'flex', gap: 0, border: `1px solid ${t.border}`, borderRadius: 5, marginLeft: 8 }}>
              <SteelSeg t={t}>День</SteelSeg>
              <SteelSeg t={t} active>Неделя</SteelSeg>
              <SteelSeg t={t}>Месяц</SteelSeg>
              <SteelSeg t={t}>Год</SteelSeg>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SteelToolBtn t={t} icon="arrowLeft" />
              <button style={{
                fontSize: 12, padding: '5px 12px', border: `1px solid ${t.border}`,
                background: t.surface, color: t.text, borderRadius: 5, cursor: 'pointer', fontWeight: 600,
              }}>Сегодня</button>
              <SteelToolBtn t={t} icon="arrowRight" />
              <div style={{ width: 1, height: 22, background: t.border, margin: '0 6px' }} />
              <button style={{
                height: 32, padding: '0 12px', borderRadius: 5,
                background: t.accent, color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}>
                <Icon name="plus" size={13} /> Создать
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: `54px repeat(7, 1fr)`, borderBottom: `1px solid ${t.border}`, background: t.surfaceAlt }}>
            <div />
            {WEEK_DAYS.map(d => (
              <div key={d.label} style={{
                padding: '8px 12px', borderLeft: `1px solid ${t.divider}`,
                background: d.today ? t.accentBg : 'transparent',
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: d.today ? t.accent : (d.weekend ? t.textSubtle : t.textMuted), textTransform: 'uppercase' }}>{d.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: d.today ? t.accent : (d.weekend ? t.textMuted : t.text), letterSpacing: -0.5, marginTop: 2 }}>{d.date}</div>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `54px repeat(7, 1fr)`, position: 'relative' }}>
              {/* Hours column */}
              <div>
                {HOURS.map(h => (
                  <div key={h} style={{
                    height: ROW_H, padding: '4px 8px', fontSize: 10.5, color: t.textSubtle,
                    fontFamily: SteelType.mono, textAlign: 'right', borderTop: `1px solid ${t.divider}`,
                  }}>{String(h).padStart(2,'0')}:00</div>
                ))}
              </div>

              {/* Day columns */}
              {WEEK_DAYS.map((d, di) => (
                <div key={di} style={{
                  position: 'relative', borderLeft: `1px solid ${t.divider}`,
                  background: d.weekend ? t.surfaceSunken : (d.today ? `${t.accent}06` : 'transparent'),
                }}>
                  {HOURS.map(h => (
                    <div key={h} style={{ height: ROW_H, borderTop: `1px solid ${t.divider}` }} />
                  ))}
                  {/* Events */}
                  {EVENTS.filter(e => e.day === di).map((e, ei) => {
                    const top = (e.start - 8) * ROW_H;
                    const h = (e.end - e.start) * ROW_H - 2;
                    const current = e.current;
                    return (
                      <div key={ei} style={{
                        position: 'absolute', top, left: 4, right: 4, height: h,
                        background: current ? e.color : `${e.color}1A`,
                        color: current ? '#fff' : e.color,
                        borderLeft: `3px solid ${e.color}`, borderRadius: 4,
                        padding: '4px 6px', fontSize: 11, overflow: 'hidden',
                        boxShadow: current ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 11.5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                        <div style={{ fontSize: 10, marginTop: 2, opacity: current ? 0.9 : 0.85, fontFamily: SteelType.mono }}>
                          {String(Math.floor(e.start)).padStart(2,'0')}:{e.start % 1 ? '30' : '00'}–{String(Math.floor(e.end)).padStart(2,'0')}:{e.end % 1 ? '30' : '00'} · {e.attendees}
                        </div>
                      </div>
                    );
                  })}
                  {/* Current time indicator on today */}
                  {d.today && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: (10.7 - 8) * ROW_H, height: 2, background: t.danger, zIndex: 3 }}>
                      <span style={{ position: 'absolute', left: -5, top: -3, width: 8, height: 8, background: t.danger, borderRadius: '50%' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SteelChrome>
  );
}

function CalListItem({ t, color, label, checked }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: t.text }}>
      <span style={{
        width: 14, height: 14, borderRadius: 3,
        background: checked ? color : 'transparent',
        border: `1.5px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>{checked && <Icon name="check" size={10} stroke={2.5} />}</span>
      <span>{label}</span>
    </div>
  );
}

function SteelSeg({ t, active, children }) {
  return (
    <button style={{
      padding: '5px 12px', fontSize: 12, fontWeight: active ? 600 : 500,
      background: active ? t.selected : 'transparent',
      color: active ? t.accentText : t.textMuted,
      border: 'none', cursor: 'pointer',
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────────────────────────────────

function SteelContacts({ dark }) {
  const t = useSteelTokens(dark);
  const selected = CONTACTS[0];
  return (
    <SteelChrome dark={dark} active="contacts">
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '380px 1fr', background: t.surface }}>
        {/* List */}
        <div style={{ borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', background: t.surfaceAlt }}>
          <div style={{ height: 48, padding: '0 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>Контакты <span style={{ fontWeight: 500, color: t.textMuted }}>· 248</span></div>
            <SteelToolBtn t={t} icon="plus" />
          </div>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: 6 }}>
            <SteelChip t={t} active>Все</SteelChip>
            <SteelChip t={t}>Команда</SteelChip>
            <SteelChip t={t}>Партнёры</SteelChip>
            <SteelChip t={t}>VIP</SteelChip>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {['А', 'В', 'Д', 'Е', 'И', 'М', 'О', 'С', 'Т'].map(letter => (
              <React.Fragment key={letter}>
                <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, color: t.textSubtle, background: t.surfaceAlt, position: 'sticky', top: 0, letterSpacing: 0.6 }}>{letter}</div>
                {CONTACTS.filter(c => c.name[0] === letter).map((c, i) => (
                  <div key={c.email} style={{
                    padding: '10px 14px', borderBottom: `1px solid ${t.divider}`,
                    background: c.email === selected.email ? t.surface : 'transparent',
                    borderLeft: c.email === selected.email ? `3px solid ${t.accent}` : `3px solid transparent`,
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  }}>
                    <Avatar name={c.initials} color={c.color} size={32} font={11} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</div>
                    </div>
                    {c.tags.includes('VIP') && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: t.dangerBg, color: t.danger, fontWeight: 700, letterSpacing: 0.5 }}>VIP</span>}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Contact card */}
        <div style={{ overflow: 'auto' }}>
          {/* Hero */}
          <div style={{
            padding: '32px 36px 24px',
            borderBottom: `1px solid ${t.border}`,
            display: 'flex', gap: 20, alignItems: 'flex-start',
            background: t.surface,
          }}>
            <Avatar name={selected.initials} color={selected.color} size={84} font={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{selected.name}</div>
              <div style={{ fontSize: 14, color: t.textMuted, marginTop: 3 }}>{selected.role}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {selected.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 10, background: t.surfaceSunken, color: t.text, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button style={{ height: 32, padding: '0 14px', borderRadius: 5, background: t.accent, color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <Icon name="send" size={13} /> Написать
                </button>
                <button style={{ height: 32, padding: '0 14px', borderRadius: 5, background: t.surface, border: `1px solid ${t.border}`, color: t.text, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <Icon name="calendar" size={13} /> Запланировать встречу
                </button>
                <button style={{ height: 32, padding: '0 14px', borderRadius: 5, background: t.surface, border: `1px solid ${t.border}`, color: t.textMuted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>•••</button>
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div style={{ padding: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, alignItems: 'start' }}>
            <div>
              <DetailGroup t={t} title="Контактная информация">
                <DetailRow t={t} label="Email" value={selected.email} mono />
                <DetailRow t={t} label="Телефон" value={selected.phone} mono />
                <DetailRow t={t} label="Компания" value="Газпром-Tech" />
                <DetailRow t={t} label="Должность" value="Head of Legal" />
              </DetailGroup>

              <DetailGroup t={t} title="Связи в Cloud24">
                <DetailRow t={t} label="Куратор" value="Михаил Дорохов" />
                <DetailRow t={t} label="Договоры" value="3 активных" />
                <DetailRow t={t} label="С нами с" value="марта 2024" />
              </DetailGroup>
            </div>

            <div>
              <DetailGroup t={t} title="Последние взаимодействия">
                <ActivityRow t={t} icon="send" title="Договор на поставку оборудования"  meta="Письмо · сегодня, 10:42" />
                <ActivityRow t={t} icon="calendar" title="Звонок с Газпром-Tech"           meta="Встреча · вчера, 09:30" />
                <ActivityRow t={t} icon="send" title="NDA подписан"                        meta="Письмо · 14 мая" />
                <ActivityRow t={t} icon="calendar" title="Квартальный синк"                meta="Встреча · 28 апреля" />
              </DetailGroup>

              <DetailGroup t={t} title="Общие письма" count="42">
                <div style={{ fontSize: 11.5, color: t.textMuted, lineHeight: 1.5 }}>
                  За последние 90 дней: <b style={{ color: t.text }}>42</b> письма, среднее время ответа <b style={{ color: t.text }}>3 ч 12 мин</b>.
                  Темы: договоры (18), NDA (7), встречи (12), прочее (5).
                </div>
              </DetailGroup>
            </div>
          </div>
        </div>
      </div>
    </SteelChrome>
  );
}

function DetailGroup({ t, title, count, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</div>
        {count && <div style={{ fontSize: 11, color: t.textSubtle, fontFamily: SteelType.mono }}>{count}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DetailRow({ t, label, value, mono }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, padding: '7px 0', borderBottom: `1px solid ${t.divider}`, fontSize: 12.5 }}>
      <div style={{ color: t.textMuted }}>{label}</div>
      <div style={{ color: t.text, fontWeight: 500, fontFamily: mono ? SteelType.mono : 'inherit' }}>{value}</div>
    </div>
  );
}

function ActivityRow({ t, icon, title, meta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${t.divider}` }}>
      <div style={{
        width: 28, height: 28, borderRadius: 5,
        background: t.surfaceSunken, color: t.textMuted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flex: '0 0 auto', marginTop: 1,
      }}><Icon name={icon} size={13} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: t.text }}>{title}</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{meta}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  SteelComposer, SteelCalendar, SteelContacts,
});
