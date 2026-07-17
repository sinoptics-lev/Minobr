import type { ObjectStatus, TaskStatus, CheckStatus, Role, RoadmapTask } from '@/types';

export const TODAY = new Date('2026-07-17T12:00:00');
export const TODAY_STR = '2026-07-17';

export const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fmtDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

// ===== Ведомства Московской области и их ответственные =====
export const VEDOMSTVA: { name: string; person: string }[] = [
  { name: 'Минстрой МО', person: 'Волков П.Н.' },
  { name: 'Минобразования МО', person: 'Петров И.С.' },
  { name: 'Минздрав МО', person: 'Сидорова Е.М.' },
  { name: 'Минимущество МО', person: 'Лебедева О.В.' },
  { name: 'Комархитектура МО', person: 'Медведева Н.Н.' },
  { name: 'Минтранс МО', person: 'Громов А.А.' },
  { name: 'Минспорт МО', person: 'Титов С.П.' },
  { name: 'Минкультуры МО', person: 'Зайцева Л.Д.' },
  { name: 'Госстройнадзор МО', person: 'Орлова Т.И.' },
];

export const personOf = (vedomstvo: string) =>
  VEDOMSTVA.find(v => v.name === vedomstvo)?.person ?? '—';

// Все сотрудники (для выбора ответственного за задачу)
export const ALL_PERSONS = [
  { short: 'Смирнова А.В.', org: 'Минстрой МО (координатор)' },
  ...VEDOMSTVA.map(v => ({ short: v.person, org: v.name })),
];

// ===== Профили ролей =====
export const ROLE_USERS: Record<Role, { name: string; short: string; post: string }> = {
  coordinator: {
    name: 'Смирнова Анна Викторовна',
    short: 'Смирнова А.В.',
    post: 'Ответственный сотрудник отраслевого ведомства',
  },
  inspector: {
    name: 'Петров Игорь Сергеевич',
    short: 'Петров И.С.',
    post: 'Ответственный сотрудник ведомства',
  },
  manager: {
    name: 'Кузнецов Дмитрий Андреевич',
    short: 'Кузнецов Д.А.',
    post: 'Руководитель',
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  coordinator: 'Координатор',
  inspector: 'Сотрудник ведомства',
  manager: 'Руководитель',
};

// ===== Статусы объектов =====
export const OBJECT_STATUS: Record<ObjectStatus, { label: string; className: string }> = {
  new: { label: 'Новый', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  checking: { label: 'На проверке', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Согласовано', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Отклонено', className: 'bg-red-100 text-red-800 border-red-200' },
};

// ===== Статусы проверок =====
export const CHECK_STATUS: Record<CheckStatus, { label: string; className: string }> = {
  pending: { label: 'Ожидает проверки', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'Проверка проводится', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  done: { label: 'Проверка завершена', className: 'bg-green-100 text-green-800 border-green-200' },
};

// ===== Статусы задач =====
export const isOverdue = (t: RoadmapTask) =>
  t.status !== 'done' && new Date(t.planEnd) < TODAY;

export const TASK_STATUS: Record<TaskStatus, { label: string; className: string; bar: string }> = {
  not_started: { label: 'Не начата', className: 'bg-slate-100 text-slate-700 border-slate-200', bar: '#94a3b8' },
  in_progress: { label: 'В работе', className: 'bg-blue-100 text-blue-800 border-blue-200', bar: '#3b82f6' },
  done: { label: 'Завершена', className: 'bg-green-100 text-green-800 border-green-200', bar: '#22c55e' },
};

export const taskStatusLabel = (t: RoadmapTask) =>
  isOverdue(t) ? { label: 'Просрочена', className: 'bg-red-100 text-red-800 border-red-200' } : TASK_STATUS[t.status];

// Цвета объектов в сводной дорожной карте проекта
export const PROJECT_COLORS = ['#B01E24', '#1d4ed8', '#047857', '#a16207', '#7c3aed', '#0e7490'];

export const INDUSTRIES = ['Образование', 'Здравоохранение', 'Спорт', 'Культура', 'Транспорт'];

export const uid = () => Math.random().toString(36).slice(2, 10);
