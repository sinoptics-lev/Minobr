import {
  Inbox, ClipboardCheck, Camera, FileCheck2, Wallet, ListChecks, Gauge,
  UserRound, UsersRound, Crown, ChevronRight, Bell, MapPin, FolderKanban,
  LayoutDashboard, HardHat, Info,
} from 'lucide-react';

type RoleKey = 'coordinator' | 'inspector' | 'manager' | 'system' | 'all';

const ROLE_STYLE: Record<RoleKey, { label: string; color: string; bg: string }> = {
  coordinator: { label: 'Координатор', color: '#B01E24', bg: '#B01E2414' },
  inspector: { label: 'Сотрудник ведомства', color: '#1d4ed8', bg: '#1d4ed814' },
  manager: { label: 'Руководитель', color: '#047857', bg: '#04785714' },
  system: { label: 'Система', color: '#64748b', bg: '#64748b14' },
  all: { label: 'Все роли', color: '#7c3aed', bg: '#7c3aed14' },
};

// ===== Общий процесс: этапы =====
const STAGES: { icon: React.ElementType; title: string; desc: string; who: RoleKey }[] = [
  { icon: Inbox, title: 'Поступление объекта', desc: 'Объект поступает из внешней ИС после геоанализа (координаты, адрес) или добавляется вручную', who: 'system' },
  { icon: ClipboardCheck, title: 'Рассмотрение', desc: 'Координатор изучает сведения и назначает ведомства для выездных проверок', who: 'coordinator' },
  { icon: Camera, title: 'Выездные проверки', desc: 'Сотрудники ведомств выезжают на объект: фото, комментарий, заключение', who: 'inspector' },
  { icon: FileCheck2, title: 'Итоговое заключение', desc: 'Формируется автоматически: все согласовали — «согласовано», есть отказ — «отклонено»', who: 'system' },
  { icon: Wallet, title: 'Решение по объекту', desc: 'Сохранение (строительство, ремонт) или закрытие (передача, снос) + финансирование', who: 'coordinator' },
  { icon: ListChecks, title: 'Исполнение', desc: 'Дорожная карта с задачами и план/факт датами; объекты объединяются в проекты', who: 'all' },
  { icon: Gauge, title: 'Контроль', desc: 'Дашборды «Общая картина» и «Текущая работа», уведомления о событиях и просрочках', who: 'manager' },
];

// ===== Роли =====
const ROLES: {
  key: RoleKey; icon: React.ElementType; name: string; example: string;
  mission: string; rights: string[]; sections: string[];
}[] = [
  {
    key: 'coordinator', icon: UserRound, name: 'Координатор',
    example: 'Ответственный сотрудник отраслевого ведомства (Смирнова А.В.)',
    mission: 'Ведёт объект через весь цикл согласования и запускает исполнение',
    rights: [
      'Рассматривает новые объекты и назначает ведомства для проверок',
      'Добавляет объекты в реестр вручную',
      'Оформляет решение по объекту и финансирование',
      'Объединяет объекты в проекты',
      'Ведёт дорожные карты: добавляет задачи, назначает ответственных',
    ],
    sections: ['Реестр объектов', 'Проекты', 'Личный кабинет', 'Общая картина', 'Текущая работа'],
  },
  {
    key: 'inspector', icon: UsersRound, name: 'Сотрудник ведомства',
    example: 'Ответственный за проверки от своего ведомства (Петров И.С.)',
    mission: 'Проводит выездные проверки и выполняет задачи дорожных карт',
    rights: [
      'Получает уведомления о назначенных проверках',
      'Регистрирует выезд: дата, фото, комментарий',
      'Формирует заключение: согласовать / отклонить',
      'Отмечает выполнение своих задач в дорожных картах',
    ],
    sections: ['Реестр объектов', 'Проекты', 'Личный кабинет', 'Общая картина', 'Текущая работа'],
  },
  {
    key: 'manager', icon: Crown, name: 'Руководитель',
    example: 'Руководитель (Кузнецов Д.А.)',
    mission: 'Контролирует весь процесс: сроки, узкие места, деньги, результат',
    rights: [
      'Видит общую картину: воронка, SLA, зависшие проверки',
      'Контролирует текущую работу: финансирование, муниципалитеты, просрочки',
      'Оформляет решения по объектам',
      'Объединяет объекты в проекты и ведёт задачи',
    ],
    sections: ['Общая картина', 'Текущая работа', 'Реестр объектов', 'Проекты', 'Личный кабинет'],
  },
];

