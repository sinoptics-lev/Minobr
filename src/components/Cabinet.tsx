import { ClipboardCheck, Inbox, ListTodo, FileCheck2, AlarmClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { ROLE_USERS, OBJECT_STATUS, CHECK_STATUS, fmtDate, isOverdue, taskStatusLabel } from '@/lib/meta';

export function Cabinet() {
  const { role, vedomstvo, objects, tasks, navigate } = useStore();
  const user = ROLE_USERS[role];

  const myTasks = tasks.filter(t => t.assignee === user.short);
  const myChecks = role === 'inspector'
    ? objects.flatMap(o => o.checks.map(c => ({ obj: o, check: c }))).filter(x => x.check.vedomstvo === vedomstvo)
    : [];
  const newObjects = objects.filter(o => o.status === 'new');
  const conclusions = objects.filter(o => o.conclusion).sort((a, b) => (b.conclusion!.date).localeCompare(a.conclusion!.date));
  const overdueTasks = tasks.filter(isOverdue);

  return (
    <div className="space-y-4">
      {/* Профиль */}
      <div className="bg-white rounded-lg border p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#B01E24] text-white flex items-center justify-center text-lg font-bold">
          {user.short.split(' ')[0][0]}{user.short.split(' ')[1]?.[0] ?? ''}
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#1f2937]">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.post}{role === 'inspector' ? ` · ${vedomstvo}` : ''}
          </p>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-6 text-center">
          <div><div className="text-2xl font-bold text-[#B01E24]">{myTasks.filter(t => t.status !== 'done').length}</div><div className="text-xs text-muted-foreground">мои задачи</div></div>
          {role === 'inspector' && <div><div className="text-2xl font-bold text-[#B01E24]">{myChecks.filter(x => x.check.status !== 'done').length}</div><div className="text-xs text-muted-foreground">мои проверки</div></div>}
          {role === 'coordinator' && <div><div className="text-2xl font-bold text-[#B01E24]">{newObjects.length}</div><div className="text-xs text-muted-foreground">на рассмотрении</div></div>}
          {role === 'manager' && <div><div className="text-2xl font-bold text-[#B01E24]">{overdueTasks.length}</div><div className="text-xs text-muted-foreground">просрочено</div></div>}
          <div><div className="text-2xl font-bold text-[#B01E24]">{conclusions.length}</div><div className="text-xs text-muted-foreground">заключений</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Координатор: новые объекты */}
        {role === 'coordinator' && (
          <Section title="Требуют рассмотрения" icon={<Inbox className="w-4 h-4" />} count={newObjects.length}>
            {newObjects.length === 0 && <Empty text="Нет новых объектов" />}
            {newObjects.map(o => (
              <Row key={o.id} onClick={() => navigate({ name: 'object', id: o.id })}>
                <div className="flex-1">
                  <div className="font-medium text-sm">{o.name}</div>
                  <div className="text-xs text-muted-foreground">{o.address} · поступил {fmtDate(o.incomingDate)}</div>
                </div>
                <Badge variant="outline" className={OBJECT_STATUS[o.status].className}>Назначьте ведомства</Badge>
              </Row>
            ))}
          </Section>
        )}

        {/* Сотрудник ведомства: мои проверки */}
        {role === 'inspector' && (
          <Section title={`Мои проверки · ${vedomstvo}`} icon={<ClipboardCheck className="w-4 h-4" />} count={myChecks.filter(x => x.check.status !== 'done').length}>
            {myChecks.length === 0 && <Empty text="Проверок для вашего ведомства нет" />}
            {myChecks.map(({ obj, check }) => (
              <Row key={check.id} onClick={() => navigate({ name: 'object', id: obj.id })}>
                <div className="flex-1">
                  <div className="font-medium text-sm">{obj.name}</div>
                  <div className="text-xs text-muted-foreground">{obj.address}</div>
                </div>
                <Badge variant="outline" className={CHECK_STATUS[check.status].className}>{CHECK_STATUS[check.status].label}</Badge>
              </Row>
            ))}
          </Section>
        )}

        {/* Руководитель: итоговые заключения */}
        {role === 'manager' && (
          <Section title="Итоговые заключения" icon={<FileCheck2 className="w-4 h-4" />} count={conclusions.length}>
            {conclusions.map(o => (
              <Row key={o.id} onClick={() => navigate({ name: 'object', id: o.id })}>
                <div className="flex-1">
                  <div className="font-medium text-sm">{o.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(o.conclusion!.date)} · проверок: {o.checks.length}</div>
                </div>
                <Badge variant="outline" className={o.conclusion!.result === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                  {o.conclusion!.result === 'approved' ? 'Согласовано' : 'Отклонено'}
                </Badge>
              </Row>
            ))}
          </Section>
        )}

        {/* Мои задачи */}
        <Section title="Мои задачи" icon={<ListTodo className="w-4 h-4" />} count={myTasks.filter(t => t.status !== 'done').length}>
          {myTasks.length === 0 && <Empty text="У вас нет назначенных задач" />}
          {myTasks.sort((a, b) => a.planEnd.localeCompare(b.planEnd)).map(t => {
            const obj = objects.find(o => o.id === t.objectId);
            const st = taskStatusLabel(t);
            return (
              <Row key={t.id} onClick={() => navigate({ name: 'object', id: t.objectId })}>
                <div className="flex-1">
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{obj?.name} · план до {fmtDate(t.planEnd)}</div>
                </div>
                <Badge variant="outline" className={st.className}>{st.label}</Badge>
              </Row>
            );
          })}
        </Section>

        {/* Просроченные задачи (руководитель/координатор) */}
        {role !== 'inspector' && overdueTasks.length > 0 && (
          <Section title="Просроченные задачи" icon={<AlarmClock className="w-4 h-4" />} count={overdueTasks.length} accent>
            {overdueTasks.map(t => {
              const obj = objects.find(o => o.id === t.objectId);
              return (
                <Row key={t.id} onClick={() => navigate({ name: 'object', id: t.objectId })}>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{obj?.name} · {t.assignee} · план до {fmtDate(t.planEnd)}</div>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Просрочена</Badge>
                </Row>
              );
            })}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, count, children, accent }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border ${accent ? 'border-red-200' : ''}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${accent ? 'bg-red-50/60' : 'bg-slate-50/60'} rounded-t-lg`}>
        <span className={accent ? 'text-red-700' : 'text-[#B01E24]'}>{icon}</span>
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="divide-y max-h-[340px] overflow-y-auto">{children}</div>
    </div>
  );
}

function Row({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-red-50/30 cursor-pointer transition-colors" onClick={onClick}>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{text}</div>;
}
