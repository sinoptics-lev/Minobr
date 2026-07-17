// ===== Доменные типы ИС СА =====

export type Role = 'coordinator' | 'inspector' | 'manager';

export type ObjectType = 'Строительство' | 'Ремонт' | 'Реконструкция';

/** Жизненный цикл объекта в системе */
export type ObjectStatus =
  | 'new'        // поступил, ожидает рассмотрения координатором
  | 'checking'   // назначены ведомства, идут проверки
  | 'approved'   // итоговое заключение: согласовано
  | 'rejected';  // итоговое заключение: отклонено

export type CheckStatus = 'pending' | 'in_progress' | 'done';
export type Verdict = 'agree' | 'reject';

export interface CheckPhoto {
  id: string;
  label: string;
}

export interface Check {
  id: string;
  vedomstvo: string;        // ведомство, проводящее проверку
  assignee: string;         // ответственный сотрудник ведомства
  status: CheckStatus;
  visitDate?: string;       // дата выезда
  photos: CheckPhoto[];
  comment?: string;         // комментарий о выезде
  verdict?: Verdict;        // заключение: согласовано / отклонено
  doneDate?: string;
}

export interface Conclusion {
  result: 'approved' | 'rejected';
  text: string;
  date: string;
}

export interface RegistryObject {
  id: string;
  name: string;
  type: ObjectType;
  industry: string;          // отрасль
  address: string;
  coords: [number, number];  // широта, долгота
  source: 'external' | 'manual'; // поступил из внешней ИС / добавлен вручную
  incomingDate: string;
  description: string;
  status: ObjectStatus;
  checks: Check[];
  conclusion?: Conclusion;
  projectId?: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'done';

export interface RoadmapTask {
  id: string;
  objectId: string;
  title: string;
  assignee: string;    // ФИО ответственного (коротко)
  vedomstvo: string;
  planStart: string;
  planEnd: string;
  factStart?: string;
  factEnd?: string;
  status: TaskStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  objectIds: string[];
  createdDate: string;
}

export interface NotificationItem {
  id: string;
  date: string;       // ISO с временем
  text: string;
  kind: 'object' | 'check' | 'conclusion' | 'task' | 'project';
  roles: Role[];      // кому адресовано
  read: boolean;
  objectId?: string;
}

export type View =
  | { name: 'registry' }
  | { name: 'object'; id: string }
  | { name: 'projects' }
  | { name: 'project'; id: string }
  | { name: 'cabinet' }
  | { name: 'dashboard' };
