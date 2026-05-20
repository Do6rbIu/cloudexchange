// Cloud24 Exchange — shared mock data + icons used across both directions.
// Exposes everything on window so other Babel scripts can read it.

// ─────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────

const FOLDERS = [
  { id: 'inbox',   name: 'Входящие',    count: 24, icon: 'inbox' },
  { id: 'starred', name: 'Помеченные',  count: 7,  icon: 'star' },
  { id: 'sent',    name: 'Отправленные', count: null, icon: 'send' },
  { id: 'drafts',  name: 'Черновики',   count: 3,  icon: 'draft' },
  { id: 'snoozed', name: 'Отложенные',  count: 2,  icon: 'snooze' },
  { id: 'archive', name: 'Архив',       count: null, icon: 'archive' },
  { id: 'spam',    name: 'Спам',        count: 18, icon: 'spam' },
  { id: 'trash',   name: 'Корзина',     count: null, icon: 'trash' },
];

const LABELS = [
  { id: 'finance', name: 'Финансы',  color: '#2D4FE0' },
  { id: 'legal',   name: 'Юридический', color: '#7A4FE0' },
  { id: 'hr',      name: 'HR',       color: '#1F8A5B' },
  { id: 'ops',     name: 'Операционка', color: '#B5773A' },
  { id: 'exec',    name: 'Руководство', color: '#C0392B' },
];

const TEAM_FOLDERS = [
  { id: 'support@', name: 'support@cloud24.ru', count: 12, members: 6 },
  { id: 'sales@',   name: 'sales@cloud24.ru',   count: 4,  members: 3 },
  { id: 'legal@',   name: 'legal@cloud24.ru',   count: 1,  members: 2 },
];

