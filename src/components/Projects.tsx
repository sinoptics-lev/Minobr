import { ArrowLeft, FolderKanban, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { OBJECT_STATUS, PROJECT_COLORS, fmtDate, isOverdue } from '@/lib/meta';
import { Gantt, type GanttItem } from '@/components/Roadmap';

export function Projects() {
  const { projects, objects, tasks, navigate } = useStore();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1f2937]">Проекты</h1>
        <p className="text-sm text-muted-foreground">
          Связанные объекты, объединённые единым сценарием (например: ремонт одной школы, перевод учащихся и передача другой)
        </p>
      </div>

      {projects.length === 0 && (
        <div className="bg-white rounded-lg border p-10 text-center text-sm text-muted-foreground">
          Проектов пока нет. Выберите несколько объектов в реестре и нажмите «Объединить в проект».
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map(p => {
          const pObjects = objects.filter(o => p.objectIds.includes(o.id));
          const pTasks = tasks.filter(t => p.objectIds.includes(t.objectId));
          const doneTasks = pTasks.filter(t => t.status === 'done').length;
          const overdue = pTasks.filter(isOverdue).length;
          return (
            <div key={p.id} className="bg-white rounded-lg border p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate({ name: 'project', id: p.id })}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#B01E24]/10 text-[#B01E24] flex items-center justify-center">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">{p.name}</div>
                    <div className="text-xs text-muted-foreground">создан {fmtDate(p.createdDate)}</div>
                  </div>
                </div>
                {overdue > 0 && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">просрочено задач: {overdue}</Badge>}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{p.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {pObjects.map((o, i) => (
                  <Badge key={o.id} variant="outline" className="font-normal">
                    <span className="w-2 h-2 rounded-full mr-1.5" style={{ background: PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
                    {o.name}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: pTasks.length ? `${(doneTasks / pTasks.length) * 100}%` : 0 }} />
                </div>
                задач: {doneTasks}/{pTasks.length}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Карточка проекта со сводной дорожной картой =====
export function ProjectCard({ id }: { id: string }) {
  const { projects, objects, tasks, navigate } = useStore();
  const project = projects.find(p => p.id === id);
  if (!project) {
    return (
      <div className="bg-white rounded-lg border p-10 text-center">
        <p className="text-muted-foreground">Проект не найден.</p>
        <Button variant="link" onClick={() => navigate({ name: 'projects' })}>К списку проектов</Button>
      </div>
    );
  }

  const pObjects = objects.filter(o => project.objectIds.includes(o.id));
  const colorOf = new Map(pObjects.map((o, i) => [o.id, PROJECT_COLORS[i % PROJECT_COLORS.length]]));
  const pTasks = tasks.filter(t => project.objectIds.includes(t.objectId));

  // Гант с группировкой: заголовки объектов + задачи
  const ganttByObject = pObjects.map(o => ({
    object: o,
    items: pTasks.filter(t => t.objectId === o.id)
      .sort((a, b) => a.planStart.localeCompare(b.planStart))
      .map(t => ({
        id: t.id, title: t.title, planStart: t.planStart, planEnd: t.planEnd,
        factStart: t.factStart, factEnd: t.factEnd, overdue: isOverdue(t),
        done: t.status === 'done', color: colorOf.get(o.id)!,
      } satisfies GanttItem)),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate({ name: 'projects' })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[#B01E24]">
        <ArrowLeft className="w-4 h-4" /> Проекты
      </button>

      <div className="bg-white rounded-lg border p-5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-[#B01E24]">Проект</Badge>
          <span className="text-sm text-muted-foreground">создан {fmtDate(project.createdDate)}</span>
        </div>
        <h1 className="text-xl font-bold text-[#1f2937]">{project.name}</h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{project.description}</p>
      </div>

      {/* Объекты проекта */}
      <div className="bg-white rounded-lg border p-5 space-y-3">
        <h3 className="font-semibold">Объекты проекта ({pObjects.length})</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {pObjects.map(o => {
            const st = OBJECT_STATUS[o.status];
            const oTasks = pTasks.filter(t => t.objectId === o.id);
            const oDone = oTasks.filter(t => t.status === 'done').length;
            return (
              <div key={o.id} className="border rounded-lg p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate({ name: 'object', id: o.id })}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorOf.get(o.id) }} />
                      {o.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {o.address}
                    </div>
                  </div>
                  <Badge variant="outline" className={st.className}>{st.label}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  задач: {oDone}/{oTasks.length} завершено
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Сводная дорожная карта */}
      <div className="space-y-3">
        <h3 className="font-semibold">Сводная дорожная карта проекта</h3>
        {ganttByObject.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-sm text-muted-foreground">
            По объектам проекта пока нет задач дорожной карты.
          </div>
        ) : (
          ganttByObject.map(g => (
            <div key={g.object.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorOf.get(g.object.id) }} />
                {g.object.name}
              </div>
              <Gantt items={g.items} />
            </div>
          ))
        )}

        {/* Сводная таблица задач */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="p-3 w-[200px]">Объект</th>
                <th className="p-3">Задача</th>
                <th className="p-3 w-[140px]">Ответственный</th>
                <th className="p-3 w-[160px]">План</th>
                <th className="p-3 w-[160px]">Факт</th>
                <th className="p-3 w-[120px]">Статус</th>
              </tr>
            </thead>
            <tbody>
              {pTasks.sort((a, b) => a.objectId.localeCompare(b.objectId) || a.planStart.localeCompare(b.planStart)).map(t => {
                const o = pObjects.find(x => x.id === t.objectId);
                const overdue = isOverdue(t);
                return (
                  <tr key={t.id} className={`border-b last:border-0 ${overdue ? 'bg-red-50/40' : ''}`}>
                    <td className="p-3 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorOf.get(t.objectId) }} />
                        <span className="leading-tight">{o?.name}</span>
                      </span>
                    </td>
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3 text-xs">{t.assignee}<div className="text-muted-foreground">{t.vedomstvo}</div></td>
                    <td className="p-3 text-xs">{fmtDate(t.planStart)} — {fmtDate(t.planEnd)}</td>
                    <td className="p-3 text-xs">{t.factStart ? `${fmtDate(t.factStart)} — ${t.factEnd ? fmtDate(t.factEnd) : '…'}` : '—'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={overdue ? 'bg-red-100 text-red-800 border-red-200' : (t.status === 'done' ? 'bg-green-100 text-green-800 border-green-200' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200')}>
                        {overdue ? 'Просрочена' : t.status === 'done' ? 'Завершена' : t.status === 'in_progress' ? 'В работе' : 'Не начата'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
