// Cloud24 Exchange — main app (Direction A · Steel only).

const Cloud24Defaults = /*EDITMODE-BEGIN*/{
  "steelTheme": "light"
}/*EDITMODE-END*/;

function Cloud24App() {
  const [t, setTweak] = useTweaks(Cloud24Defaults);
  const dark = t.steelTheme === 'dark';

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="intro"
          title="Cloud24 Exchange"
          subtitle="Корпоративная почта · трёхколоночный корпоративный лейаут · светлая и тёмная темы"
        >
          <DCArtboard id="brief" label="Бриф · направление" width={840} height={420}>
            <BriefCard />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="steel"
          title="Экраны"
          subtitle="Inbox · Composer · Календарь · Контакты · Поиск · Настройки"
        >
          <DCArtboard id="steel-inbox" label="01 · Inbox + чтение письма" width={1440} height={900}>
            <SteelInbox dark={dark} />
          </DCArtboard>
          <DCArtboard id="steel-composer" label="02 · Composer · AI-черновик" width={1200} height={820}>
            <SteelComposer dark={dark} />
          </DCArtboard>
          <DCArtboard id="steel-calendar" label="03 · Календарь · неделя" width={1440} height={900}>
            <SteelCalendar dark={dark} />
          </DCArtboard>
          <DCArtboard id="steel-contacts" label="04 · Контакты" width={1440} height={900}>
            <SteelContacts dark={dark} />
          </DCArtboard>
          <DCArtboard id="steel-search" label="05 · Поиск и фильтры" width={1440} height={900}>
            <SteelSearch dark={dark} />
          </DCArtboard>
          <DCArtboard id="steel-settings" label="06 · Настройки" width={1440} height={900}>
            <SteelSettings dark={dark} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel>
        <TweakSection label="Тема оформления" />
        <TweakRadio
          label="Тема"
          value={t.steelTheme}
          options={[
            { value: 'light', label: 'Светлая' },
            { value: 'dark',  label: 'Тёмная' },
          ]}
          onChange={(v) => setTweak('steelTheme', v)}
        />
      </TweaksPanel>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Intro card
// ─────────────────────────────────────────────────────────────────────────

function BriefCard() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#FBFAF6',
      padding: '40px 44px',
      fontFamily: 'Inter, sans-serif',
      color: '#1A1814', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ color: '#2D4FE0' }}><Icon name="logo" size={26} /></div>
        <div style={{ fontSize: 11, color: '#6B6557', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Cloud24 Exchange · веб-дизайн MVP</div>
      </div>
      <h1 style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.2 }}>
        Корпоративная почта,<br/>усиленная AI-ассистентом
      </h1>
      <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3A3429', margin: 0, maxWidth: 680 }}>
        Альтернатива Exchange для B2B: трёхколоночный плотный лейаут с привычным функционалом — почта,
        календарь, контакты, поиск, настройки — и встроенным AI, работающим в защищённом контуре организации.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 6 }}>
        <BriefStat label="Экранов" value="6" />
        <BriefStat label="Тем" value="2" />
        <BriefStat label="Лейаут" value="3 колонки" />
      </div>
      <div style={{ fontSize: 11.5, color: '#6B6557', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F8A5B' }} />
        Tweaks-панель справа внизу переключает светлую и тёмную темы
      </div>
    </div>
  );
}

function BriefStat({ label, value }) {
  return (
    <div style={{ padding: '12px 14px', background: '#F0EBE0', borderRadius: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: '#6B6557', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1814', letterSpacing: -0.3 }}>{value}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Cloud24App />);
