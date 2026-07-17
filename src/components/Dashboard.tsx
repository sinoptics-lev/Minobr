import { useMemo, useState } from 'react';
import { Inbox, ClipboardCheck, CheckCircle2, XCircle, AlarmClock, Gauge, TimerReset, Building2, X, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { INDUSTRIES, TODAY, fmtDate, isOverdue } from '@/lib/meta';
import type { RegistryObject } from '@/types';

const DAY = 86400000;
const days = (a: string, b: string) => Math.round(((new Date(b).getTime() - new Date(a).getTime()) / DAY) * 10) / 10;
const daysSince = (a: string) => Math.floor((TODAY.getTime() - new Date(a).getTime()) / DAY);
const fd = (n: number) => n.toFixed(1).replace('.', ',');

// Нормативные (целевые) длительности этапов, дни
const SLA = { review: 3, check: 14, cycle: 21 };
const STALE_CHECK_DAYS = 7;   // проверка «зависла», если не завершена дольше
const STALE_REVIEW_DAYS = 3;  // объект долго на рассмотрении

const earliestAssigned = (o: RegistryObject) =>
  o.checks.map(c => c.assignedDate).filter(Boolean).sort()[0] as string | undefined;

export function Dashboard() {
  const { objects, tasks, navigate } = useStore();
  const [fIndustry, setFIndustry] = useState('all');
  const [fDistrict, setFDistrict] = useState('all');

  const districts = useMemo(() => [...new Set(objects.map(o => o.district))].sort(), [objects]);

  const objs = useMemo(() => objects.filter(o =>
    (fIndustry === 'all' || o.industry === fIndustry) &&
    (fDistrict === 'all' || o.district === fDistrict)
  ), [objects, fIndustry, fDistrict]);
  const objIds = useMemo(() => new Set(objs.map(o => o.id)), [objs]);
  const tks = useMemo(() => tasks.filter(t => objIds.has(t.objectId)), [tasks, objIds]);

  // ===== Воронка и скорость =====
  const m = useMemo(() => {
    const withChecks = objs.filter(o => o.checks.length > 0);
    const withConcl = objs.filter(o => o.conclusion);
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const review = avg(withChecks.map(o => days(o.incomingDate, earliestAssigned(o) ?? o.incomingDate)));
    const check = avg(withConcl.map(o => days(earliestAssigned(o) ?? o.incomingDate, o.conclusion!.date)));
    const cycle = avg(withConcl.map(o => days(o.incomingDate, o.conclusion!.date)));
    return {
      withChecks, withConcl, review, check, cycle,
      approved: withConcl.filter(o => o.conclusion!.result === 'approved'),
      rejected: withConcl.filter(o => o.conclusion!.result === 'rejected'),
    };
  }, [objs]);

  // ===== Динамика по месяцам =====
  const months = useMemo(() => {
    const map = new Map<string, { label: string; incoming: number; concluded: number }>();
    const start = new Date(2026, 1, 1); // февраль 2026
    for (let i = 0; i < 6; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { label: d.toLocaleDateString('ru-RU', { month: 'short' }), incoming: 0, concluded: 0 });
    }
    objs.forEach(o => {
      const k1 = o.incomingDate.slice(0, 7);
      if (map.has(k1)) map.get(k1)!.incoming++;
      if (o.conclusion) {
        const k2 = o.conclusion.date.slice(0, 7);
        if (map.has(k2)) map.get(k2)!.concluded++;
      }
    });
    return [...map.entries()].map(([key, v]) => ({ key, ...v }));
  }, [objs]);
  const maxMonth = Math.max(...months.flatMap(x => [x.incoming, x.concluded]), 1);

  // ===== Ведомства =====
  const vedStats = useMemo(() => {
    const map = new Map<string, { total: number; done: number; inProgress: number; pending: number; stale: number; rejected: number; durations: number[] }>();
    objs.forEach(o => o.checks.forEach(c => {
      const e = map.get(c.vedomstvo) ?? { total: 0, done: 0, inProgress: 0, pending: 0, stale: 0, rejected: 0, durations: [] };
      e.total++;
      if (c.status === 'done') { e.done++; if (c.doneDate && c.assignedDate) e.durations.push(days(c.assignedDate, c.doneDate)); }
      else {
        if (c.status === 'in_progress') e.inProgress++; else e.pending++;
        if (daysSince(c.assignedDate ?? o.incomingDate) > STALE_CHECK_DAYS) e.stale++;
      }
      if (c.verdict === 'reject') e.rejected++;
      map.set(c.vedomstvo, e);
    }));
    return [...map.entries()]
      .map(([name, e]) => ({ name, ...e, avg: e.durations.length ? e.durations.reduce((a, b) => a + b, 0) / e.durations.length : null }))
      .sort((a, b) => (b.pending + b.inProgress) - (a.pending + a.inProgress) || b.total - a.total);
  }, [objs]);

  // ===== Округа =====
  const districtStats = useMemo(() => {
    return districts
      .filter(d => fDistrict === 'all' || d === fDistrict)
      .map(d => {
        const list = objs.filter(o => o.district === d);
        if (list.length === 0) return null;
        const ids = new Set(list.map(o => o.id));
        const dt = tks.filter(t => ids.has(t.objectId));
        const done = dt.filter(t => t.status === 'done').length;
        return {
          name: d, total: list.length,
          new: list.filter(o => o.status === 'new').length,
          checking: list.filter(o => o.status === 'checking').length,
          approved: list.filter(o => o.status === 'approved').length,
          rejected: list.filter(o => o.status === 'rejected').length,
          tasksDone: done, tasksTotal: dt.length,
          exec: dt.length ? Math.round((done / dt.length) * 100) : null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.total - a.total) as any[];
  }, [objs, tks, districts, fDistrict]);

  // ===== Красная зона =====
  const overdueTasks = tks.filter(isOverdue);
  const staleChecks = objs.flatMap(o => o.checks
    .filter(c => c.status !== 'done' && daysSince(c.assignedDate ?? o.incomingDate) > STALE_CHECK_DAYS)
    .map(c => ({ obj: o, check: c, age: daysSince(c.assignedDate ?? o.incomingDate) })));
  const staleNew = objs.filter(o => o.status === 'new' && daysSince(o.incomingDate) > STALE_REVIEW_DAYS);

  // ===== KPI =====
  const newCount = objs.filter(o => o.status === 'new').length;
  const checkingCount = objs.filter(o => o.status === 'checking').length;
  const doneTasks = tks.filter(t => t.status === 'done').length;
  const execPct = tks.length ? Math.round((doneTasks / tks.length) * 100) : 0;

  const kpis = [
    { label: 'Всего объектов', value: objs.length, icon: Building2, sub: `из внешних ИС: ${objs.filter(o => o.source === 'external').length}, вручную: ${objs.filter(o => o.source === 'manual').length}`, tone: 'slate' },
    { label: 'На рассмотрении', value: newCount, icon: Inbox, sub: staleNew.length ? `дольше ${STALE_REVIEW_DAYS} дн.: ${staleNew.length}` : 'все в нормативе', tone: newCount ? 'blue' : 'slate', alert: staleNew.length > 0 },
    { label: 'На проверке', value: checkingCount, icon: ClipboardCheck, sub: staleChecks.length ? `зависло проверок: ${staleChecks.length}` : 'зависших нет', tone: 'amber', alert: staleChecks.length > 0 },
    { label: 'Согласовано', value: m.approved.length, icon: CheckCircle2, sub: m.withConcl.length ? `${Math.round((m.approved.length / m.withConcl.length) * 100)}% от заключений` : '', tone: 'green' },
    { label: 'Отклонено', value: m.rejected.length, icon: XCircle, sub: m.withConcl.length ? `${Math.round((m.rejected.length / m.withConcl.length) * 100)}% от заключений` : '', tone: 'red' },
    { label: 'Исполнение дорожных карт', value: `${execPct}%`, icon: Gauge, sub: overdueTasks.length ? `просрочено задач: ${overdueTasks.length}` : `задач: ${doneTasks}/${tks.length}`, tone: 'red', alert: overdueTasks.length > 0 },
  ];

  const slaItems = [
    { label: 'Рассмотрение координатором', value: m.review, norm: SLA.review, hint: 'поступление → назначение проверок' },
    { label: 'Проверки ведомств', value: m.check, norm: SLA.check, hint: 'назначение → итоговое заключение' },
    { label: 'Полный цикл', value: m.cycle, norm: SLA.cycle, hint: 'поступление → заключение' },
  ];

  const funnel = [
    { label: 'Поступило в реестр', count: objs.length, color: '#64748b', conv: null as string | null, time: null as string | null },
    { label: 'Назначены проверки', count: m.withChecks.length, color: '#b45309', conv: objs.length ? `${Math.round((m.withChecks.length / objs.length) * 100)}%` : null, time: `в среднем за ${fd(m.review)} дн.` },
    { label: 'Сформировано заключение', count: m.withConcl.length, color: '#1d4ed8', conv: m.withChecks.length ? `${Math.round((m.withConcl.length / m.withChecks.length) * 100)}% от назначенных` : null, time: `проверки в среднем ${fd(m.check)} дн.` },
  ];

  const hasFilter = fIndustry !== 'all' || fDistrict !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#1f2937]">Общая картина по работе</h1>
          <p className="text-sm text-muted-foreground">Воронка процесса, скорость этапов, узкие места и исполнение дорожных карт</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={fIndustry} onValueChange={setFIndustry}>
            <SelectTrigger className="w-[170px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все отрасли</SelectItem>
              {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fDistrict} onValueChange={setFDistrict}>
            <SelectTrigger className="w-[190px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все округа</SelectItem>
              {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={() => { setFIndustry('all'); setFDistrict('all'); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Сбросить
            </Button>
          )}
        </div>
      </div>

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

      {/* Воронка + скорость */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-4">Воронка процесса: от поступления до решения</h3>
          <div className="space-y-2.5">
            {funnel.map((s, i) => (
              <div key={s.label}>
                <div className="flex items-center gap-3">
                  <div className="w-[210px] shrink-0 text-xs font-medium">{s.label}</div>
                  <div className="flex-1 h-8 bg-slate-50 rounded relative">
                    <div className="h-full rounded flex items-center px-2.5 text-white text-sm font-semibold transition-all"
                      style={{ width: `${Math.max(6, (s.count / Math.max(1, objs.length)) * 100)}%`, background: s.color }}>
                      {s.count}
                    </div>
                  </div>
                  <div className="w-[190px] shrink-0 text-[11px] text-muted-foreground">{s.time}</div>
                </div>
                {s.conv && (
                  <div className="flex items-center gap-2 ml-[210px] mt-0.5 mb-1 text-[11px] text-muted-foreground">
                    <ChevronRight className="w-3 h-3 rotate-90" /> {s.conv}
                  </div>
                )}
                {i === funnel.length - 1 && (
                  <div className="flex gap-3 ml-[210px] mt-2">
                    <div className="flex-1 rounded-lg bg-green-50 border border-green-200 p-2.5">
                      <div className="text-green-800 font-bold text-lg leading-none">{m.approved.length}</div>
                      <div className="text-[11px] text-green-700 mt-1">согласовано{m.withConcl.length ? ` · ${Math.round((m.approved.length / m.withConcl.length) * 100)}%` : ''}</div>
                    </div>
                    <div className="flex-1 rounded-lg bg-red-50 border border-red-200 p-2.5">
                      <div className="text-red-800 font-bold text-lg leading-none">{m.rejected.length}</div>
                      <div className="text-[11px] text-red-700 mt-1">отклонено{m.withConcl.length ? ` · ${Math.round((m.rejected.length / m.withConcl.length) * 100)}%` : ''}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-1.5"><TimerReset className="w-4 h-4 text-[#B01E24]" /> Скорость процесса</h3>
          <p className="text-[11px] text-muted-foreground mb-4">средняя длительность этапов против целевых значений</p>
          <div className="space-y-4">
            {slaItems.map(s => {
              const ratio = s.value / s.norm;
              const tone = ratio <= 1 ? 'text-green-700' : ratio <= 1.5 ? 'text-amber-700' : 'text-red-700';
              const bar = ratio <= 1 ? '#16a34a' : ratio <= 1.5 ? '#d97706' : '#dc2626';
              return (
                <div key={s.label}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium">{s.label}</span>
                    <span className={`text-lg font-bold ${tone}`}>{fd(s.value)} <span className="text-[11px] font-normal text-muted-foreground">дн.</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mt-1 relative overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.value / (s.norm * 2)) * 100)}%`, background: bar }} />
                    <div className="absolute top-0 bottom-0 border-l border-slate-500/60" style={{ left: '50%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>{s.hint}</span><span>цель: {s.norm} дн.</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t text-[11px] text-muted-foreground">
            Нормативы демонстрационные — настраиваются под регламент системы.
          </div>
        </div>
      </div>

      {/* Динамика + итоги */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Динамика поступления объектов и формирования заключений</h3>
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#B01E24]" /> поступило</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#16a34a]" /> заключений</span>
            </div>
          </div>
          <div className="flex items-end gap-6 h-44 px-2">
            {months.map(x => (
              <div key={x.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1.5 h-36 w-full justify-center">
                  <div className="w-7 bg-[#B01E24] rounded-t relative" style={{ height: `${(x.incoming / maxMonth) * 100}%`, minHeight: x.incoming ? 14 : 2 }}>
                    {x.incoming > 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-[#B01E24]">{x.incoming}</span>}
                  </div>
                  <div className="w-7 bg-[#16a34a] rounded-t relative" style={{ height: `${(x.concluded / maxMonth) * 100}%`, minHeight: x.concluded ? 14 : 2 }}>
                    {x.concluded > 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-[#16a34a]">{x.concluded}</span>}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground">{x.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground border-t pt-2">
            Разрыв между поступлением и заключениями показывает накопление незавершённой работы: сейчас в процессе {checkingCount + newCount} из {objs.length} объектов.
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-4">Итоговые заключения</h3>
          {m.withConcl.length === 0 ? <p className="text-sm text-muted-foreground">Заключений пока нет.</p> : (
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#16a34a" strokeWidth="4.5"
                  strokeDasharray={`${(m.approved.length / m.withConcl.length) * 100} 100`} strokeLinecap="butt" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#dc2626" strokeWidth="4.5"
                  strokeDasharray={`${(m.rejected.length / m.withConcl.length) * 100} 100`}
                  strokeDashoffset={-(m.approved.length / m.withConcl.length) * 100} strokeLinecap="butt" />
                <text x="18" y="18.5" textAnchor="middle" className="rotate-90" transform="rotate(90 18 18)" fontSize="6" fontWeight="700" fill="#1f2937">{m.withConcl.length}</text>
              </svg>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#16a34a]" /> согласовано — <b>{m.approved.length}</b></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#dc2626]" /> отклонено — <b>{m.rejected.length}</b></div>
                <div className="text-[11px] text-muted-foreground pt-1">
                  Заключений ведомств: «согласовано» {objs.flatMap(o => o.checks).filter(c => c.verdict === 'agree').length},
                  «отклонено» {objs.flatMap(o => o.checks).filter(c => c.verdict === 'reject').length}
                </div>
              </div>
            </div>
          )}
          {m.rejected.length > 0 && (
            <div className="mt-4 pt-3 border-t space-y-1.5">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Отклонённые объекты</div>
              {m.rejected.map(o => (
                <div key={o.id} className="text-xs text-red-700 hover:underline cursor-pointer" onClick={() => navigate({ name: 'object', id: o.id })}>
                  {o.name} · {o.district}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ведомства */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-slate-50/60 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Проверки по ведомствам: нагрузка, скорость, зависшие</h3>
          <span className="text-[11px] text-muted-foreground">зависшая — не завершена дольше {STALE_CHECK_DAYS} дней</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
              <th className="p-3">Ведомство</th>
              <th className="p-3 w-[80px] text-center">Назначено</th>
              <th className="p-3 w-[90px] text-center">Завершено</th>
              <th className="p-3 w-[90px] text-center">В работе</th>
              <th className="p-3 w-[80px] text-center">Ожидает</th>
              <th className="p-3 w-[90px] text-center">Зависшие</th>
              <th className="p-3 w-[110px] text-center">Ср. время проверки</th>
              <th className="p-3 w-[90px] text-center">Отказов</th>
              <th className="p-3 w-[150px]">Завершение</th>
            </tr>
          </thead>
          <tbody>
            {vedStats.map(v => (
              <tr key={v.name} className={`border-b last:border-0 ${v.stale > 0 ? 'bg-red-50/40' : ''}`}>
                <td className="p-3 font-medium">{v.name}</td>
                <td className="p-3 text-center">{v.total}</td>
                <td className="p-3 text-center text-green-700 font-medium">{v.done}</td>
                <td className="p-3 text-center text-blue-700">{v.inProgress || ''}</td>
                <td className="p-3 text-center text-slate-500">{v.pending || ''}</td>
                <td className="p-3 text-center">{v.stale > 0 ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{v.stale}</Badge> : ''}</td>
                <td className="p-3 text-center">{v.avg !== null ? `${fd(v.avg)} дн.` : '—'}</td>
                <td className="p-3 text-center">{v.rejected > 0 ? <span className="text-red-700 font-medium">{v.rejected}</span> : ''}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${(v.done / v.total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{Math.round((v.done / v.total) * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {vedStats.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Проверки не назначались</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Округа + отрасли */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-slate-50/60">
            <h3 className="font-semibold text-sm">Результаты по округам</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="p-3">Округ</th>
                <th className="p-3 w-[70px] text-center">Всего</th>
                <th className="p-3 w-[150px]">Статусы объектов</th>
                <th className="p-3 w-[130px]">Исполнение задач</th>
              </tr>
            </thead>
            <tbody>
              {districtStats.map((d: any) => (
                <tr key={d.name} className="border-b last:border-0">
                  <td className="p-3 font-medium text-xs">{d.name}</td>
                  <td className="p-3 text-center">{d.total}</td>
                  <td className="p-3">
                    <div className="flex h-4 rounded overflow-hidden border" title={`новые: ${d.new}, на проверке: ${d.checking}, согласовано: ${d.approved}, отклонено: ${d.rejected}`}>
                      {d.new > 0 && <div className="bg-blue-400" style={{ width: `${(d.new / d.total) * 100}%` }} />}
                      {d.checking > 0 && <div className="bg-amber-400" style={{ width: `${(d.checking / d.total) * 100}%` }} />}
                      {d.approved > 0 && <div className="bg-green-500" style={{ width: `${(d.approved / d.total) * 100}%` }} />}
                      {d.rejected > 0 && <div className="bg-red-500" style={{ width: `${(d.rejected / d.total) * 100}%` }} />}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">новые {d.new} · проверка {d.checking} · согл. {d.approved} · откл. {d.rejected}</div>
                  </td>
                  <td className="p-3">
                    {d.exec === null ? <span className="text-xs text-muted-foreground">нет задач</span> : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.exec === 100 ? 'bg-green-500' : d.exec >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${d.exec}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{d.exec}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-sm mb-4">Объекты по отраслям</h3>
          <div className="space-y-3.5">
            {INDUSTRIES.map(ind => {
              const list = objs.filter(o => o.industry === ind);
              if (list.length === 0) return null;
              const st = {
                new: list.filter(o => o.status === 'new').length,
                checking: list.filter(o => o.status === 'checking').length,
                approved: list.filter(o => o.status === 'approved').length,
                rejected: list.filter(o => o.status === 'rejected').length,
              };
              return (
                <div key={ind}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{ind}</span>
                    <span className="text-muted-foreground">{list.length}</span>
                  </div>
                  <div className="flex h-3.5 rounded overflow-hidden border">
                    {st.new > 0 && <div className="bg-blue-400" style={{ width: `${(st.new / list.length) * 100}%` }} title={`новые: ${st.new}`} />}
                    {st.checking > 0 && <div className="bg-amber-400" style={{ width: `${(st.checking / list.length) * 100}%` }} title={`на проверке: ${st.checking}`} />}
                    {st.approved > 0 && <div className="bg-green-500" style={{ width: `${(st.approved / list.length) * 100}%` }} title={`согласовано: ${st.approved}`} />}
                    {st.rejected > 0 && <div className="bg-red-500" style={{ width: `${(st.rejected / list.length) * 100}%` }} title={`отклонено: ${st.rejected}`} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> новые</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> на проверке</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> согласовано</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> отклонено</span>
          </div>
        </div>
      </div>

      {/* Красная зона */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AttentionCard
          title={`Просроченные задачи · ${overdueTasks.length}`}
          empty="Просроченных задач нет"
          items={overdueTasks.map(t => ({
            key: t.id,
            title: t.title,
            sub: `${objs.find(o => o.id === t.objectId)?.name} · ${t.assignee} · план до ${fmtDate(t.planEnd)} · просрочено на ${daysSince(t.planEnd)} дн.`,
            onClick: () => navigate({ name: 'object', id: t.objectId }),
          }))}
        />
        <AttentionCard
          title={`Зависшие проверки · ${staleChecks.length}`}
          empty="Зависших проверок нет"
          items={staleChecks.map(x => ({
            key: x.check.id,
            title: `${x.check.vedomstvo} — ${x.obj.name}`,
            sub: `${x.check.status === 'pending' ? 'не приступали' : 'проверка идёт'} · назначена ${fmtDate(x.check.assignedDate ?? x.obj.incomingDate)} · ${x.age} дн.`,
            onClick: () => navigate({ name: 'object', id: x.obj.id }),
          }))}
        />
        <AttentionCard
          title={`Долго на рассмотрении · ${staleNew.length}`}
          empty="Нет объектов на рассмотрении дольше норматива"
          items={staleNew.map(o => ({
            key: o.id,
            title: o.name,
            sub: `поступил ${fmtDate(o.incomingDate)} · ждёт назначения ведомств ${daysSince(o.incomingDate)} дн.`,
            onClick: () => navigate({ name: 'object', id: o.id }),
          }))}
        />
      </div>
    </div>
  );
}

function AttentionCard({ title, items, empty }: { title: string; empty: string; items: { key: string; title: string; sub: string; onClick: () => void }[] }) {
  return (
    <div className="bg-white rounded-lg border border-red-200">
      <div className="px-4 py-3 border-b bg-red-50/60 rounded-t-lg flex items-center gap-2">
        <AlarmClock className="w-4 h-4 text-red-700" />
        <span className="font-semibold text-sm text-red-800">{title}</span>
      </div>
      <div className="divide-y max-h-[260px] overflow-y-auto">
        {items.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">{empty}</div>}
        {items.map(i => (
          <div key={i.key} className="px-4 py-2.5 hover:bg-red-50/40 cursor-pointer" onClick={i.onClick}>
            <div className="text-sm font-medium leading-tight">{i.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{i.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
