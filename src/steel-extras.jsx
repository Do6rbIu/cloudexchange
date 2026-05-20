// Cloud24 Exchange — Direction A "Steel" — Search + Settings

// ─────────────────────────────────────────────────────────────────────────
// Search / Filters
// ─────────────────────────────────────────────────────────────────────────

function SteelSearch({ dark }) {
  const t = useSteelTokens(dark);
  return (
    <SteelChrome dark={dark} active="inbox">
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '300px 1fr', background: t.surface }}>
        {/* Filters sidebar */}
        <div style={{ borderRight: `1px solid ${t.border}`, overflow: 'auto', padding: 18, background: t.surfaceAlt }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Уточнить поиск</div>

          <FilterGroup t={t} title="Период">
            <FilterRadio t={t} checked>Любой</FilterRadio>
            <FilterRadio t={t}>Сегодня</FilterRadio>
            <FilterRadio t={t}>Эта неделя</FilterRadio>
            <FilterRadio t={t}>Последние 30 дней</FilterRadio>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 11 }}>
              <input placeholder="с" style={{ flex: 1, padding: '5px 8px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 11, fontFamily: SteelType.mono }} />
              <input placeholder="по" style={{ flex: 1, padding: '5px 8px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 11, fontFamily: SteelType.mono }} />
            </div>
          </FilterGroup>

          <FilterGroup t={t} title="От">
            <FilterCheck t={t} checked>Анна Соколова <span style={{ color: t.textMuted }}>14</span></FilterCheck>
            <FilterCheck t={t}>Михаил Дорохов <span style={{ color: t.textMuted }}>8</span></FilterCheck>
            <FilterCheck t={t}>Елена Виноградова <span style={{ color: t.textMuted }}>5</span></FilterCheck>
            <FilterCheck t={t}>Дмитрий Лазарев <span style={{ color: t.textMuted }}>4</span></FilterCheck>
            <button style={{ fontSize: 11, color: t.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>Показать ещё 28...</button>
          </FilterGroup>

          <FilterGroup t={t} title="Метки">
            {LABELS.map(l => (
              <FilterCheck key={l.id} t={t} checked={l.id === 'legal'}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} /> {l.name}
                </span>
              </FilterCheck>
            ))}
          </FilterGroup>

          <FilterGroup t={t} title="Папки">
            <FilterCheck t={t} checked>Входящие</FilterCheck>
            <FilterCheck t={t}>Отправленные</FilterCheck>
            <FilterCheck t={t}>Архив</FilterCheck>
            <FilterCheck t={t}>support@cloud24.ru</FilterCheck>
          </FilterGroup>

          <FilterGroup t={t} title="Признаки">
            <FilterCheck t={t} checked>С вложениями</FilterCheck>
            <FilterCheck t={t}>Помеченные</FilterCheck>
            <FilterCheck t={t}>Непрочитанные</FilterCheck>
            <FilterCheck t={t}>С приглашениями на встречу</FilterCheck>
            <FilterCheck t={t}>Подписанные S/MIME</FilterCheck>
          </FilterGroup>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search bar with active filters */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 6,
              fontSize: 13,
            }}>
              <Icon name="search" size={15} color={t.textMuted} />
              <FilterToken t={t}>от: <b>а.соколова</b></FilterToken>
              <FilterToken t={t}>метка: <b>Legal</b></FilterToken>
              <FilterToken t={t}>есть: <b>вложения</b></FilterToken>
              <input defaultValue="договор поставки" style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, color: t.text, fontFamily: SteelType.mono,
              }} />
              <span style={{ fontSize: 11, color: t.textMuted }}>14 результатов · 32 мс</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11.5, color: t.textMuted }}>
              <span>Сортировка:</span>
              <span style={{ color: t.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>По релевантности <Icon name="down" size={12} /></span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: 'pointer' }}>Сохранить поиск</button>
                <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: 'pointer' }}>Создать правило</button>
              </span>
            </div>
          </div>

          {/* AI search summary */}
          <div style={{
            margin: 18, marginBottom: 0,
            padding: '14px 16px',
            background: t.aiBg, border: `1px solid ${t.aiBorder}`, borderRadius: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: t.aiText, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              <Icon name="sparkle" size={13} /> AI ответ
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: t.text }}>
              По «договор поставки» от Анны Соколовой найдено <b>14 писем</b> за период март–май 2026.
              Финальная редакция отправлена сегодня в 10:42. Требуется согласование пунктов <b>4.2 и 7.1</b> до пятницы.
              Связанные документы: <span style={{ color: t.accent, fontFamily: SteelType.mono }}>Договор поставки v4.docx</span>,
              <span style={{ color: t.accent, fontFamily: SteelType.mono }}> Приложение №1.pdf</span>.
            </div>
          </div>

          {/* Results list */}
          <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
            {[
              { ...MESSAGES[0], score: 98, highlight: 'договор на <b>поставку</b> оборудования' },
              { ...MESSAGES[5], from: { ...MESSAGES[5].from, name: 'Анна Соколова', initials: 'АС', color: '#2D4FE0' }, subject: 'Re: Договор поставки v3 — комментарии юристов', score: 92 },
              { ...MESSAGES[8], from: { ...MESSAGES[8].from, name: 'Анна Соколова', initials: 'АС', color: '#2D4FE0' }, subject: 'NDA по договору поставки — подписан', score: 85 },
            ].map((m, i) => (
              <div key={i} style={{
                padding: '14px 16px', marginBottom: 8, borderRadius: 8,
                border: `1px solid ${t.border}`, background: t.surface,
                display: 'flex', gap: 12,
              }}>
                <Avatar name={m.from.initials} color={m.from.color} size={34} font={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{m.from.name}</span>
                    <span style={{ fontSize: 11, color: t.textMuted }}>· {m.from.email}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: t.textMuted }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: m.subject.replace(/договор|поставк[аи]/gi, x => `<mark style="background:${t.accentBg};color:${t.accent};padding:0 2px;border-radius:2px;font-weight:700">${x}</mark>`) }} />
                  <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5, marginBottom: 6 }}>{m.preview}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {m.labels?.map(lid => {
                      const lbl = LABELS.find(x => x.id === lid);
                      return lbl && <span key={lid} style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 10, background: `${lbl.color}1A`, color: lbl.color, fontWeight: 600 }}>{lbl.name}</span>;
                    })}
                    {m.hasAttachment && <span style={{ fontSize: 10.5, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="attach" size={11} /> 2 файла</span>}
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: SteelType.mono, color: t.aiText, fontWeight: 700 }}>relevance: {m.score}%</span>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ fontSize: 11, color: t.textSubtle, textAlign: 'center', padding: '20px 0 4px', letterSpacing: 0.5 }}>
              ── ещё 11 результатов ──
            </div>
          </div>
        </div>
      </div>
    </SteelChrome>
  );
}

