// Demo data extracted from the original Cloud24 Exchange design canvas
// (src/shared.jsx). The data is intentionally Russian-flavored to match
// the corporate-mail UX shown in the mockups.

export interface DemoMessage {
  fromName: string;
  fromAddress: string;
  subject: string;
  body: string[];
  dayOffset: number; // days before today; 0 = today
  hour: number;
  minute: number;
  unread: boolean;
  flagged?: boolean;
  attachments?: Array<{ filename: string; content: string }>;
  labels?: string[];
}

export interface DemoContact {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  title: string;
  notes: string;
}

export interface DemoEvent {
  // weekday: 0=Mon, 4=Fri (Mon–Fri working week)
  weekday: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  title: string;
  description: string;
  location?: string;
  attendees?: string[];
}

export const DEMO_USER = {
  email: 'igor.petrov@cloudexchange.local',
  password: 'cloud24demo',
  displayName: 'Игорь Петров',
} as const;

export const MESSAGES: DemoMessage[] = [
  {
    fromName: 'Анна Соколова',
    fromAddress: 'a.sokolova@gazprom-tech.ru',
    subject: 'Договор на поставку оборудования — финальная редакция',
    dayOffset: 0,
    hour: 10,
    minute: 42,
    unread: true,
    flagged: true,
    labels: ['legal', 'finance'],
    body: [
      'Игорь, добрый день.',
      '',
      'Высылаю финальную редакцию договора с правками от юридического департамента. Основные изменения — пункты 4.2 (сроки поставки) и 7.1 (ответственность сторон).',
      '',
      'Прошу согласовать до пятницы 14:00, чтобы успеть отправить в подписание на этой неделе. Если будут возражения, давайте созвонимся завтра в 11:00.',
      '',
      'С уважением,',
      'Анна Соколова',
      'Head of Legal · Газпром-Tech',
    ],
    attachments: [
      {
        filename: 'Договор-поставки-v4.txt',
        content:
          'ДОГОВОР ПОСТАВКИ № CX-2026/04-117\n\nг. Москва                                       20 мая 2026 г.\n\n1. ПРЕДМЕТ ДОГОВОРА\n   Поставщик обязуется передать в собственность Покупателя\n   оборудование согласно Приложению №1.\n\n2. ЦЕНА И ПОРЯДОК РАСЧЁТОВ\n   2.1. Общая стоимость составляет 24 800 000 ₽.\n   2.2. Оплата осуществляется в три транша.\n\n4. СРОКИ ПОСТАВКИ\n   4.2. Поставка осуществляется в течение 45 (сорока пяти)\n        рабочих дней с момента подписания.\n\n7. ОТВЕТСТВЕННОСТЬ СТОРОН\n   7.1. За нарушение сроков поставки Поставщик уплачивает\n        пеню в размере 0,05% от суммы Договора за каждый день\n        просрочки, но не более 10% от общей суммы.\n',
      },
    ],
  },
  {
    fromName: 'Михаил Дорохов',
    fromAddress: 'm.dorokhov@cloud24.ru',
    subject: 'Re: Планёрка по Q3 — материалы',
    dayOffset: 0,
    hour: 9,
    minute: 18,
    unread: true,
    body: [
      'Игорь, привет.',
      '',
      'Прикрепил слайды и презентацию по продукту — это финальная версия после правок продуктовой команды. Также добавил черновик отчёта по выручке за апрель — там виден провал по B2C-сегменту, нужно обсудить на планёрке.',
      '',
      'Жду фидбэк до завтра.',
      '',
      'Михаил',
    ],
  },
  {
    fromName: 'HR Cloud24',
    fromAddress: 'hr@cloud24.ru',
    subject: 'Опрос вовлечённости — последний день',
    dayOffset: 0,
    hour: 8,
    minute: 55,
    unread: true,
    labels: ['hr'],
    body: [
      'Коллеги,',
      '',
      'Напоминаем, что сегодня — последний день для прохождения ежеквартального опроса вовлечённости. Это займёт не более 8 минут и поможет нам улучшить процессы внутри команды.',
      '',
      'Все ответы анонимны.',
      '',
      'С уважением,',
      'HR Cloud24',
    ],
  },
  {
    fromName: 'Календарь Cloud24',
    fromAddress: 'noreply@cloud24.ru',
    subject: 'Встреча: ревью Q2 с инвесторами — завтра 14:30',
    dayOffset: 0,
    hour: 8,
    minute: 30,
    unread: false,
    body: [
      'Напоминаем о предстоящей встрече.',
      '',
      'Тема:        Ревью Q2 с инвесторами',
      'Когда:       Завтра, 14:30 — 16:00',
      'Где:         Zoom (ссылка во вложении)',
      'Участников:  12',
      '',
      'Подключитесь за 5 минут до начала.',
    ],
  },
  {
    fromName: 'Елена Виноградова',
    fromAddress: 'e.vinogradova@sber.ru',
    subject: 'Партнёрское предложение по интеграции',
    dayOffset: 1,
    hour: 17,
    minute: 24,
    unread: false,
    flagged: true,
    labels: ['finance'],
    body: [
      'Игорь, добрый день.',
      '',
      'После нашей встречи на конференции хотела вернуться к обсуждению интеграции наших платёжных API в ваш продукт. Подготовила предварительные коммерческие условия — давайте организуем звонок на следующей неделе.',
      '',
      'Со стороны Сбера готовы выделить отдельную команду на пилот.',
      '',
      'С уважением,',
      'Елена Виноградова',
      'Director · Сбер Бизнес',
    ],
  },
  {
    fromName: 'Дмитрий Лазарев',
    fromAddress: 'd.lazarev@cloud24.ru',
    subject: 'Отчёт по инфраструктуре — апрель',
    dayOffset: 1,
    hour: 15,
    minute: 12,
    unread: false,
    labels: ['ops'],
    body: [
      'Игорь,',
      '',
      'Прикладываю отчёт по нагрузке на инфраструктуру за апрель.',
      '',
      '  • Uptime:         99.97%',
      '  • SLO нарушений:  2 (оба укладываются в error budget)',
      '  • Пиковая нагрузка: +18% к марту',
      '  • Стоимость:      1.42M ₽ (-3% к плану)',
      '',
      'Подробности и рекомендации по оптимизации — внутри.',
      '',
      'Дмитрий',
    ],
    attachments: [
      {
        filename: 'infra-april-2026.txt',
        content:
          'Cloud24 · Infrastructure Report · April 2026\n=============================================\n\nUptime по сервисам:\n  - mail.cloud24.ru        99.99%\n  - app.cloud24.ru         99.95%\n  - api.cloud24.ru         99.97%\n\nИнциденты:\n  2026-04-08  P2  Деградация ответа API ~7 мин\n  2026-04-22  P3  Превышение error budget на /search\n\nРекомендации:\n  1. Перевести /search на отдельный пул узлов\n  2. Увеличить лимит соединений к Postgres-primary\n',
      },
    ],
  },
  {
    fromName: 'Бухгалтерия',
    fromAddress: 'accounting@cloud24.ru',
    subject: 'Авансовые отчёты за апрель — требуют подписи',
    dayOffset: 1,
    hour: 12,
    minute: 8,
    unread: false,
    labels: ['finance'],
    body: [
      'Уважаемый Игорь!',
      '',
      'В системе документооборота вас ожидают 4 авансовых отчёта на общую сумму 187 420 ₽.',
      '',
      'Срок согласования — 25 мая. После этого срока отчёты автоматически возвращаются исполнителям.',
      '',
      'С уважением,',
      'Бухгалтерия Cloud24',
    ],
  },
  {
    fromName: 'Артём Кравченко',
    fromAddress: 'a.kravchenko@cloud24.ru',
    subject: 'Roadmap H2 — черновик',
    dayOffset: 2,
    hour: 16,
    minute: 40,
    unread: false,
    body: [
      'Игорь, привет.',
      '',
      'Подготовил первый черновик roadmap на второе полугодие. Хочу обсудить приоритеты до пятницы — у нас 6 кандидатов на флагманскую инициативу, нужно выбрать 2-3.',
      '',
      'Основные кандидаты:',
      '  1. Запуск self-serve тарифа',
      '  2. Интеграция с госуслугами',
      '  3. Mobile-приложение для админов',
      '  4. AI-копилот в почте (внутренний)',
      '  5. SSO для enterprise-клиентов',
      '  6. Маркетплейс расширений',
      '',
      'Готов встретиться когда удобно.',
      '',
      'Артём',
    ],
  },
  {
    fromName: 'Ольга Терентьева',
    fromAddress: 'o.terentyeva@partner.ru',
    subject: 'NDA — подписан со стороны партнёра',
    dayOffset: 2,
    hour: 11,
    minute: 30,
    unread: false,
    labels: ['legal'],
    body: [
      'Игорь, добрый день.',
      '',
      'Высылаем подписанный NDA. Готовы переходить к обсуждению технических деталей на следующей неделе.',
      '',
      'Со своей стороны выделим CTO и Head of Product. Когда удобно — назначим встречу?',
      '',
      'С уважением,',
      'Ольга Терентьева',
      'CFO · Partner Group',
    ],
  },
  {
    fromName: 'Security Cloud24',
    fromAddress: 'security@cloud24.ru',
    subject: 'Обязательная смена пароля — до 25 мая',
    dayOffset: 3,
    hour: 9,
    minute: 0,
    unread: false,
    body: [
      'Уважаемый пользователь,',
      '',
      'В соответствии с корпоративной политикой безопасности, требуется обновить пароль учётной записи igor.petrov@cloud24.ru до 25 мая 2026 г.',
      '',
      'Требования к паролю:',
      '  • минимум 14 символов',
      '  • заглавные и строчные буквы',
      '  • цифры и спецсимволы',
      '  • не совпадает с последними 12 паролями',
      '',
      'Сменить пароль можно по ссылке в личном кабинете.',
      '',
      'Служба безопасности Cloud24',
    ],
  },
  {
    fromName: 'Виктор Сёмин',
    fromAddress: 'v.semin@cloud24.ru',
    subject: 'Бюджет на маркетинг H2 — обсуждение',
    dayOffset: 3,
    hour: 14,
    minute: 22,
    unread: false,
    body: [
      'Игорь,',
      '',
      'Подготовил предварительную раскладку по бюджету на H2. Основные статьи — events (35%), performance (40%), brand (25%). Общий объём — 48M ₽.',
      '',
      'Хотел бы обсудить до конца недели, чтобы успеть финализировать до планёрки по Q3.',
      '',
      'Виктор',
    ],
  },
  {
    fromName: 'Татьяна Жукова',
    fromAddress: 't.zhukova@cloud24.ru',
    subject: 'Кандидаты на позицию Senior PM — шортлист',
    dayOffset: 4,
    hour: 11,
    minute: 47,
    unread: false,
    labels: ['hr'],
    body: [
      'Игорь, привет.',
      '',
      'Прикладываю шортлист из 4 кандидатов на позицию Senior PM. По всем уже собрано feedback от команды и есть результаты тестового задания.',
      '',
      'Все четверо — сильные кандидаты. Готова обсудить и помочь с финальным выбором.',
      '',
      'Татьяна',
    ],
  },
];

