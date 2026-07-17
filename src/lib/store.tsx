import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { RegistryObject, RoadmapTask, Project, NotificationItem, Role, View, Verdict, ObjectType } from '@/types';
import { DEMO_OBJECTS, DEMO_TASKS, DEMO_PROJECTS, DEMO_NOTIFICATIONS } from '@/lib/data';
import { uid, personOf, TODAY_STR, TODAY } from '@/lib/meta';

interface Store {
  role: Role;
  setRole: (r: Role) => void;
  vedomstvo: string;
  setVedomstvo: (v: string) => void;
  view: View;
  navigate: (v: View) => void;
  objects: RegistryObject[];
  tasks: RoadmapTask[];
  projects: Project[];
  notifications: NotificationItem[];
  // actions
  assignVedomstva: (objectId: string, vedomstva: string[]) => void;
  startCheck: (objectId: string, checkId: string, visitDate: string) => void;
  completeCheck: (objectId: string, checkId: string, data: { visitDate: string; photos: string[]; comment: string; verdict: Verdict }) => void;
  addObject: (data: { name: string; type: ObjectType; industry: string; district: string; address: string; coords: [number, number]; description: string }) => string;
  addTask: (task: Omit<RoadmapTask, 'id' | 'status'>) => void;
  setTaskStatus: (taskId: string, action: 'start' | 'finish' | 'reset') => void;
  createProject: (name: string, description: string, objectIds: string[]) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('store missing');
  return s;
};

