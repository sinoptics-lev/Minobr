import { useMemo, useState } from 'react';
import { Building2, Landmark, Banknote, ListChecks, Gauge, AlarmClock, X, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';
import {
  INDUSTRIES, OBJECT_CATEGORIES, DECISION_KINDS, DECISION_GROUPS,
  fmtDate, fmtMoney, isOverdue,
} from '@/lib/meta';
import type { DecisionKind, RegistryObject, RoadmapTask } from '@/types';

const KINDS = Object.keys(DECISION_KINDS) as DecisionKind[];

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

/** Готовность объекта по задачам дорожной карты */
const readiness = (tks: RoadmapTask[]) =>
  tks.length === 0 ? null : pct(tks.filter(t => t.status === 'done').length, tks.length);

export function WorksDashboard() {
  const { objects, tasks, navigate } = useStore();
  const [fGroup, setFGroup] = useState('all');
  const [fCategory, setFCategory] = useState('all');
  const [fDistrict, setFDistrict] = useState('all');
  const [fIndustry, setFIndustry] = useState('all');
  const [selKind, setSelKind] = useState<DecisionKind | null>(null);

  const districts = useMemo(() => [...new Set(objects.map(o => o.district))].sort(), [objects]);

  // Заключённые объекты без оформленного решения — показываем отдельной пометкой
  const noDecision = useMemo(() => objects.filter(o => o.conclusion && !o.decision), [objects]);

  // Объекты в текущей работе = с оформленным решением
  const scope = useMemo(() => objects.filter(o =>
    o.decision &&
    (fGroup === 'all' || DECISION_KINDS[o.decision.kind].group === fGroup) &&
    (fCategory === 'all' || o.category === fCategory) &&
    (fDistrict === 'all' || o.district === fDistrict) &&
    (fIndustry === 'all' || o.industry === fIndustry)
  ), [objects, fGroup, fCategory, fDistrict, fIndustry]);

  const tasksOf = useMemo(() => {
    const m = new Map<string, RoadmapTask[]>();
    scope.forEach(o => m.set(o.id, tasks.filter(t => t.objectId === o.id)));
    return m;
  }, [scope, tasks]);

  const allTasks = useMemo(() => scope.flatMap(o => tasksOf.get(o.id) ?? []), [scope, tasksOf]);
  const overdueTasks = allTasks.filter(isOverdue);

  // ===== Сводные показатели =====
  const planTotal = scope.reduce((a, o) => a + o.decision!.planFunding, 0);
  const usedTotal = scope.reduce((a, o) => a + o.decision!.usedFunding, 0);
  const saveObjs = scope.filter(o => DECISION_KINDS[o.decision!.kind].group === 'save');
  const closeObjs = scope.filter(o => DECISION_KINDS[o.decision!.kind].group === 'close');
  const readyPct = readiness(allTasks);

  const kpis = [
    { label: 'Объектов в работе', value: scope.length, icon: Building2, sub: `сохранение: ${saveObjs.length} · закрытие: ${closeObjs.length}`, alert: false },
    { label: 'Плановое финансирование', value: fmtMoney(planTotal), icon: Landmark, sub: `объектов с решением: ${scope.length}`, alert: false },
    { label: 'Освоено средств', value: fmtMoney(usedTotal), icon: Banknote, sub: `${pct(usedTotal, planTotal)}% от плана`, alert: false },
    { label: 'Средняя готовность', value: readyPct === null ? '—' : `${readyPct}%`, icon: Gauge, sub: `задач выполнено: ${allTasks.filter(t => t.status === 'done').length} из ${allTasks.length}`, alert: false },
    { label: 'Задач в работе', value: allTasks.filter(t => t.status === 'in_progress').length, icon: ListChecks, sub: `не начато: ${allTasks.filter(t => t.status === 'not_started').length}`, alert: false },
    { label: 'Просрочено задач', value: overdueTasks.length, icon: AlarmClock, sub: overdueTasks.length ? 'требуют вмешательства' : 'все сроки соблюдаются', alert: overdueTasks.length > 0 },
  ];

  // ===== Решения: разрез по видам =====
  const byKind = useMemo(() => KINDS.map(k => {
    const list = scope.filter(o => o.decision!.kind === k);
    return {
      kind: k, list,
      plan: list.reduce((a, o) => a + o.decision!.planFunding, 0),
      used: list.reduce((a, o) => a + o.decision!.usedFunding, 0),
    };
  }), [scope]);

  // ===== Финансирование по источникам =====
  const bySource = useMemo(() => {
    const m = new Map<string, { plan: number; used: number }>();
    scope.forEach(o => {
      const e = m.get(o.decision!.source) ?? { plan: 0, used: 0 };
      e.plan += o.decision!.planFunding;
      e.used += o.decision!.usedFunding;
      m.set(o.decision!.source, e);
    });
    return [...m.entries()].map(([name, e]) => ({ name, ...e })).sort((a, b) => b.plan - a.plan);
  }, [scope]);
  const maxSourcePlan = Math.max(...bySource.map(s => s.plan), 1);

  // ===== Типы объектов (детализация по выбранному виду решения) =====
  const detailScope = useMemo(() => selKind ? scope.filter(o => o.decision!.kind === selKind) : scope, [scope, selKind]);

  const byCategory = useMemo(() => OBJECT_CATEGORIES
    .map(c => {
      const list = detailScope.filter(o => o.category === c);
      if (list.length === 0) return null;
      const tks = list.flatMap(o => tasksOf.get(o.id) ?? []);
      return {
        name: c, total: list.length, objs: list,
        plan: list.reduce((a, o) => a + o.decision!.planFunding, 0),
        used: list.reduce((a, o) => a + o.decision!.usedFunding, 0),
        ready: readiness(tks),
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.plan - a.plan) as any[], [detailScope, tasksOf]);

  // ===== Муниципалитеты =====
  const byDistrict = useMemo(() => districts
    .filter(d => fDistrict === 'all' || d === fDistrict)
    .map(d => {
      const list = scope.filter(o => o.district === d);
      if (list.length === 0) return null;
      const tks = list.flatMap(o => tasksOf.get(o.id) ?? []);
      return {
        name: d, total: list.length,
        save: list.filter(o => DECISION_KINDS[o.decision!.kind].group === 'save').length,
        close: list.length - list.filter(o => DECISION_KINDS[o.decision!.kind].group === 'save').length,
        plan: list.reduce((a, o) => a + o.decision!.planFunding, 0),
        used: list.reduce((a, o) => a + o.decision!.usedFunding, 0),
        ready: readiness(tks),
        overdue: tks.filter(isOverdue).length,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.plan - a.plan) as any[], [scope, districts, fDistrict, tasksOf]);

  // ===== Таблица объектов =====
  const rows = useMemo(() => scope.map(o => {
    const tks = tasksOf.get(o.id) ?? [];
    return {
      obj: o,
      ready: readiness(tks),
      overdue: tks.filter(isOverdue).length,
      deadline: tks.length ? tks.map(t => t.planEnd).sort().slice(-1)[0] : null,
    };
  }).sort((a, b) => b.overdue - a.overdue || b.obj.decision!.planFunding - a.obj.decision!.planFunding), [scope, tasksOf]);

  const hasFilter = fGroup !== 'all' || fCategory !== 'all' || fDistrict !== 'all' || fIndustry !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#1f2937]">Текущая работа по согласованным объектам</h1>
          <p className="text-sm text-muted-foreground">Исполнение решений по объектам после итогового заключения: финансирование, готовность, сроки</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={fGroup} onValueChange={setFGroup}>
            <SelectTrigger className="w-[150px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все решения</SelectItem>
              <SelectItem value="save">Сохранение</SelectItem>
              <SelectItem value="close">Закрытие</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fCategory} onValueChange={setFCategory}>
            <SelectTrigger className="w-[160px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы объектов</SelectItem>
              {OBJECT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fIndustry} onValueChange={setFIndustry}>
            <SelectTrigger className="w-[160px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все отрасли</SelectItem>
              {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fDistrict} onValueChange={setFDistrict}>
            <SelectTrigger className="w-[190px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все муниципалитеты</SelectItem>
              {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={() => { setFGroup('all'); setFCategory('all'); setFIndustry('all'); setFDistrict('all'); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Сбросить
            </Button>
          )}
        </div>
      </div>

      {noDecision.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2 flex-wrap">
          <AlarmClock className="w-4 h-4 shrink-0" />
          <span>Итоговое заключение сформировано, но решение не оформлено:</span>
          {noDecision.map(o => (
            <button key={o.id} className="underline font-medium hover:text-amber-900" onClick={() => navigate({ name: 'object', id: o.id })}>{o.name}</button>
          ))}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className={`bg-white rounded-lg border p-4 ${k.alert ? 'border-red-300 ring-1 ring-red-100' : ''}`}>
            <div className={`text-xs mb-1.5 ${k.alert ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>{k.label}</div>
            <div className="text-2xl font-bold leading-none">{k.value}</div>
            <div className={`text-[11px] mt-1.5 ${k.alert ? 'text-red-600' : 'text-muted-foreground'}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Решения + финансирование */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-1">Решения по объектам</h3>
          <p className="text-[11px] text-muted-foreground mb-3">нажмите на вид решения — ниже откроется детализация по типам объектов</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(['save', 'close'] as const).map(g => {
              const gObjs = scope.filter(o => DECISION_KINDS[o.decision!.kind].group === g);
              const gPlan = gObjs.reduce((a, o) => a + o.decision!.planFunding, 0);
              const gUsed = gObjs.reduce((a, o) => a + o.decision!.usedFunding, 0);
              return (
                <div key={g} className={`rounded-lg border p-4 ${g === 'save' ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: DECISION_GROUPS[g].color }} />
                      <span className="font-semibold text-sm">{DECISION_GROUPS[g].label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <b className="text-sm text-foreground">{gObjs.length}</b> объектов · {fmtMoney(gPlan)}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {byKind.filter(k => DECISION_KINDS[k.kind].group === g).map(k => (
                      <div key={k.kind}
                        className={`rounded-md px-2 py-1.5 -mx-2 -my-1 transition-colors ${k.list.length === 0 ? 'opacity-50' : 'cursor-pointer'} ${selKind === k.kind ? 'bg-white' : k.list.length > 0 ? 'hover:bg-white/70' : ''}`}
                        style={selKind === k.kind ? { boxShadow: `0 0 0 2px ${DECISION_KINDS[k.kind].color}` } : undefined}
                        onClick={() => k.list.length > 0 && setSelKind(selKind === k.kind ? null : k.kind)}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm" style={{ background: DECISION_KINDS[k.kind].color }} />
                            {DECISION_KINDS[k.kind].label}
                          </span>
                          <span className="text-muted-foreground">
                            {k.list.length} объекта · {fmtMoney(k.plan)} · освоено {pct(k.used, k.plan)}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/80 rounded-full overflow-hidden border">
                          <div className="h-full rounded-full" style={{ width: `${pct(k.used, k.plan)}%`, background: DECISION_KINDS[k.kind].color }} />
                        </div>
                      </div>
                    ))}
                    {gObjs.length === 0 && <p className="text-xs text-muted-foreground">Объектов нет.</p>}
                  </div>
                  <div className="mt-3 pt-2 border-t text-[11px] text-muted-foreground">
                    Освоено: {fmtMoney(gUsed)} из {fmtMoney(gPlan)} ({pct(gUsed, gPlan)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-[#B01E24]" /> Финансирование</h3>
          <p className="text-[11px] text-muted-foreground mb-4">план / освоение по источникам средств</p>
          <div className="rounded-lg bg-slate-50 border p-3 mb-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Освоение всего</span>
              <span className="text-lg font-bold">{pct(usedTotal, planTotal)}%</span>
            </div>
            <div className="h-2.5 bg-white rounded-full overflow-hidden border mt-1.5">
              <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct(usedTotal, planTotal)}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>{fmtMoney(usedTotal)}</span><span>из {fmtMoney(planTotal)}</span>
            </div>
          </div>
          <div className="space-y-3.5">
            {bySource.map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{fmtMoney(s.used)} / {fmtMoney(s.plan)}</span>
                </div>
                <div className="h-3.5 bg-slate-100 rounded overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-slate-300/60" style={{ width: `${(s.plan / maxSourcePlan) * 100}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-[#16a34a]" style={{ width: `${(s.used / maxSourcePlan) * 100}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">освоено {pct(s.used, s.plan)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Детализация по типам объектов */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-slate-50/60 flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-sm">Детализация по типам объектов</h3>
          {selKind ? (
            <>
              <Badge variant="outline" style={{ color: DECISION_KINDS[selKind].color, borderColor: DECISION_KINDS[selKind].color + '55', background: DECISION_KINDS[selKind].color + '14' }}>
                {DECISION_KINDS[selKind].label}
              </Badge>
              <button className="text-xs text-muted-foreground hover:text-[#B01E24] underline" onClick={() => setSelKind(null)}>
                показать все решения
              </button>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">по всем решениям · для детализации выберите вид решения в блоке «Решения по объектам»</span>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
              <th className="p-3 w-[130px]">Тип объекта</th>
              <th className="p-3">Объекты</th>
              <th className="p-3 w-[70px] text-center">Всего</th>
              <th className="p-3 w-[110px] text-right">План</th>
              <th className="p-3 w-[110px] text-right">Освоено</th>
              <th className="p-3 w-[150px]">Освоение</th>
              <th className="p-3 w-[100px] text-center">Готовность</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map((c: any) => (
              <tr key={c.name} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">
                  <div className="flex flex-wrap text-xs leading-relaxed">
                    {c.objs.map((o: RegistryObject, i: number) => (
                      <span key={o.id}>
                        <button className="text-slate-600 hover:text-[#B01E24] hover:underline text-left" onClick={() => navigate({ name: 'object', id: o.id })}>{o.name}</button>
                        {i < c.objs.length - 1 ? <span className="text-slate-300"> · </span> : null}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center font-semibold">{c.total}</td>
                <td className="p-3 text-right">{fmtMoney(c.plan)}</td>
                <td className="p-3 text-right">{fmtMoney(c.used)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct(c.used, c.plan)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{pct(c.used, c.plan)}%</span>
                  </div>
                </td>
                <td className="p-3 text-center">{c.ready === null ? '—' : `${c.ready}%`}</td>
              </tr>
            ))}
            {byCategory.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Нет объектов в выборке</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Муниципалитеты */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-slate-50/60">
          <h3 className="font-semibold text-sm">Статистика по муниципалитетам</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
              <th className="p-3">Муниципалитет</th>
              <th className="p-3 w-[80px] text-center">Объектов</th>
              <th className="p-3 w-[100px] text-center">Сохранение</th>
              <th className="p-3 w-[90px] text-center">Закрытие</th>
              <th className="p-3 w-[120px] text-right">План</th>
              <th className="p-3 w-[120px] text-right">Освоено</th>
              <th className="p-3 w-[150px]">Освоение</th>
              <th className="p-3 w-[110px] text-center">Готовность</th>
              <th className="p-3 w-[110px] text-center">Просрочено</th>
            </tr>
          </thead>
          <tbody>
            {byDistrict.map((d: any) => (
              <tr key={d.name} className={`border-b last:border-0 ${d.overdue > 0 ? 'bg-red-50/40' : ''}`}>
                <td className="p-3 font-medium text-xs">{d.name}</td>
                <td className="p-3 text-center">{d.total}</td>
                <td className="p-3 text-center text-green-700">{d.save}</td>
                <td className="p-3 text-center text-red-700">{d.close || ''}</td>
                <td className="p-3 text-right">{fmtMoney(d.plan)}</td>
                <td className="p-3 text-right">{fmtMoney(d.used)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct(d.used, d.plan)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{pct(d.used, d.plan)}%</span>
                  </div>
                </td>
                <td className="p-3 text-center">{d.ready === null ? '—' : `${d.ready}%`}</td>
                <td className="p-3 text-center">
                  {d.overdue > 0 ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{d.overdue}</Badge> : ''}
                </td>
              </tr>
            ))}
            {byDistrict.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Нет данных по выбранным фильтрам</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Ход работ по объектам */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-slate-50/60 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Ход работ по объектам</h3>
          <span className="text-[11px] text-muted-foreground">сортировка: сначала объекты с просроченными задачами</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
              <th className="p-3">Объект</th>
              <th className="p-3 w-[140px]">Решение</th>
              <th className="p-3 w-[180px]">Финансирование</th>
              <th className="p-3 w-[150px]">Готовность</th>
              <th className="p-3 w-[120px]">Завершение</th>
              <th className="p-3 w-[110px] text-center">Просрочено</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const d = r.obj.decision!;
              const dk = DECISION_KINDS[d.kind];
              const usedPct = pct(d.usedFunding, d.planFunding);
              return (
                <tr key={r.obj.id} className="border-b last:border-0 hover:bg-red-50/30 cursor-pointer"
                  onClick={() => navigate({ name: 'object', id: r.obj.id })}>
                  <td className="p-3">
                    <div className="font-medium text-[#1f2937] leading-tight">{r.obj.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{r.obj.category} · {r.obj.district}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" style={{ color: dk.color, borderColor: dk.color + '55', background: dk.color + '14' }}>{dk.label}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${usedPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{usedPct}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmtMoney(d.usedFunding)} из {fmtMoney(d.planFunding)}</div>
                  </td>
                  <td className="p-3">
                    {r.ready === null ? <span className="text-xs text-muted-foreground">нет задач</span> : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.ready === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${r.ready}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{r.ready}%</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs">{r.deadline ? fmtDate(r.deadline) : '—'}</td>
                  <td className="p-3 text-center">
                    {r.overdue > 0 ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{r.overdue}</Badge> : ''}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Нет объектов в выборке</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