const MESSAGES = [
  {
    id: 'm01',
    from: { name: 'Анна Соколова', email: 'a.sokolova@gazprom-tech.ru', initials: 'АС', color: '#2D4FE0' },
    to: 'me',
    subject: 'Договор на поставку оборудования — финальная редакция',
    preview: 'Игорь, добрый день. Высылаю финальную редакцию договора с правками юристов. Прошу согласовать пункты 4.2 и 7.1 до пятницы.',
    body: ['Игорь, добрый день.',
           'Высылаю финальную редакцию договора с правками от юридического департамента. Основные изменения — пункты 4.2 (сроки поставки) и 7.1 (ответственность сторон).',
           'Прошу согласовать до пятницы 14:00, чтобы успеть отправить в подписание на этой неделе. Если будут возражения, давайте созвонимся завтра в 11:00.',
           'С уважением, Анна'],
    time: '10:42',
    timeFull: 'Сегодня, 10:42',
    date: '2026-05-20',
    unread: true,
    starred: true,
    hasAttachment: true,
    attachments: [
      { name: 'Договор поставки v4.docx', size: '184 КБ', type: 'doc' },
      { name: 'Приложение №1.pdf', size: '92 КБ', type: 'pdf' },
    ],
    labels: ['legal', 'finance'],
    folder: 'inbox',
    important: true,
    thread: 4,
  },
  {
    id: 'm02',
    from: { name: 'Михаил Дорохов', email: 'm.dorokhov@cloud24.ru', initials: 'МД', color: '#1F8A5B' },
    subject: 'Re: Планёрка по Q3 — материалы',
    preview: 'Прикрепил слайды и презентацию по продукту. Жду фидбэк. Также добавил черновик отчёта по выручке за апрель.',
    time: '09:18',
    timeFull: 'Сегодня, 09:18',
    unread: true,
    starred: false,
    hasAttachment: true,
    labels: ['exec'],
    folder: 'inbox',
    thread: 8,
  },
  {
    id: 'm03',
    from: { name: 'HR Cloud24', email: 'hr@cloud24.ru', initials: 'HR', color: '#7A4FE0' },
    subject: 'Опрос вовлечённости — последний день',
    preview: 'Напоминаем, что сегодня последний день для прохождения ежеквартального опроса вовлечённости. Это займёт не более 8 минут.',
    time: '08:55',
    unread: true,
    labels: ['hr'],
    folder: 'inbox',
  },
  {
    id: 'm04',
    from: { name: 'Calendar', email: 'noreply@cloud24.ru', initials: 'CA', color: '#6B7280' },
    subject: 'Встреча: ревью Q2 с инвесторами — завтра 14:00',
    preview: 'Приглашение на встречу. 12 участников. Zoom-ссылка во вложении. Длительность: 1 час 30 минут.',
    time: '08:30',
    unread: false,
    folder: 'inbox',
  },
  {
    id: 'm05',
    from: { name: 'Елена Виноградова', email: 'e.vinogradova@sber.ru', initials: 'ЕВ', color: '#C0392B' },
    subject: 'Партнёрское предложение по интеграции',
    preview: 'Игорь, после нашей встречи на конференции хотела вернуться к обсуждению интеграции наших платежных API.',
    time: 'Вчера',
    unread: false,
    starred: true,
    labels: ['finance'],
    folder: 'inbox',
    thread: 2,
  },
  {
    id: 'm06',
    from: { name: 'Дмитрий Лазарев', email: 'd.lazarev@cloud24.ru', initials: 'ДЛ', color: '#B5773A' },
    subject: 'Отчёт по инфраструктуре — апрель',
    preview: 'Прикладываю отчёт по нагрузке на инфраструктуру за апрель. Uptime 99.97%, инцидентов — 2. Подробности внутри.',
    time: 'Вчера',
    unread: false,
    hasAttachment: true,
    labels: ['ops'],
    folder: 'inbox',
  },
  {
    id: 'm07',
    from: { name: 'Бухгалтерия', email: 'accounting@cloud24.ru', initials: 'БГ', color: '#2D4FE0' },
    subject: 'Авансовые отчёты за апрель — требуют подписи',
    preview: 'В системе документооборота вас ожидают 4 авансовых отчёта на сумму 187 420 ₽. Срок согласования — 25 мая.',
    time: 'Вчера',
    unread: false,
    labels: ['finance'],
    folder: 'inbox',
  },
  {
    id: 'm08',
    from: { name: 'Артём Кравченко', email: 'a.kravchenko@cloud24.ru', initials: 'АК', color: '#1F8A5B' },
    subject: 'Roadmap H2 — черновик',
    preview: 'Игорь, привет. Подготовил первый черновик roadmap на второе полугодие. Хочу обсудить приоритеты до пятницы.',
    time: '19 мая',
    unread: false,
    starred: false,
    folder: 'inbox',
    thread: 3,
  },
  {
    id: 'm09',
    from: { name: 'Ольга Терентьева', email: 'o.terentyeva@partner.ru', initials: 'ОТ', color: '#7A4FE0' },
    subject: 'NDA — подписан со стороны партнёра',
    preview: 'Высылаем подписанный NDA. Готовы переходить к обсуждению технических деталей на следующей неделе.',
    time: '19 мая',
    unread: false,
    hasAttachment: true,
    labels: ['legal'],
    folder: 'inbox',
  },
  {
    id: 'm10',
    from: { name: 'Security Cloud24', email: 'security@cloud24.ru', initials: 'SC', color: '#C0392B' },
    subject: 'Обязательная смена пароля — до 25 мая',
    preview: 'В соответствии с корпоративной политикой безопасности, требуется обновить пароль учётной записи.',
    time: '18 мая',
    unread: false,
    folder: 'inbox',
  },
  {
    id: 'm11',
    from: { name: 'Виктор Сёмин', email: 'v.semin@cloud24.ru', initials: 'ВС', color: '#B5773A' },
    subject: 'Бюджет на маркетинг H2 — обсуждение',
    preview: 'Подготовил предварительную раскладку по бюджету. Основные статьи — events, performance, brand.',
    time: '18 мая',
    unread: false,
    starred: false,
    folder: 'inbox',
    thread: 5,
  },
  {
    id: 'm12',
    from: { name: 'Татьяна Жукова', email: 't.zhukova@cloud24.ru', initials: 'ТЖ', color: '#2D4FE0' },
    subject: 'Кандидаты на позицию Senior PM — шортлист',
    preview: 'Прикладываю шортлист из 4 кандидатов. По всем уже собрано feedback от команды. Готова обсудить.',
    time: '17 мая',
    unread: false,
    labels: ['hr'],
    folder: 'inbox',
  },
];

