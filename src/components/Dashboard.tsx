import { Building2, Inbox, ClipboardCheck, CheckCircle2, XCircle, AlarmClock } from 'lucide-react';
import { useStore } from '@/lib/store';
import { isOverdue, fmtDate } from '@/lib/meta';

export function Dashboard() {
  const { objects, tasks, navigate } = useStore();

  const kpis = [
    { label: 'Всего объектов', value: objects.length, icon: Building2, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Новые', value: objects.filter(o => o.status === 'new').length, icon: Inbox, color: 'text-blue-700', bg: 'bg-blue-100' },
    { label: 'На проверке', value: objects.filter(o => o.status === 'checking').length, icon: ClipboardCheck, color: 'text-amber-700', bg: 'bg-amber-100' },
    { label: 'Согласовано', value: objects.filter(o => o.status === 'approved').length, icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-100' },
    { label: 'Отклонено', value: objects.filter(o => o.status === 'rejected').length, icon: XCircle, color: 'text-red-700', bg: 'bg-red-100' },
    { label: 'Просрочено задач', value: tasks.filter(isOverdue).length, icon: AlarmClock, color: 'text-red-700', bg: 'bg-red-100' },
  ];

  // Проверки по ведомствам
  const byVedomstvo = new Map<string, { total: number; done: number }>();
  objects.flatMap(o => o.checks).forEach(c => {
    const e = byVedomstvo.get(c.vedomstvo) ?? { total: 0, done: 0 };
    e.total++; if (c.status === 'done') e.done++;
    byVedomstvo.set(c.vedomstvo, e);
  });

  // По отраслям
  const byIndustry = new Map<string, number>();
  objects.forEach(o => byIndustry.set(o.industry, (byIndustry.get(o.industry) ?? 0) + 1));
  const maxIndustry = Math.max(...byIndustry.values(), 1);

  const overdue = tasks.filter(isOverdue);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1f2937]">Дашборд руководителя</h1>
        <p className="text-sm text-muted-foreground">Сводные показатели по реестру объектов, проверкам и задачам</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-lg border p-4">
            <div className={`w-9 h-9 rounded-lg ${k.bg} ${k.color} flex items-center justify-center mb-2`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Проверки по ведомствам */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-4">Проверки по ведомствам</h3>
          <div className="space-y-3">
            {[...byVedomstvo.entries()].sort((a, b) => b[1].total - a[1].total).map(([v, e]) => (
              <div key={v}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{v}</span>
                  <span className="text-muted-foreground">{e.done}/{e.total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#B01E24] rounded-full" style={{ width: `${(e.done / e.total) * 100}%` }} />
                </div>
              </div>
            ))}
            {byVedomstvo.size === 0 && <p className="text-sm text-muted-foreground">Проверки ещё не назначались.</p>}
          </div>
        </div>

        {/* По отраслям */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-4">Объекты по отраслям</h3>
          <div className="space-y-3">
            {[...byIndustry.entries()].sort((a, b) => b[1] - a[1]).map(([ind, n]) => (
              <div key={ind}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{ind}</span>
                  <span className="text-muted-foreground">{n}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#B01E24] rounded-full" style={{ width: `${(n / maxIndustry) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Просроченные задачи */}
        <div className="bg-white rounded-lg border border-red-200 p-5">
          <h3 className="font-semibold text-sm mb-4 text-red-800">Просроченные задачи</h3>
          {overdue.length === 0 && <p className="text-sm text-muted-foreground">Просроченных задач нет.</p>}
          <div className="space-y-2.5">
            {overdue.map(t => {
              const obj = objects.find(o => o.id === t.objectId);
              return (
                <div key={t.id} className="border border-red-100 bg-red-50/50 rounded-lg p-2.5 cursor-pointer hover:bg-red-50"
                  onClick={() => navigate({ name: 'object', id: t.objectId })}>
                  <div className="text-sm font-medium leading-tight">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {obj?.name} · {t.assignee} · план до {fmtDate(t.planEnd)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