function FilterGroup({ t, title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <Icon name="down" size={11} color={t.textSubtle} />
      </div>
      <div>{children}</div>
    </div>
  );
}

function FilterCheck({ t, checked, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: t.text }}>
      <span style={{
        width: 14, height: 14, borderRadius: 3,
        background: checked ? t.accent : t.surface,
        border: `1.5px solid ${checked ? t.accent : t.borderStrong}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        flex: '0 0 auto',
      }}>{checked && <Icon name="check" size={9} stroke={3} />}</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

function FilterRadio({ t, checked, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: t.text }}>
      <span style={{
        width: 14, height: 14, borderRadius: '50%',
        border: `1.5px solid ${checked ? t.accent : t.borderStrong}`,
        background: t.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
      }}>{checked && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }} />}</span>
      <span>{children}</span>
    </div>
  );
}

function FilterToken({ t, children }) {
  return (
    <span style={{
      fontSize: 11.5, padding: '3px 8px', borderRadius: 4,
      background: t.accentBg, color: t.accentText, fontFamily: SteelType.mono,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>{children} <span style={{ opacity: 0.6, cursor: 'pointer' }}>×</span></span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────

function SteelSettings({ dark }) {
  const t = useSteelTokens(dark);
  return (
    <SteelChrome dark={dark} active="settings">
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '260px 1fr', background: t.surface }}>
        {/* Settings nav */}
        <div style={{ borderRight: `1px solid ${t.border}`, padding: 18, background: t.surfaceAlt, overflow: 'auto' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Настройки</div>
          <SetNavGroup t={t} title="Аккаунт">
            <SetNavItem t={t}>Профиль</SetNavItem>
            <SetNavItem t={t}>Подпись</SetNavItem>
            <SetNavItem t={t}>Псевдонимы</SetNavItem>
            <SetNavItem t={t}>Отпуска и автоответ</SetNavItem>
          </SetNavGroup>
          <SetNavGroup t={t} title="Почта">
            <SetNavItem t={t} active>Уведомления и звуки</SetNavItem>
            <SetNavItem t={t}>Правила и фильтры</SetNavItem>
            <SetNavItem t={t}>Метки</SetNavItem>
            <SetNavItem t={t}>Snooze и напоминания</SetNavItem>
            <SetNavItem t={t}>AI-ассистент</SetNavItem>
          </SetNavGroup>
          <SetNavGroup t={t} title="Безопасность">
            <SetNavItem t={t}>Пароль и MFA</SetNavItem>
            <SetNavItem t={t}>S/MIME и GOST</SetNavItem>
            <SetNavItem t={t}>Доверенные устройства</SetNavItem>
            <SetNavItem t={t}>Журнал входов</SetNavItem>
          </SetNavGroup>
          <SetNavGroup t={t} title="Организация">
            <SetNavItem t={t}>Каталог</SetNavItem>
            <SetNavItem t={t}>Командные ящики</SetNavItem>
            <SetNavItem t={t}>SSO и интеграции</SetNavItem>
            <SetNavItem t={t}>Биллинг и лицензии</SetNavItem>
          </SetNavGroup>
        </div>

        {/* Settings content */}
        <div style={{ overflow: 'auto', padding: '32px 40px' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 11.5, color: t.textMuted, marginBottom: 6 }}>
            Почта · <span style={{ color: t.text }}>Уведомления и звуки</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, marginBottom: 4 }}>Уведомления и звуки</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 24 }}>
            Настройте, какие письма требуют вашего внимания, и как Cloud24 их доставляет.
          </div>

          <SettingsSection t={t} title="Канал доставки" desc="Где и как вы получаете уведомления">
            <SettingsRow t={t} label="Push в браузере" desc="Уведомления в фоне, когда Cloud24 открыт">
              <Toggle t={t} on />
            </SettingsRow>
            <SettingsRow t={t} label="Десктоп-приложение" desc="Cloud24 Desktop для macOS, Windows, Linux">
              <Toggle t={t} on />
            </SettingsRow>
            <SettingsRow t={t} label="Мобильные push" desc="iOS и Android">
              <Toggle t={t} on />
            </SettingsRow>
            <SettingsRow t={t} label="Звук при новом письме" desc="Только для писем с высоким приоритетом">
              <Toggle t={t} />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection t={t} title="Что считать важным" desc="Cloud24 умеет фильтровать, что показывать сразу, а что — пакетно">
            <SettingsRow t={t} label="Режим важности" desc="Только письма от ваших коллег, партнёров и VIP">
              <Segment t={t} options={['Все', 'Важные', 'Только VIP']} active={1} />
            </SettingsRow>
            <SettingsRow t={t} label="Тишина в нерабочее время" desc="С 19:00 до 09:00 и в выходные — только VIP">
              <Toggle t={t} on />
            </SettingsRow>
            <SettingsRow t={t} label="Группировать рассылки" desc="Доставка по расписанию: 10:00, 14:00, 17:00">
              <Toggle t={t} on />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection t={t} title="AI-ассистент" desc="Cloud24 AI работает в защищённой среде вашей организации">
            <div style={{
              padding: '14px 16px', background: t.aiBg, border: `1px solid ${t.aiBorder}`,
              borderRadius: 8, marginBottom: 14, fontSize: 12.5, color: t.text, lineHeight: 1.5,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <Icon name="shield" size={16} color={t.aiText} />
              <div>
                <b style={{ color: t.aiText }}>On-prem развёртывание.</b> AI обрабатывает письма на серверах Cloud24,
                данные не покидают периметр организации. Сертифицирован по ФСТЭК уровень 4.
              </div>
            </div>
            <SettingsRow t={t} label="Краткое содержание писем" desc="Авто-саммари для длинных тредов">
              <Toggle t={t} on />
            </SettingsRow>
            <SettingsRow t={t} label="Предложения ответов" desc="Три варианта ответа при открытии письма">
              <Toggle t={t} on />
            </SettingsRow>
            <SettingsRow t={t} label="Smart compose" desc="Автодополнение в редакторе">
              <Toggle t={t} on />
            </SettingsRow>
            <SettingsRow t={t} label="Поиск на естественном языке" desc="«покажи письма от Анны с договорами за май»">
              <Toggle t={t} on />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection t={t} title="Внешний вид" desc="Тема, плотность, размер шрифта">
            <SettingsRow t={t} label="Тема оформления">
              <ThemePreview t={t} />
            </SettingsRow>
            <SettingsRow t={t} label="Плотность списка">
              <Segment t={t} options={['Компактно', 'Стандартно', 'Просторно']} active={1} />
            </SettingsRow>
          </SettingsSection>
        </div>
      </div>
    </SteelChrome>
  );
}

function SetNavGroup({ t, title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.textSubtle, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4, padding: '0 8px' }}>{title}</div>
      {children}
    </div>
  );
}

function SetNavItem({ t, active, children }) {
  return (
    <div style={{
      padding: '6px 10px', borderRadius: 5, fontSize: 12.5,
      background: active ? t.selected : 'transparent',
      color: active ? t.accentText : t.text,
      fontWeight: active ? 600 : 500, cursor: 'pointer',
      borderLeft: active ? `2px solid ${t.accent}` : `2px solid transparent`,
    }}>{children}</div>
  );
}

function SettingsSection({ t, title, desc, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ paddingBottom: 12, marginBottom: 8, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: t.textMuted }}>{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsRow({ t, label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0', borderBottom: `1px solid ${t.divider}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ flex: '0 0 auto' }}>{children}</div>
    </div>
  );
}