const CONTACTS = [
  { name: 'Анна Соколова',     email: 'a.sokolova@gazprom-tech.ru', role: 'Head of Legal, Газпром-Tech', phone: '+7 (495) 123-45-67', initials: 'АС', color: '#2D4FE0', tags: ['Партнёр', 'Legal'] },
  { name: 'Михаил Дорохов',    email: 'm.dorokhov@cloud24.ru',      role: 'COO, Cloud24',               phone: '+7 (495) 555-01-02', initials: 'МД', color: '#1F8A5B', tags: ['Команда', 'C-level'] },
  { name: 'Елена Виноградова', email: 'e.vinogradova@sber.ru',      role: 'Director, Сбер Бизнес',      phone: '+7 (495) 500-77-77', initials: 'ЕВ', color: '#C0392B', tags: ['VIP', 'Партнёр'] },
  { name: 'Дмитрий Лазарев',   email: 'd.lazarev@cloud24.ru',       role: 'Head of Infrastructure',     phone: '+7 (495) 555-04-21', initials: 'ДЛ', color: '#B5773A', tags: ['Команда'] },
  { name: 'Артём Кравченко',   email: 'a.kravchenko@cloud24.ru',    role: 'CPO, Cloud24',               phone: '+7 (495) 555-09-10', initials: 'АК', color: '#1F8A5B', tags: ['Команда', 'C-level'] },
  { name: 'Ольга Терентьева',  email: 'o.terentyeva@partner.ru',    role: 'CFO, Partner Group',         phone: '+7 (495) 700-11-22', initials: 'ОТ', color: '#7A4FE0', tags: ['Партнёр'] },
  { name: 'Виктор Сёмин',      email: 'v.semin@cloud24.ru',         role: 'CMO, Cloud24',               phone: '+7 (495) 555-07-31', initials: 'ВС', color: '#B5773A', tags: ['Команда', 'C-level'] },
  { name: 'Татьяна Жукова',    email: 't.zhukova@cloud24.ru',       role: 'Head of People',             phone: '+7 (495) 555-08-09', initials: 'ТЖ', color: '#2D4FE0', tags: ['Команда'] },
  { name: 'Сергей Маслов',     email: 's.maslov@vtb.ru',            role: 'VP, ВТБ Корпоративный',      phone: '+7 (495) 777-00-12', initials: 'СМ', color: '#2D4FE0', tags: ['Партнёр', 'VIP'] },
  { name: 'Ирина Колесова',    email: 'i.kolesova@cloud24.ru',      role: 'General Counsel',            phone: '+7 (495) 555-02-12', initials: 'ИК', color: '#7A4FE0', tags: ['Команда', 'Legal'] },
];

// Calendar week (Mon–Fri, 20–24 May 2026)
const WEEK_DAYS = [
  { label: 'ПН', date: 18, full: '18 мая' },
  { label: 'ВТ', date: 19, full: '19 мая' },
  { label: 'СР', date: 20, full: '20 мая', today: true },
  { label: 'ЧТ', date: 21, full: '21 мая' },
  { label: 'ПТ', date: 22, full: '22 мая' },
  { label: 'СБ', date: 23, full: '23 мая', weekend: true },
  { label: 'ВС', date: 24, full: '24 мая', weekend: true },
];