export const CONTACTS: DemoContact[] = [
  {
    fullName: 'Анна Соколова',
    email: 'a.sokolova@gazprom-tech.ru',
    phone: '+7 (495) 123-45-67',
    organization: 'Газпром-Tech',
    title: 'Head of Legal',
    notes: 'Партнёр · Legal. Ведёт договор поставки оборудования.',
  },
  {
    fullName: 'Михаил Дорохов',
    email: 'm.dorokhov@cloud24.ru',
    phone: '+7 (495) 555-01-02',
    organization: 'Cloud24',
    title: 'COO',
    notes: 'Команда · C-level. Прямой 1:1 — четверг 14:00.',
  },
  {
    fullName: 'Елена Виноградова',
    email: 'e.vinogradova@sber.ru',
    phone: '+7 (495) 500-77-77',
    organization: 'Сбер Бизнес',
    title: 'Director',
    notes: 'VIP · Партнёр. Обсуждение интеграции платёжных API.',
  },
  {
    fullName: 'Дмитрий Лазарев',
    email: 'd.lazarev@cloud24.ru',
    phone: '+7 (495) 555-04-21',
    organization: 'Cloud24',
    title: 'Head of Infrastructure',
    notes: 'Команда. Отвечает за продакшен-инфраструктуру.',
  },
  {
    fullName: 'Артём Кравченко',
    email: 'a.kravchenko@cloud24.ru',
    phone: '+7 (495) 555-09-10',
    organization: 'Cloud24',
    title: 'CPO',
    notes: 'Команда · C-level. Roadmap H2.',
  },
  {
    fullName: 'Ольга Терентьева',
    email: 'o.terentyeva@partner.ru',
    phone: '+7 (495) 700-11-22',
    organization: 'Partner Group',
    title: 'CFO',
    notes: 'Партнёр. NDA подписан, переходим к техническим деталям.',
  },
  {
    fullName: 'Виктор Сёмин',
    email: 'v.semin@cloud24.ru',
    phone: '+7 (495) 555-07-31',
    organization: 'Cloud24',
    title: 'CMO',
    notes: 'Команда · C-level. Бюджет на маркетинг H2.',
  },
  {
    fullName: 'Татьяна Жукова',
    email: 't.zhukova@cloud24.ru',
    phone: '+7 (495) 555-08-09',
    organization: 'Cloud24',
    title: 'Head of People',
    notes: 'Команда. Найм Senior PM.',
  },
  {
    fullName: 'Сергей Маслов',
    email: 's.maslov@vtb.ru',
    phone: '+7 (495) 777-00-12',
    organization: 'ВТБ Корпоративный',
    title: 'VP',
    notes: 'Партнёр · VIP. Холодный контакт, требует знакомства.',
  },
  {
    fullName: 'Ирина Колесова',
    email: 'i.kolesova@cloud24.ru',
    phone: '+7 (495) 555-02-12',
    organization: 'Cloud24',
    title: 'General Counsel',
    notes: 'Команда · Legal. Согласует все договоры > 5M ₽.',
  },
];