function Toggle({ t, on }) {
  return (
    <span style={{
      display: 'inline-flex', width: 36, height: 20, borderRadius: 10,
      background: on ? t.accent : t.borderStrong, padding: 2, transition: 'background .15s',
      cursor: 'pointer', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start',
    }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </span>
  );
}

function Segment({ t, options, active }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${t.border}`, borderRadius: 5, background: t.surfaceSunken, padding: 2 }}>
      {options.map((o, i) => (
        <span key={i} style={{
          padding: '4px 12px', fontSize: 11.5, fontWeight: i === active ? 600 : 500,
          background: i === active ? t.surface : 'transparent',
          color: i === active ? t.accentText : t.textMuted,
          borderRadius: 4, cursor: 'pointer',
          boxShadow: i === active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
        }}>{o}</span>
      ))}
    </div>
  );
}

function ThemePreview({ t }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <ThemeCard t={t} dark={false} label="Светлая" />
      <ThemeCard t={t} dark={true} label="Тёмная" active />
      <ThemeCard t={t} system label="Системная" />
    </div>
  );
}

function ThemeCard({ t, dark, system, label, active }) {
  const bg = system ? 'linear-gradient(135deg, #fff 50%, #131822 50%)' : (dark ? '#131822' : '#FFFFFF');
  return (
    <div style={{
      width: 92, padding: 6, borderRadius: 6,
      border: active ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
      cursor: 'pointer', background: t.surface,
    }}>
      <div style={{ height: 50, borderRadius: 4, background: bg, border: `1px solid ${t.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 6, top: 6, width: 14, height: 4, borderRadius: 2, background: '#2D4FE0' }} />
        <div style={{ position: 'absolute', left: 6, top: 14, right: 6, height: 3, borderRadius: 2, background: dark ? '#2E3645' : '#E5E7EB' }} />
        <div style={{ position: 'absolute', left: 6, top: 20, right: 16, height: 3, borderRadius: 2, background: dark ? '#2E3645' : '#E5E7EB' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', marginTop: 5, color: active ? t.accentText : t.text }}>{label}</div>
    </div>
  );
}

Object.assign(window, { SteelSearch, SteelSettings });