const EVENTS = [
  { day: 0, start:  9, end: 10,   title: 'Daily standup',            attendees: 8,  type: 'team',    color: '#1F8A5B' },
  { day: 0, start: 11, end: 12.5, title: 'Ревью архитектуры',         attendees: 5,  type: 'review',  color: '#2D4FE0' },
  { day: 0, start: 14, end: 15,   title: '1:1 с Михаилом',            attendees: 2,  type: 'one',     color: '#6B7280' },
  { day: 0, start: 16, end: 17,   title: 'Sales pipeline',           attendees: 4,  type: 'review',  color: '#B5773A' },

  { day: 1, start:  9.5, end: 10.5, title: 'Звонок с Газпром-Tech',  attendees: 6,  type: 'external', color: '#C0392B' },
  { day: 1, start: 11, end: 12, title: 'Product sync',               attendees: 7,  type: 'team',    color: '#1F8A5B' },
  { day: 1, start: 14, end: 16, title: 'Roadmap H2',                  attendees: 9,  type: 'planning', color: '#7A4FE0' },

  { day: 2, start:  9, end: 10,   title: 'Daily standup',            attendees: 8,  type: 'team',    color: '#1F8A5B' },
  { day: 2, start: 10.5, end: 12, title: 'Ревью бюджета Q3',         attendees: 5,  type: 'review',  color: '#2D4FE0', current: true },
  { day: 2, start: 13, end: 14, title: 'Обед с инвестором',          attendees: 2,  type: 'external', color: '#C0392B' },
  { day: 2, start: 14.5, end: 16, title: 'Ревью Q2 с инвесторами',   attendees: 12, type: 'external', color: '#C0392B' },
  { day: 2, start: 16.5, end: 17.5, title: 'Дизайн-критика',         attendees: 6,  type: 'review',  color: '#B5773A' },

  { day: 3, start:  9, end: 10,   title: 'Daily standup',            attendees: 8,  type: 'team',    color: '#1F8A5B' },
  { day: 3, start: 11, end: 12.5, title: 'Юристы — договор',          attendees: 4,  type: 'review',  color: '#7A4FE0' },
  { day: 3, start: 15, end: 16.5, title: 'All-hands',                attendees: 84, type: 'team',    color: '#1F8A5B' },

  { day: 4, start: 10, end: 11, title: 'Планёрка по Q3',              attendees: 6,  type: 'team',    color: '#2D4FE0' },
  { day: 4, start: 12, end: 13, title: 'Закрытие договора',           attendees: 3,  type: 'review',  color: '#C0392B' },
  { day: 4, start: 14, end: 18, title: 'Стратегическая сессия',       attendees: 12, type: 'planning', color: '#7A4FE0' },
];

// AI assistant canned suggestions per message
const AI_SUMMARY = [
  'Прислан финальный договор. Нужно согласовать пункты 4.2 (сроки) и 7.1 (ответственность) до пятницы 14:00.',
  'Анна предлагает созвон завтра в 11:00, если будут возражения.',
];

const AI_DRAFTS = [
  { tone: 'Принять',     text: 'Анна, согласовано. Принимаем пункты 4.2 и 7.1 в текущей редакции. Готов подписать.' },
  { tone: 'Уточнить',    text: 'Анна, по пункту 7.1 — давайте обсудим завтра в 11:00. Остальное согласовано.' },
  { tone: 'Отложить',    text: 'Анна, нужно ещё раз свериться с финансами по пункту 4.2. Пришлю ответ до четверга.' },
];

// ─────────────────────────────────────────────────────────────────────────
// Icons — single-line SVG strokes, sized via currentColor
// ─────────────────────────────────────────────────────────────────────────

