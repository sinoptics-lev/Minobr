import { useMemo, useState } from 'react';
import { Plus, Play, CheckCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { fmtDate, isOverdue, taskStatusLabel, TASK_STATUS, ALL_PERSONS, TODAY_STR } from '@/lib/meta';
import type { RoadmapTask } from '@/types';

export interface GanttItem {
  id: string; title: string;
  planStart: string; planEnd: string;
  factStart?: string; factEnd?: string;
  overdue: boolean; done: boolean; color: string;
}

// ===== Мини-диаграмма Ганта =====
export function Gantt({ items, showLabels = true }: { items: GanttItem[]; showLabels?: boolean }) {
  const { min, max } = useMemo(() => {
    const dates = items.flatMap(i => [new Date(i.planStart), new Date(i.planEnd), new Date(TODAY_STR)]);
    return { min: new Date(Math.min(...dates.map(Number))), max: new Date(Math.max(...dates.map(Number))) };
  }, [items]);
  const span = Math.max(1, Number(max) - Number(min));
  const pos = (d: string) => ((new Date(d).getTime() - Number(min)) / span) * 100;
  const todayPos = pos(TODAY_STR);

  // месячные метки
  const months = useMemo(() => {
    const res: { label: string; left: number }[] = [];
    const cur = new Date(min.getFullYear(), min.getMonth(), 1);
    while (cur <= max) {
      res.push({
        label: cur.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
        left: ((Number(cur) - Number(min)) / span) * 100,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return res;
  }, [min, max, span]);

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex">
        {showLabels && <div className="w-[260px] shrink-0" />}
        <div className="flex-1 relative h-5 mb-1 border-b">
          {months.map((m, i) => (
            <span key={i} className="absolute text-[10px] text-muted-foreground" style={{ left: `${m.left}%` }}>{m.label}</span>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map(t => (
          <div key={t.id} className="flex items-center">
            {showLabels && (
              <div className="w-[260px] shrink-0 pr-3 text-xs truncate" title={t.title}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: t.color }} />
                {t.title}
              </div>
            )}
            <div className="flex-1 relative h-6 bg-slate-50 rounded">
              {/* план */}
              <div className="absolute top-1 h-4 rounded-sm border"
                style={{
                  left: `${pos(t.planStart)}%`,
                  width: `${Math.max(1.5, pos(t.planEnd) - pos(t.planStart))}%`,
                  background: `${t.color}22`, borderColor: t.overdue ? '#dc2626' : t.color,
                }} />
              {/* факт */}
              {t.factStart && (
                <div className="absolute top-1 h-4 rounded-sm"
                  style={{
                    left: `${pos(t.factStart)}%`,
                    width: `${Math.max(1.5, pos(t.factEnd ?? TODAY_STR) - pos(t.factStart))}%`,
                    background: t.color, opacity: 0.85,
                  }} />
              )}
              {/* сегодня */}
              <div className="absolute top-0 bottom-0 border-l border-dashed border-[#B01E24]" style={{ left: `${todayPos}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm border border-slate-400 bg-slate-100" /> план</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-slate-500" /> факт</span>
        <span className="flex items-center gap-1"><span className="w-px h-3 border-l border-dashed border-[#B01E24]" /> сегодня ({fmtDate(TODAY_STR)})</span>
      </div>
    </div>
  );
}

// ===== Дорожная карта объекта =====
export function Roadmap({ objectId }: { objectId: string }) {
  const { tasks, role, addTask, setTaskStatus } = useStore();
  const [open, setOpen] = useState(false);
  const list = tasks.filter(t => t.objectId === objectId)
    .sort((a, b) => a.planStart.localeCompare(b.planStart));
  const canEdit = role === 'coordinator' || role === 'manager';

  const ganttItems: GanttItem[] = list.map(t => ({
    id: t.id, title: t.title, planStart: t.planStart, planEnd: t.planEnd,
    factStart: t.factStart, factEnd: t.factEnd,
    overdue: isOverdue(t), done: t.status === 'done',
    color: isOverdue(t) ? '#dc2626' : TASK_STATUS[t.status].bar,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Дорожная карта объекта <span className="text-muted-foreground font-normal">({list.length} задач)</span></h3>
        {canEdit && (
          <Button size="sm" className="bg-[#B01E24] hover:bg-[#8f181d]" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Добавить задачу
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-lg border p-10 text-center text-muted-foreground text-sm">
          Дорожная карта пока не сформирована.{canEdit ? ' Добавьте первую задачу.' : ''}
        </div>
      ) : (
        <>
          <Gantt items={ganttItems} />
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="p-3">Задача</th>
                  <th className="p-3 w-[150px]">Ответственный</th>
                  <th className="p-3 w-[170px]">План</th>
                  <th className="p-3 w-[170px]">Факт</th>
                  <th className="p-3 w-[120px]">Статус</th>
                  <th className="p-3 w-[150px]"></th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => {
                  const st = taskStatusLabel(t);
                  return (
                    <tr key={t.id} className={`border-b last:border-0 ${isOverdue(t) ? 'bg-red-50/40' : ''}`}>
                      <td className="p-3 font-medium">{t.title}</td>
                      <td className="p-3">
                        <div>{t.assignee}</div>
                        <div className="text-xs text-muted-foreground">{t.vedomstvo}</div>
                      </td>
                      <td className="p-3 text-xs">{fmtDate(t.planStart)} — {fmtDate(t.planEnd)}</td>
                      <td className="p-3 text-xs">
                        {t.factStart ? `${fmtDate(t.factStart)} — ${t.factEnd ? fmtDate(t.factEnd) : '…'}` : <span className="text-muted-foreground">не начата</span>}
                      </td>
                      <td className="p-3"><Badge variant="outline" className={st.className}>{st.label}</Badge></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          {t.status === 'not_started' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setTaskStatus(t.id, 'start')}>
                              <Play className="w-3 h-3 mr-1" /> Приступить
                            </Button>
                          )}
                          {t.status === 'in_progress' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50" onClick={() => setTaskStatus(t.id, 'finish')}>
                              <CheckCheck className="w-3 h-3 mr-1" /> Завершить
                            </Button>
                          )}
                          {t.status === 'done' && canEdit && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setTaskStatus(t.id, 'reset')}>
                              <RotateCcw className="w-3 h-3 mr-1" /> Вернуть
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AddTaskDialog open={open} onClose={() => setOpen(false)} objectId={objectId}
        onSubmit={(t) => { addTask(t); setOpen(false); }} />
    </div>
  );
}

function AddTaskDialog({ open, onClose, objectId, onSubmit }: {
  open: boolean; onClose: () => void; objectId: string;
  onSubmit: (t: Omit<RoadmapTask, 'id' | 'status'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [person, setPerson] = useState(ALL_PERSONS[0].short);
  const [planStart, setPlanStart] = useState(TODAY_STR);
  const [planEnd, setPlanEnd] = useState(TODAY_STR);
  const valid = title.trim().length > 3 && planStart && planEnd && planEnd >= planStart;
  const org = ALL_PERSONS.find(p => p.short === person)?.org ?? '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новая задача дорожной карты</DialogTitle>
          <DialogDescription>Ответственный получит уведомление о назначении задачи.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Наименование задачи *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Проведение торгов" />
          </div>
          <div>
            <Label>Ответственный</Label>
            <Select value={person} onValueChange={setPerson}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_PERSONS.map(p => <SelectItem key={p.short} value={p.short}>{p.short} — {p.org}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Плановое начало *</Label>
              <Input type="date" value={planStart} onChange={e => setPlanStart(e.target.value)} />
            </div>
            <div>
              <Label>Плановое окончание *</Label>
              <Input type="date" value={planEnd} onChange={e => setPlanEnd(e.target.value)} />
            </div>
          </div>
          {planEnd < planStart && <div className="text-xs text-red-600">Дата окончания не может быть раньше даты начала.</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!valid} className="bg-[#B01E24] hover:bg-[#8f181d]"
            onClick={() => onSubmit({ objectId, title: title.trim(), assignee: person, vedomstvo: org, planStart, planEnd })}>
            Добавить задачу
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
