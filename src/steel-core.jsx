// Cloud24 Exchange — Direction A "Steel"
// Three-column dense corporate. Indigo accent on neutral graphite.
// Each screen is a self-contained component sized for a DCArtboard.

const STEEL_LIGHT = {
  bg: '#F4F5F7', surface: '#FFFFFF', surfaceAlt: '#FBFBFC', surfaceSunken: '#EEF0F3',
  border: '#E5E7EB', borderStrong: '#D1D5DB', divider: '#EDEFF2',
  text: '#0F172A', textMuted: '#5B6573', textSubtle: '#94A1B0',
  accent: '#2D4FE0', accentText: '#1F3BC7', accentBg: '#EEF1FE', accentBorder: '#C7D2FE',
  hover: '#F1F3F7', selected: '#E8ECFD', selectedBorder: '#C7D2FE',
  success: '#1F8A5B', successBg: '#E6F4ED',
  warn: '#B5773A', warnBg: '#FBF1E2',
  danger: '#C0392B', dangerBg: '#FBE9E7',
  aiBg: '#F5F2FE', aiBorder: '#DDD5FA', aiText: '#5036B5',
  shadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
  shadowLg: '0 12px 40px rgba(15, 23, 42, 0.12)',
};

const STEEL_DARK = {
  bg: '#0B0E14', surface: '#131822', surfaceAlt: '#171D28', surfaceSunken: '#0F141C',
  border: '#232A38', borderStrong: '#2E3645', divider: '#1C222D',
  text: '#E8EAEE', textMuted: '#8B95A6', textSubtle: '#5C6473',
  accent: '#5C73F0', accentText: '#A9B6FF', accentBg: '#1A2150', accentBorder: '#2F3D7A',
  hover: '#1B2230', selected: '#1F2A4E', selectedBorder: '#2F3D7A',
  success: '#3FB47C', successBg: '#143728',
  warn: '#D89A55', warnBg: '#3A2B17',
  danger: '#E5644E', dangerBg: '#3A1C18',
  aiBg: '#221B40', aiBorder: '#3A2F66', aiText: '#C7B6FF',
  shadow: '0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.5)',
};

const useSteelTokens = (dark) => dark ? STEEL_DARK : STEEL_LIGHT;