function Icon({ name, size = 16, stroke = 1.6, ...rest }) {
  const s = size;
  const sw = stroke;
  const base = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest };
  switch (name) {
    case 'inbox':    return <svg {...base}><path d="M3 13l3 -6h12l3 6"/><path d="M3 13v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6"/><path d="M3 13h4l1 2h8l1-2h4"/></svg>;
    case 'star':     return <svg {...base}><path d="M12 3l2.8 5.7 6.2 .9-4.5 4.4 1 6.3L12 17.8 6.5 20.3l1-6.3L3 9.6l6.2-.9z"/></svg>;
    case 'send':     return <svg {...base}><path d="M4 12l16-8-6 18-3-7z"/><path d="M11 15l3-3"/></svg>;
    case 'draft':    return <svg {...base}><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/></svg>;
    case 'snooze':   return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'archive':  return <svg {...base}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11h14V8"/><path d="M10 13h4"/></svg>;
    case 'spam':     return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><circle cx="12" cy="16.5" r=".8" fill="currentColor"/></svg>;
    case 'trash':    return <svg {...base}><path d="M4 7h16"/><path d="M10 4h4l1 3h-6z"/><path d="M6 7l1 13h10l1-13"/></svg>;

    case 'search':   return <svg {...base}><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>;
    case 'calendar': return <svg {...base}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'contacts': return <svg {...base}><circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.7-3.2 3-5 5.5-5s4.8 1.8 5.5 5"/><circle cx="17" cy="8" r="2.4"/><path d="M15 14c2-1 4.5-.5 5.5 2"/></svg>;
    case 'settings': return <svg {...base}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.2 2.2M17.6 17.6l2.2 2.2M2 12h3M19 12h3M4.2 19.8l2.2-2.2M17.6 6.4l2.2-2.2"/></svg>;
    case 'tag':      return <svg {...base}><path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.4"/></svg>;
    case 'attach':   return <svg {...base}><path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/></svg>;
    case 'reply':    return <svg {...base}><path d="M9 7L4 12l5 5"/><path d="M4 12h9a6 6 0 0 1 6 6v2"/></svg>;
    case 'replyAll': return <svg {...base}><path d="M7 7l-5 5 5 5"/><path d="M11 7L6 12l5 5"/><path d="M6 12h9a6 6 0 0 1 6 6v2"/></svg>;
    case 'forward':  return <svg {...base}><path d="M15 7l5 5-5 5"/><path d="M20 12h-9a6 6 0 0 0-6 6v2"/></svg>;
    case 'more':     return <svg {...base}><circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/></svg>;
    case 'filter':   return <svg {...base}><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>;
    case 'plus':     return <svg {...base}><path d="M12 5v14M5 12h14"/></svg>;
    case 'check':    return <svg {...base}><path d="M4 12l5 5L20 6"/></svg>;
    case 'arrowRight': return <svg {...base}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrowLeft':  return <svg {...base}><path d="M19 12H5M11 6L5 12l6 6"/></svg>;
    case 'down':     return <svg {...base}><path d="M6 9l6 6 6-6"/></svg>;
    case 'sparkle':  return <svg {...base}><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/><path d="M18 3l.7 1.7L20 5.5l-1.3.7L18 8l-.7-1.8L16 5.5l1.3-.6z"/></svg>;
    case 'bell':     return <svg {...base}><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'lock':     return <svg {...base}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case 'shield':   return <svg {...base}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'users':    return <svg {...base}><circle cx="9" cy="9" r="3"/><path d="M3 19c.7-3 3-5 6-5s5.3 2 6 5"/><circle cx="17" cy="8" r="2.4"/><path d="M15 13c2.2-.5 4.4.5 5.5 3"/></svg>;
    case 'globe':    return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></svg>;
    case 'logo':     return <svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <path d="M6 14a5 5 0 1 1 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="9" y="9" width="11" height="11" rx="2.5" fill="currentColor"/>
      <path d="M12.5 14.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 32, font = 12, square = false }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: square ? 6 : '50%',
      background: color,
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: font, letterSpacing: 0.2,
      flex: '0 0 auto',
    }}>{name}</div>
  );
}

Object.assign(window, {
  FOLDERS, LABELS, TEAM_FOLDERS, MESSAGES, CONTACTS, WEEK_DAYS, EVENTS,
  AI_SUMMARY, AI_DRAFTS,
  Icon, Avatar,
});