export const EVENTS: DemoEvent[] = [
  // Monday
  { weekday: 0, startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, title: 'Daily standup', description: 'Ежедневный синк команды.', location: 'Zoom · Cloud24 team' },
  { weekday: 0, startHour: 11, startMinute: 0, endHour: 12, endMinute: 30, title: 'Ревью архитектуры', description: 'Обсуждение архитектурных предложений по платежному модулю.', location: 'Переговорная "Скала"', attendees: ['d.lazarev@cloud24.ru', 'a.kravchenko@cloud24.ru'] },
  { weekday: 0, startHour: 14, startMinute: 0, endHour: 15, endMinute: 0, title: '1:1 с Михаилом', description: 'Регулярный 1:1 с COO.', location: 'Кабинет CEO', attendees: ['m.dorokhov@cloud24.ru'] },
  { weekday: 0, startHour: 16, startMinute: 0, endHour: 17, endMinute: 0, title: 'Sales pipeline review', description: 'Обзор открытых сделок и прогноз на квартал.' },
  // Tuesday
  { weekday: 1, startHour: 9, startMinute: 30, endHour: 10, endMinute: 30, title: 'Звонок с Газпром-Tech', description: 'Финализация договора поставки оборудования.', location: 'Zoom', attendees: ['a.sokolova@gazprom-tech.ru', 'i.kolesova@cloud24.ru'] },
  { weekday: 1, startHour: 11, startMinute: 0, endHour: 12, endMinute: 0, title: 'Product sync', description: 'Синхронизация продуктовой команды.', location: 'Переговорная "Эверест"' },
  { weekday: 1, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, title: 'Roadmap H2', description: 'Защита приоритетов на второе полугодие.', location: 'Переговорная "Олимп"', attendees: ['a.kravchenko@cloud24.ru', 'v.semin@cloud24.ru'] },
  // Wednesday
  { weekday: 2, startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, title: 'Daily standup', description: 'Ежедневный синк команды.' },
  { weekday: 2, startHour: 10, startMinute: 30, endHour: 12, endMinute: 0, title: 'Ревью бюджета Q3', description: 'Защита бюджета на третий квартал.', location: 'Переговорная "Олимп"', attendees: ['v.semin@cloud24.ru', 'm.dorokhov@cloud24.ru'] },
  { weekday: 2, startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, title: 'Обед с инвестором', description: 'Неформальный обед с представителем фонда.', location: 'Ресторан "Москва"', attendees: ['e.vinogradova@sber.ru'] },
  { weekday: 2, startHour: 14, startMinute: 30, endHour: 16, endMinute: 0, title: 'Ревью Q2 с инвесторами', description: 'Презентация результатов второго квартала.', location: 'Zoom · Investor circle', attendees: ['m.dorokhov@cloud24.ru', 'v.semin@cloud24.ru'] },
  { weekday: 2, startHour: 16, startMinute: 30, endHour: 17, endMinute: 30, title: 'Дизайн-критика', description: 'Обзор макетов нового флоу онбординга.' },
  // Thursday
  { weekday: 3, startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, title: 'Daily standup', description: 'Ежедневный синк команды.' },
  { weekday: 3, startHour: 11, startMinute: 0, endHour: 12, endMinute: 30, title: 'Юристы — договор', description: 'Согласование правок к договору с Газпром-Tech.', attendees: ['i.kolesova@cloud24.ru', 'a.sokolova@gazprom-tech.ru'] },
  { weekday: 3, startHour: 15, startMinute: 0, endHour: 16, endMinute: 30, title: 'All-hands', description: 'Общая встреча компании. Итоги месяца, объявления, Q&A.', location: 'Главный зал + Zoom' },
  // Friday
  { weekday: 4, startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, title: 'Планёрка по Q3', description: 'Установочная встреча по приоритетам Q3.', attendees: ['a.kravchenko@cloud24.ru', 'm.dorokhov@cloud24.ru'] },
  { weekday: 4, startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, title: 'Закрытие договора', description: 'Подписание договора с Газпром-Tech.', location: 'Кабинет CEO' },
  { weekday: 4, startHour: 14, startMinute: 0, endHour: 18, endMinute: 0, title: 'Стратегическая сессия', description: 'Закрытая сессия топ-команды по стратегии на 2027.', location: 'Загородный комплекс "Сосны"' },
];

export const SENT_MESSAGES: Array<{
  to: string;
  subject: string;
  body: string[];
  dayOffset: number;
  hour: number;
  minute: number;
}> = [
  {
    to: 'a.kravchenko@cloud24.ru',
    subject: 'Re: Roadmap H2 — черновик',
    dayOffset: 2,
    hour: 17,
    minute: 5,
    body: [
      'Артём, спасибо за черновик.',
      '',
      'Мой топ-3 для обсуждения:',
      '  1. Self-serve тариф — нужен для роста ARR',
      '  2. SSO для enterprise — закроет 60% возражений на сделках > 10M',
      '  3. AI-копилот — высокий потенциал, но требует пилота',
      '',
      'Встретимся в четверг после All-hands.',
      '',
      'Игорь',
    ],
  },
  {
    to: 'm.dorokhov@cloud24.ru',
    subject: 'Re: Планёрка по Q3 — материалы',
    dayOffset: 0,
    hour: 9,
    minute: 47,
    body: [
      'Михаил,',
      '',
      'Получил, посмотрю до обеда. По B2C-сегменту согласен — нужно вынести в отдельный пункт.',
      '',
      'Игорь',
    ],
  },
];