// ===== Процессы по ролям =====
const FLOWS: { role: RoleKey; title: string; steps: { title: string; desc: string }[] }[] = [
  {
    role: 'coordinator',
    title: 'Процесс координатора',
    steps: [
      { title: 'Уведомление о новом объекте', desc: 'объект поступил из внешней ИС или добавлен вручную' },
      { title: 'Изучение объекта', desc: 'сведения, адрес, карта, обоснование' },
      { title: 'Назначение проверок', desc: 'выбор ведомств, сотрудники получают уведомления' },
      { title: 'Контроль проверок', desc: 'ход и результаты по каждому ведомству' },
      { title: 'Итоговое заключение', desc: 'формируется автоматически' },
      { title: 'Решение и финансирование', desc: 'вид решения, источник, суммы' },
      { title: 'Дорожная карта', desc: 'задачи, сроки, ответственные; проекты' },
    ],
  },
  {
    role: 'inspector',
    title: 'Процесс сотрудника ведомства',
    steps: [
      { title: 'Уведомление о проверке', desc: 'объект назначен его ведомству' },
      { title: 'Личный кабинет', desc: 'все назначенные проверки и задачи' },
      { title: 'Начало проверки', desc: 'регистрация даты выезда' },
      { title: 'Выезд на объект', desc: 'осмотр, фотофиксация, комментарий' },
      { title: 'Заключение', desc: 'согласовать необходимость работ / отклонить' },
      { title: 'Задачи дорожной карты', desc: 'статусы: начать / завершить' },
    ],
  },
  {
    role: 'manager',
    title: 'Процесс руководителя',
    steps: [
      { title: 'Общая картина', desc: 'воронка процесса, SLA, зависшие проверки' },
      { title: 'Текущая работа', desc: 'решения, финансирование, муниципалитеты' },
      { title: 'Красная зона', desc: 'просроченные задачи, узкие места, виновники' },
      { title: 'Решения и проекты', desc: 'оформление решений, объединение объектов' },
      { title: 'Контроль исполнения', desc: 'готовность, освоение средств, сроки' },
    ],
  },
];

function RoleBadge({ who }: { who: RoleKey }) {
  const r = ROLE_STYLE[who];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ color: r.color, background: r.bg }}>
      {r.label}
    </span>
  );
}

function FlowDiagram({ steps, color, start = 1 }: { steps: { title: string; desc: string }[]; color: string; start?: number }) {
  return (
    <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0">
          <div className="w-[168px] rounded-lg border bg-white p-3 relative">
            <div className="absolute -top-2.5 -left-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ background: color }}>
              {start + i}
            </div>
            <div className="text-xs font-semibold leading-snug mt-1">{s.title}</div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{s.desc}</div>
          </div>
          {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1f2937] flex items-center gap-2">
          <Info className="w-5 h-5 text-[#B01E24]" /> О системе
        </h1>
        <p className="text-sm text-muted-foreground">
          ИС СА — информационная система предварительной проработки решений о необходимости строительства или ремонта объектов Московской области
        </p>
      </div>

      {/* 1. Общее описание процесса */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Общее описание процесса</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Система сопровождает полный жизненный цикл объекта: от поступления из внешней информационной системы
            (после геоанализа территории) до исполнения решения. Каждый объект проходит независимую проверку
            несколькими ведомствами, итоговое заключение формируется автоматически, дальнейшая работа ведётся
            по дорожной карте, а руководство контролирует процесс через дашборды.
          </p>
        </div>
        <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
          {STAGES.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              <div className="w-[185px] rounded-lg border p-3 relative bg-slate-50/60">
                <div className="absolute -top-2.5 -left-2 w-6 h-6 rounded-full bg-[#B01E24] text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <s.icon className="w-4 h-4 text-[#B01E24] shrink-0" />
                  <span className="text-xs font-semibold leading-snug">{s.title}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 leading-snug">{s.desc}</div>
                <div className="mt-2"><RoleBadge who={s.who} /></div>
              </div>
              {i < STAGES.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-3 border-t text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Уведомления приходят о новых объектах, назначенных проверках, заключениях и просрочках задач</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Координаты объекта устанавливаются геоанализом во внешней ИС</span>
          <span className="flex items-center gap-1.5"><FolderKanban className="w-3.5 h-3.5" /> Объекты можно объединять в проекты со сводной дорожной картой</span>
        </div>
      </div>

      {/* 2. Роли */}
      <div>
        <h2 className="font-semibold mb-3">Роли для работы в системе</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ROLES.map(r => (
            <div key={r.key} className="bg-white rounded-lg border p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: ROLE_STYLE[r.key].color }}>
                  <r.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">{r.example}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3 italic">{r.mission}</p>
              <ul className="space-y-1.5 text-xs flex-1">
                {r.rights.map((x, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: ROLE_STYLE[r.key].color }} />
                    <span className="leading-snug">{x}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                {r.sections.map(s => (
                  <span key={s} className="text-[10px] rounded-full border px-2 py-0.5 text-slate-600 bg-slate-50">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Процессы по ролям */}
      <div>
        <h2 className="font-semibold mb-3">Процессы работы по ролям</h2>
        <div className="space-y-4">
          {FLOWS.map(f => (
            <div key={f.role} className="bg-white rounded-lg border overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: ROLE_STYLE[f.role].bg }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: ROLE_STYLE[f.role].color }} />
                <span className="font-semibold text-sm" style={{ color: ROLE_STYLE[f.role].color }}>{f.title}</span>
              </div>
              <div className="p-4">
                <FlowDiagram steps={f.steps} color={ROLE_STYLE[f.role].color} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Разделы системы */}
      <div className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold mb-3">Разделы системы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { icon: ClipboardCheck, name: 'Реестр объектов', desc: 'все объекты: поступление, фильтры, ручное добавление, карточка объекта' },
            { icon: FolderKanban, name: 'Проекты', desc: 'объединение объектов со сводной дорожной картой проекта' },
            { icon: UserRound, name: 'Личный кабинет', desc: 'мои проверки и задачи, уведомления' },
            { icon: LayoutDashboard, name: 'Общая картина', desc: 'процесс согласования: воронка, SLA, ведомства, зависшие проверки' },
            { icon: HardHat, name: 'Текущая работа', desc: 'исполнение решений: финансирование, типы объектов, муниципалитеты' },
          ].map(s => (
            <div key={s.name} className="rounded-lg border p-3 flex gap-2.5">
              <s.icon className="w-4 h-4 text-[#B01E24] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-muted-foreground leading-snug mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