const notify = (text: string, kind: NotificationItem['kind'], roles: Role[], objectId?: string): NotificationItem => ({
  id: uid(),
  date: `${TODAY_STR}T${String(TODAY.getHours()).padStart(2, '0')}:${String(TODAY.getMinutes()).padStart(2, '0')}`,
  text, kind, roles, read: false, objectId,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('coordinator');
  const [vedomstvo, setVedomstvo] = useState('Минобразования МО');
  const [view, setView] = useState<View>({ name: 'registry' });
  const [objects, setObjects] = useState(DEMO_OBJECTS);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [projects, setProjects] = useState(DEMO_PROJECTS);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const navigate = useCallback((v: View) => { setView(v); window.scrollTo(0, 0); }, []);

  const push = useCallback((n: NotificationItem[]) => {
    setNotifications(prev => [...n, ...prev]);
  }, []);

  // Координатор назначает ведомства для проверок
  const assignVedomstva = useCallback((objectId: string, vedomstva: string[]) => {
    setObjects(prev => prev.map(o => {
      if (o.id !== objectId) return o;
      const newChecks = vedomstva
        .filter(v => !o.checks.some(c => c.vedomstvo === v))
        .map(v => ({ id: uid(), vedomstvo: v, assignee: personOf(v), status: 'pending' as const, assignedDate: TODAY_STR, photos: [] }));
      return { ...o, status: 'checking' as const, checks: [...o.checks, ...newChecks] };
    }));
    const obj = objects.find(o => o.id === objectId);
    push([
      notify(`По объекту «${obj?.name}» назначены проверки: ${vedomstva.join(', ')}`, 'check', ['inspector', 'coordinator'], objectId),
    ]);
  }, [objects, push]);

  const startCheck = useCallback((objectId: string, checkId: string, visitDate: string) => {
    setObjects(prev => prev.map(o => o.id !== objectId ? o : {
      ...o, checks: o.checks.map(c => c.id !== checkId ? c : { ...c, status: 'in_progress' as const, visitDate }),
    }));
  }, []);

  // Сотрудник завершает проверку; при завершении всех — итоговое заключение
  const completeCheck = useCallback((objectId: string, checkId: string, data: { visitDate: string; photos: string[]; comment: string; verdict: Verdict }) => {
    let conclusionText = '';
    let objName = '';
    setObjects(prev => prev.map(o => {
      if (o.id !== objectId) return o;
      objName = o.name;
      const checks = o.checks.map(c => c.id !== checkId ? c : {
        ...c, status: 'done' as const, visitDate: data.visitDate, comment: data.comment,
        verdict: data.verdict, doneDate: TODAY_STR,
        photos: data.photos.map((label, i) => ({ id: uid() + i, label })),
      });
      if (checks.every(c => c.status === 'done')) {
        const rejected = checks.some(c => c.verdict === 'reject');
        const agree = checks.filter(c => c.verdict === 'agree').length;
        const conclusion = {
          result: rejected ? 'rejected' as const : 'approved' as const,
          text: rejected
            ? `Есть отклонившие ведомства (${checks.length - agree} из ${checks.length}). Проведение работ по объекту в текущей редакции не согласовано. Требуется доработка предложения.`
            : `По итогам проверок всех ведомств (${agree} из ${checks.length} — «согласовано») проведение работ по объекту признано целесообразным.`,
          date: TODAY_STR,
        };
        conclusionText = conclusion.result === 'approved'
          ? `Сформировано итоговое заключение по объекту «${o.name}»: работы согласованы`
          : `Итоговое заключение по объекту «${o.name}»: работы отклонены`;
        return { ...o, checks, conclusion, status: conclusion.result };
      }
      return { ...o, checks };
    }));
    const obj = objects.find(o => o.id === objectId);
    const check = obj?.checks.find(c => c.id === checkId);
    const notes = [
      notify(`${check?.vedomstvo} завершило проверку по объекту «${objName || obj?.name}»: ${data.verdict === 'agree' ? 'согласовано' : 'отклонено'}`, 'check', ['coordinator'], objectId),
    ];
    if (conclusionText) notes.push(notify(conclusionText, 'conclusion', ['manager', 'coordinator'], objectId));
    push(notes);
  }, [objects, push]);

  // Ручное добавление объекта
  const addObject = useCallback((data: { name: string; type: ObjectType; industry: string; district: string; address: string; coords: [number, number]; description: string }) => {
    const id = 'obj-' + uid();
    setObjects(prev => [{
      id, ...data, source: 'manual' as const, incomingDate: TODAY_STR, status: 'new' as const, checks: [],
    }, ...prev]);
    push([notify(`Объект «${data.name}» добавлен вручную и ожидает рассмотрения`, 'object', ['coordinator'], id)]);
    return id;
  }, [push]);

  const addTask = useCallback((task: Omit<RoadmapTask, 'id' | 'status'>) => {
    setTasks(prev => [...prev, { ...task, id: 't-' + uid(), status: 'not_started' }]);
    const obj = objects.find(o => o.id === task.objectId);
    push([notify(`В дорожную карту объекта «${obj?.name}» добавлена задача «${task.title}»`, 'task', [role === 'inspector' ? 'coordinator' : 'inspector'], task.objectId)]);
  }, [objects, push, role]);

  const setTaskStatus = useCallback((taskId: string, action: 'start' | 'finish' | 'reset') => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      if (action === 'start') return { ...t, status: 'in_progress' as const, factStart: t.factStart ?? TODAY_STR };
      if (action === 'finish') return { ...t, status: 'done' as const, factEnd: TODAY_STR, factStart: t.factStart ?? TODAY_STR };
      return { ...t, status: 'not_started' as const, factStart: undefined, factEnd: undefined };
    }));
  }, []);

  const createProject = useCallback((name: string, description: string, objectIds: string[]) => {
    const id = 'prj-' + uid();
    setProjects(prev => [...prev, { id, name, description, objectIds, createdDate: TODAY_STR }]);
    setObjects(prev => prev.map(o => objectIds.includes(o.id) ? { ...o, projectId: id } : o));
    push([notify(`Создан проект «${name}»: объединено объектов — ${objectIds.length}`, 'project', ['coordinator', 'manager'])]);
  }, [push]);

  const markAllRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);
  const markRead = useCallback((id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);

  const value = useMemo<Store>(() => ({
    role, setRole, vedomstvo, setVedomstvo, view, navigate,
    objects, tasks, projects, notifications,
    assignVedomstva, startCheck, completeCheck, addObject, addTask, setTaskStatus,
    createProject, markAllRead, markRead,
  }), [role, vedomstvo, view, objects, tasks, projects, notifications, navigate, assignVedomstva, startCheck, completeCheck, addObject, addTask, setTaskStatus, createProject, markAllRead, markRead]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