// Common typography
const SteelType = {
  fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

// ─────────────────────────────────────────────────────────────────────────
// Chrome: left rail + top bar wrapper
// ─────────────────────────────────────────────────────────────────────────

function SteelChrome({ dark, active = 'inbox', topbar = true, children }) {
  const t = useSteelTokens(dark);
  return (
    <div style={{
      width: '100%', height: '100%',
      background: t.bg, color: t.text,
      fontFamily: SteelType.fontFamily, fontSize: 13,
      display: 'grid', gridTemplateColumns: '224px 1fr', gridTemplateRows: topbar ? '52px 1fr' : '1fr',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      {topbar && (
        <div style={{
          gridColumn: '1 / -1',
          background: t.surface, borderBottom: `1px solid ${t.border}`,
          display: 'grid', gridTemplateColumns: '224px 1fr 360px', alignItems: 'center',
          height: 52,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16 }}>
            <div style={{ color: t.accent }}><Icon name="logo" size={22} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.2 }}>Cloud24 Exchange</div>
              <div style={{ fontSize: 10.5, color: t.textSubtle, letterSpacing: 0.4, textTransform: 'uppercase' }}>Корпоративная почта</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
            <div style={{
              width: '100%', maxWidth: 560,
              height: 32, background: t.surfaceSunken, border: `1px solid ${t.border}`,
              borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 10px', color: t.textMuted,
            }}>
              <Icon name="search" size={15} />
              <span style={{ fontSize: 12.5, flex: 1 }}>Поиск по почте, контактам и календарю</span>
              <span style={{
                fontSize: 10, padding: '2px 6px', background: t.surface,
                border: `1px solid ${t.border}`, borderRadius: 4, fontFamily: SteelType.mono,
              }}>⌘K</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingRight: 16, color: t.textMuted }}>
            <SteelIconBtn t={t}><Icon name="sparkle" size={16} /></SteelIconBtn>
            <SteelIconBtn t={t}><Icon name="bell" size={16} /></SteelIconBtn>
            <SteelIconBtn t={t}><Icon name="settings" size={16} /></SteelIconBtn>
            <div style={{ width: 1, height: 22, background: t.border, margin: '0 6px' }} />
            <Avatar name="ИК" color="#2D4FE0" size={28} font={11} />
            <div style={{ marginLeft: 8, lineHeight: 1.1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Игорь Котов</div>
              <div style={{ fontSize: 10.5, color: t.textSubtle }}>CEO · Cloud24</div>
            </div>
          </div>
        </div>
      )}

      {/* Left rail */}
      <SteelLeftRail t={t} active={active} />

      {/* Main */}
      <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', background: t.bg }}>
        {children}
      </div>
    </div>
  );
}

function SteelIconBtn({ t, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 30, height: 30, borderRadius: 6, border: 'none',
      background: 'transparent', color: 'inherit', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

function SteelLeftRail({ t, active }) {
  return (
    <div style={{
      background: t.surface, borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Compose button */}
      <div style={{ padding: '14px 12px 10px' }}>
        <button style={{
          width: '100%', height: 36, borderRadius: 6,
          background: t.accent, color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(45,79,224,0.3)',
        }}>
          <Icon name="plus" size={15} />
          Написать
          <span style={{
            marginLeft: 4, fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.2)',
            borderRadius: 3, fontFamily: SteelType.mono,
          }}>N</span>
        </button>
      </div>

      {/* Folders */}
      <div style={{ padding: '4px 6px', overflowY: 'auto', flex: 1 }}>
        <SteelRailSection t={t} label="Почта">
          {FOLDERS.map(f => (
            <SteelRailItem key={f.id} t={t} icon={f.icon} label={f.name} count={f.count} active={active === f.id} />
          ))}
        </SteelRailSection>

        <SteelRailSection t={t} label="Метки">
          {LABELS.map(l => (
            <SteelRailItem key={l.id} t={t} label={l.name} dot={l.color} />
          ))}
        </SteelRailSection>

        <SteelRailSection t={t} label="Командные">
          {TEAM_FOLDERS.map(tf => (
            <SteelRailItem key={tf.id} t={t} icon="users" label={tf.name} count={tf.count} subtle />
          ))}
        </SteelRailSection>

        <SteelRailSection t={t} label="Сервисы">
          <SteelRailItem t={t} icon="calendar" label="Календарь" active={active === 'calendar'} />
          <SteelRailItem t={t} icon="contacts" label="Контакты" active={active === 'contacts'} />
          <SteelRailItem t={t} icon="shield" label="Безопасность" />
          <SteelRailItem t={t} icon="settings" label="Настройки" active={active === 'settings'} />
        </SteelRailSection>
      </div>

      {/* Storage */}
      <div style={{
        padding: '10px 14px', borderTop: `1px solid ${t.border}`,
        background: t.surfaceAlt, fontSize: 11.5, color: t.textMuted,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span>Хранилище</span>
          <span style={{ fontFamily: SteelType.mono, color: t.text }}>34.2 / 100 ГБ</span>
        </div>
        <div style={{ height: 4, background: t.surfaceSunken, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '34%', height: '100%', background: t.accent }} />
        </div>
      </div>
    </div>
  );
}

function SteelRailSection({ t, label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: t.textSubtle,
        textTransform: 'uppercase', letterSpacing: 0.7,
        padding: '8px 10px 4px',
      }}>{label}</div>
      {children}
    </div>
  );
}

function SteelRailItem({ t, icon, label, count, active, dot, subtle }) {
  return (
    <div style={{
      height: 30, display: 'flex', alignItems: 'center', gap: 9,
      padding: '0 10px', borderRadius: 5, fontSize: 12.5,
      background: active ? t.selected : 'transparent',
      color: active ? t.accentText : (subtle ? t.textMuted : t.text),
      fontWeight: active ? 600 : 500, cursor: 'pointer',
    }}>
      {icon && <span style={{ color: active ? t.accent : t.textMuted, display: 'flex' }}><Icon name={icon} size={15} /></span>}
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, marginLeft: 3 }} />}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {count != null && (
        <span style={{
          fontSize: 11, fontWeight: 600, color: active ? t.accent : t.textMuted,
          fontFamily: SteelType.mono,
        }}>{count}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Inbox + Reading pane
// ─────────────────────────────────────────────────────────────────────────

function SteelInbox({ dark }) {
  const t = useSteelTokens(dark);
  const selected = MESSAGES[0];
  return (
    <SteelChrome dark={dark} active="inbox">
      <div style={{
        height: '100%', display: 'grid', gridTemplateColumns: '380px 1fr',
        background: t.surface,
      }}>
        {/* Message list */}
        <div style={{
          borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column',
          background: t.surfaceAlt,
        }}>
          {/* List header */}
          <div style={{
            height: 48, borderBottom: `1px solid ${t.border}`,
            padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>
              Входящие <span style={{ fontWeight: 500, color: t.textMuted, marginLeft: 4 }}>· 24</span>
            </div>
            <SteelChip t={t} active>Все</SteelChip>
            <SteelChip t={t}>Непрочитанные</SteelChip>
            <SteelChip t={t}>Помеченные</SteelChip>
          </div>

          {/* Sub-filter bar */}
          <div style={{
            padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: `1px solid ${t.border}`, fontSize: 11.5, color: t.textMuted,
          }}>
            <Icon name="filter" size={13} />
            <span>Сортировка: дата ↓</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success }} />
              синхронизировано
            </span>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* Today section */}
            <SteelListSection t={t} label="СЕГОДНЯ · 20 МАЯ" />
            {MESSAGES.slice(0, 4).map((m, i) => (
              <SteelListItem key={m.id} t={t} m={m} selected={i === 0} />
            ))}
            <SteelListSection t={t} label="ВЧЕРА · 19 МАЯ" />
            {MESSAGES.slice(4, 7).map(m => <SteelListItem key={m.id} t={t} m={m} />)}
            <SteelListSection t={t} label="РАНЕЕ" />
            {MESSAGES.slice(7).map(m => <SteelListItem key={m.id} t={t} m={m} />)}
          </div>
        </div>

        {/* Reading pane */}
        <SteelReadingPane t={t} m={selected} />
      </div>
    </SteelChrome>
  );
}

function SteelChip({ t, active, children }) {
  return (
    <span style={{
      fontSize: 11.5, padding: '4px 10px', borderRadius: 12,
      background: active ? t.accentBg : 'transparent',
      color: active ? t.accentText : t.textMuted,
      border: active ? `1px solid ${t.accentBorder}` : `1px solid transparent`,
      fontWeight: active ? 600 : 500, cursor: 'pointer',
    }}>{children}</span>
  );
}

function SteelListSection({ t, label }) {
  return (
    <div style={{
      padding: '10px 14px 4px', fontSize: 10, fontWeight: 600,
      color: t.textSubtle, letterSpacing: 0.8,
      background: t.surfaceAlt, position: 'sticky', top: 0, zIndex: 1,
    }}>{label}</div>
  );
}

function SteelListItem({ t, m, selected }) {
  return (
    <div style={{
      padding: '11px 14px', borderBottom: `1px solid ${t.divider}`,
      background: selected ? t.surface : 'transparent',
      borderLeft: selected ? `3px solid ${t.accent}` : `3px solid transparent`,
      cursor: 'pointer', display: 'flex', gap: 10, position: 'relative',
    }}>
      <Avatar name={m.from.initials} color={m.from.color} size={32} font={11} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 13, fontWeight: m.unread ? 700 : 500,
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{m.from.name}</span>
          {m.thread && (
            <span style={{
              fontSize: 10.5, fontFamily: SteelType.mono, color: t.textMuted,
              background: t.surfaceSunken, padding: '1px 5px', borderRadius: 3,
            }}>{m.thread}</span>
          )}
          <span style={{ fontSize: 11, color: t.textMuted, fontVariantNumeric: 'tabular-nums' }}>{m.time}</span>
        </div>
        <div style={{
          fontSize: 12.5, fontWeight: m.unread ? 600 : 500,
          color: m.unread ? t.text : t.textMuted,
          marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {m.starred && <span style={{ color: '#E0A82E', display: 'flex' }}><Icon name="star" size={12} /></span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</span>
        </div>
        <div style={{
          fontSize: 11.5, color: t.textMuted, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{m.preview}</div>
        {(m.labels?.length || m.hasAttachment) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {m.hasAttachment && <span style={{ color: t.textMuted, display: 'flex' }}><Icon name="attach" size={12} /></span>}
            {m.labels?.map(lid => {
              const lbl = LABELS.find(x => x.id === lid);
              if (!lbl) return null;
              return (
                <span key={lid} style={{
                  fontSize: 10.5, padding: '1px 7px', borderRadius: 10,
                  background: `${lbl.color}1A`, color: lbl.color, fontWeight: 600,
                }}>{lbl.name}</span>
              );
            })}
          </div>
        )}
      </div>
      {m.unread && <div style={{
        position: 'absolute', left: 4, top: 18, width: 5, height: 5, borderRadius: '50%',
        background: t.accent,
      }} />}
    </div>
  );
}

function SteelReadingPane({ t, m }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.surface }}>
      {/* Toolbar */}
      <div style={{
        height: 48, borderBottom: `1px solid ${t.border}`,
        padding: '0 18px', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <SteelToolBtn t={t} icon="reply" label="Ответить" />
        <SteelToolBtn t={t} icon="replyAll" label="Всем" />
        <SteelToolBtn t={t} icon="forward" label="Переслать" />
        <div style={{ width: 1, height: 22, background: t.border, margin: '0 6px' }} />
        <SteelToolBtn t={t} icon="archive" />
        <SteelToolBtn t={t} icon="snooze" />
        <SteelToolBtn t={t} icon="tag" />
        <SteelToolBtn t={t} icon="trash" />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: t.textMuted, fontSize: 11.5 }}>
          <span style={{ fontFamily: SteelType.mono }}>1 из 24</span>
          <SteelToolBtn t={t} icon="arrowLeft" />
          <SteelToolBtn t={t} icon="arrowRight" />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {/* Subject */}
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 14, letterSpacing: -0.2 }}>
          {m.subject}
        </div>

        {/* Labels & meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          {m.labels?.map(lid => {
            const lbl = LABELS.find(x => x.id === lid);
            return lbl && (
              <span key={lid} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: `${lbl.color}1A`, color: lbl.color, fontWeight: 600,
              }}>{lbl.name}</span>
            );
          })}
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 10,
            background: t.dangerBg, color: t.danger, fontWeight: 600,
          }}>Важное</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="lock" size={11} /> S/MIME подписано · DKIM ok
          </span>
        </div>

        {/* AI summary card */}
        <div style={{
          background: t.aiBg, border: `1px solid ${t.aiBorder}`, borderRadius: 8,
          padding: '12px 14px', marginBottom: 20,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700, color: t.aiText,
            textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
          }}>
            <Icon name="sparkle" size={13} /> AI · Краткое содержание
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12.5, lineHeight: 1.55 }}>
            {AI_SUMMARY.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: t.aiText, marginTop: 1 }}>—</span>
                <span style={{ color: t.text }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* From card */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 18, padding: '10px 12px',
          background: t.surfaceAlt, borderRadius: 8, border: `1px solid ${t.border}`,
        }}>
          <Avatar name={m.from.initials} color={m.from.color} size={40} font={14} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{m.from.name}</span>
              <span style={{ fontSize: 12, color: t.textMuted }}>&lt;{m.from.email}&gt;</span>
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
              Кому: <span style={{ color: t.text }}>я</span> · Копия: <span style={{ color: t.text }}>m.dorokhov@cloud24.ru, legal@cloud24.ru</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11.5, color: t.textMuted }}>
            <div>{m.timeFull}</div>
            <div style={{ marginTop: 2 }}>Тред из 4 сообщений</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: t.text, marginBottom: 22 }}>
          {m.body.map((p, i) => (
            <p key={i} style={{ margin: '0 0 12px' }}>{p}</p>
          ))}
        </div>

        {/* Attachments */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {m.attachments.map((a, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
              background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 6,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 5,
                background: a.type === 'pdf' ? t.dangerBg : t.accentBg,
                color: a.type === 'pdf' ? t.danger : t.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, fontFamily: SteelType.mono,
              }}>{a.type.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                <div style={{ fontSize: 11, color: t.textMuted }}>{a.size}</div>
              </div>
              <button style={{
                border: `1px solid ${t.border}`, background: t.surface, color: t.textMuted,
                fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
              }}>Открыть</button>
            </div>
          ))}
        </div>

        {/* AI quick reply */}
        <div style={{
          background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 8,
          padding: 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700, color: t.aiText,
            textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
          }}>
            <Icon name="sparkle" size={13} /> AI · Варианты ответа
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {AI_DRAFTS.map((d, i) => (
              <button key={i} style={{
                flex: 1, textAlign: 'left', padding: '10px 12px', borderRadius: 6,
                background: t.surface, border: `1px solid ${t.border}`, cursor: 'pointer',
                color: t.text,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.aiText, marginBottom: 4 }}>{d.tone}</div>
                <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.4 }}>{d.text}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SteelToolBtn({ t, icon, label }) {
  return (
    <button style={{
      height: 32, padding: label ? '0 12px 0 8px' : '0 8px',
      display: 'flex', alignItems: 'center', gap: 6,
      borderRadius: 5, background: 'transparent', border: 'none',
      color: t.text, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
    }}>
      <Icon name={icon} size={15} />
      {label && <span>{label}</span>}
    </button>
  );
}

Object.assign(window, {
  STEEL_LIGHT, STEEL_DARK, useSteelTokens, SteelType,
  SteelChrome, SteelInbox, SteelToolBtn, SteelChip,
});
