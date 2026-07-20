import { useState, type ReactNode } from 'react';
import { ArrowLeft, Camera, CheckCircle2, XCircle, MapPin, CalendarDays, Building2, ClipboardCheck, UserRound, Wallet, ChevronDown, Landmark, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { OBJECT_STATUS, CHECK_STATUS, VEDOMSTVA, DECISION_KINDS, DECISION_GROUPS, FUNDING_SOURCES, fmtDate, fmtMoney, TODAY_STR } from '@/lib/meta';
import { MapStub } from '@/components/MapStub';
import { Roadmap } from '@/components/Roadmap';
import type { Check, Verdict, DecisionKind, RegistryObject } from '@/types';

export function ObjectCard({ id }: { id: string }) {
  const { objects, projects, navigate, role } = useStore();
  const [tab, setTab] = useState('passport');
  const obj = objects.find(o => o.id === id);
  if (!obj) {
    return (
      <div className="bg-white rounded-lg border p-10 text-center">
        <p className="text-muted-foreground">Объект не найден.</p>
        <Button variant="link" onClick={() => navigate({ name: 'registry' })}>Вернуться к реестру</Button>
      </div>
    );
  }
  const st = OBJECT_STATUS[obj.status];
  const project = projects.find(p => p.id === obj.projectId);
  const doneChecks = obj.checks.filter(c => c.status === 'done').length;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate({ name: 'registry' })}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[#B01E24]">
        <ArrowLeft className="w-4 h-4" /> Реестр объектов
      </button>

      {/* Шапка объекта */}
      <div className="bg-white rounded-lg border p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={st.className}>{st.label}</Badge>
              <Badge variant="outline">{obj.type}</Badge>
              <Badge variant="outline">{obj.industry}</Badge>
              <Badge variant="outline" className="text-slate-600">
                {obj.source === 'external' ? 'поступил из внешней ИС' : 'добавлен вручную'}
              </Badge>
              {project && (
                <Badge className="bg-[#B01E24] hover:bg-[#8f181d] cursor-pointer" onClick={() => navigate({ name: 'project', id: project.id })}>
                  Проект: {project.name}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#1f2937]">{obj.name}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {obj.address}</span>
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> поступил {fmtDate(obj.incomingDate)}</span>
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> ID {obj.id}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="passport">Паспорт объекта</TabsTrigger>
          <TabsTrigger value="checks">
            Проверки и заключение
            {obj.checks.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{doneChecks}/{obj.checks.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="roadmap">Дорожная карта</TabsTrigger>
        </TabsList>

        <TabsContent value="passport" className="mt-4">
          <PassportTab obj={obj} onGoChecks={() => setTab('checks')} />
        </TabsContent>

        <TabsContent value="checks" className="mt-4">
          <ChecksPanel objectId={obj.id} />
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <Roadmap objectId={obj.id} />
          {role === 'inspector' && (
            <p className="text-xs text-muted-foreground mt-2">Добавление задач доступно координатору и руководителю; смена статуса — ответственному исполнителю.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== Паспорт объекта (по образцу действующей системы) =====
function PassportTab({ obj, onGoChecks }: { obj: RegistryObject; onGoChecks: () => void }) {
  const { projects, tasks, navigate } = useStore();
  const p = obj.passport;
  const project = projects.find(pr => pr.id === obj.projectId);
  const objTasks = tasks.filter(t => t.objectId === obj.id);
  const planEnd = objTasks.length ? objTasks.map(t => t.planEnd).sort()[objTasks.length - 1] : undefined;
  const doneChecks = obj.checks.filter(c => c.status === 'done').length;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Левая колонка: реквизиты и сведения */}
      <div className="lg:col-span-2 space-y-4">
        {project && (
          <button onClick={() => navigate({ name: 'project', id: project.id })}
            className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1.5 hover:bg-blue-100 transition-colors">
            <Landmark className="w-3.5 h-3.5" /> Проект: {project.name}
          </button>
        )}

        <div className="bg-white rounded-lg border p-5 space-y-4">
          <div className="grid md:grid-cols-5 gap-5">
            <div className="md:col-span-2">
              <div className="rounded-lg border bg-gradient-to-br from-slate-200 to-slate-300 aspect-[4/3] flex flex-col items-center justify-center text-slate-500 gap-1.5">
                <Camera className="w-7 h-7" />
                <span className="text-xs">Фото объекта</span>
              </div>
            </div>
            <div className="md:col-span-3 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm content-start">
              <PField label="Наименование" value={obj.name} strong wide />
              <PField label="Адрес" value={obj.address} wide />
              <PField label="ОМСУ" value={obj.district} />
              <PField label="Площадь" value={p?.area ? `${p.area.toLocaleString('ru-RU')} м²` : undefined} />
              <PField label="Тип объекта" value={obj.category} />
              <PField label="Тип работ" value={obj.type} />
              <PField label="Отрасль" value={obj.industry} />
              <PField label="Источник заявки" value={obj.source === 'external' ? 'ИС «Геопортал МО»' : 'Ручное добавление'} />
              <PField label="Дата поступления" value={fmtDate(obj.incomingDate)} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Местоположение</div>
            <MapStub coords={obj.coords} address={obj.address} />
          </div>
        </div>

        <CollapsibleSection title="Основная информация" defaultOpen>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <PField label="Решение" value={obj.decision ? DECISION_KINDS[obj.decision.kind].label : undefined} strong />
            <PField label="Дата совещания" value={p?.meetingDate ? fmtDate(p.meetingDate) : undefined} />
            <PField label="Плановая дата завершения" value={planEnd ? fmtDate(planEnd) : undefined} />
            <PField label="План. сумма финансирования" value={obj.decision ? fmtMoney(obj.decision.planFunding) : undefined} />
            <PField label="Освоено средств" value={obj.decision ? fmtMoney(obj.decision.usedFunding) : undefined} />
            <PField label="Источник финансирования" value={obj.decision?.source} />
            <PField label="Постановление главы" value={p?.decree} />
            <PField label="Реквизиты письма в Минстрой" value={p?.letterRef} />
            <PField label="Год постройки" value={p?.yearBuilt ? String(p.yearBuilt) : undefined} />
            <PField label="УИН" value={p?.uin} />
            <PField label="Мощность до оптимизации" value={p?.capacityBefore} />
            <PField label="Мощность после оптимизации" value={p?.capacityAfter} />
            <PField label="Распределение детей" value={p?.childrenDistribution} />
            <PField label="Условия закрытия" value={p?.closureConditions} />
            <PField label="Примечания" value={p?.notes} wide />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Анализ потребности" defaultOpen>
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Результаты экспресс-анализа</div>
              <div className="flex gap-3 flex-wrap">
                {[1, 2].map(n => (
                  <div key={n} className="w-32 h-24 rounded-lg border bg-gradient-to-br from-slate-200 to-slate-300 flex flex-col items-center justify-center text-slate-500 gap-1">
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">Фото {n}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mt-3">{obj.description}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Список согласующих</div>
              {obj.checks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Проверки ещё не назначены — список согласующих определит координатор.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {obj.checks.map(c => (
                    <span key={c.id} className={`inline-flex items-center text-xs border rounded-full px-2.5 py-1 ${
                      c.status === 'done'
                        ? c.verdict === 'agree' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      {c.vedomstvo}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Правая колонка: заключение и история согласований */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg border p-5 space-y-3">
          {obj.conclusion ? (
            <>
              <div className={`rounded-md border px-3 py-2.5 text-sm font-medium ${
                obj.conclusion.result === 'approved'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}>
                {obj.conclusion.result === 'approved' ? 'Заключение сформировано: работы согласованы' : 'Заключение сформировано: в работах отказано'}
              </div>
              <div className="text-xs text-muted-foreground">Сформировано {fmtDate(obj.conclusion.date)}</div>
              <Button variant="outline" className="w-full" onClick={onGoChecks}>Открыть проверки</Button>
            </>
          ) : (
            <>
              <Button className="w-full bg-[#B01E24] hover:bg-[#8f181d]" onClick={onGoChecks} disabled={obj.checks.length === 0}>
                <FileText className="w-4 h-4 mr-2" /> Сформировать заключение
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                {obj.checks.length === 0
                  ? 'Недоступно: сначала координатор назначает проверки профильным ведомствам'
                  : `Завершено проверок: ${doneChecks} из ${obj.checks.length}`}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-3">История согласований</h3>
          {obj.checks.length === 0 && !obj.decision ? (
            <p className="text-sm text-muted-foreground">Согласования ещё не проводились.</p>
          ) : (
            <ol className="space-y-2.5">
              {obj.checks.map((c, i) => {
                const dot = c.status === 'done'
                  ? c.verdict === 'agree' ? 'bg-green-500' : 'bg-red-500'
                  : c.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300';
                const label = c.status === 'done'
                  ? c.verdict === 'agree' ? 'Согласовано' : 'Не согласовано'
                  : c.status === 'in_progress' ? 'В работе' : 'Назначено';
                return (
                  <li key={c.id} className="flex items-start gap-2.5 text-sm">
                    <span className="text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                    <div className="flex-1">
                      <div>{label}: {c.vedomstvo}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(c.doneDate ?? c.visitDate ?? c.assignedDate)}</div>
                    </div>
                  </li>
                );
              })}
              {obj.decision && (
                <li className="flex items-start gap-2.5 text-sm">
                  <span className="text-muted-foreground w-4 shrink-0 text-right">{obj.checks.length + 1}.</span>
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: DECISION_KINDS[obj.decision.kind].color }} />
                  <div className="flex-1">
                    <div>Решение: {DECISION_KINDS[obj.decision.kind].label}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(obj.decision.date)}</div>
                  </div>
                </li>
              )}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function PField({ label, value, strong, wide }: { label: string; value?: string; strong?: boolean; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`${strong ? 'font-medium' : ''} ${value ? '' : 'text-muted-foreground'}`}>{value ?? '—'}</span>
    </div>
  );
}

function CollapsibleSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="bg-white rounded-lg border">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 rounded-lg transition-colors">
        <span className="font-semibold">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ===== Блок проверок и итогового заключения =====
function ChecksPanel({ objectId }: { objectId: string }) {
  const { objects, role, assignVedomstva } = useStore();
  const obj = objects.find(o => o.id === objectId)!;
  const [picked, setPicked] = useState<string[]>([]);

  // Новый объект: координатор назначает ведомства
  if (obj.status === 'new') {
    if (role !== 'coordinator') {
      return (
        <div className="bg-white rounded-lg border p-10 text-center text-sm text-muted-foreground">
          Объект ожидает рассмотрения ответственным сотрудником отраслевого ведомства (координатором).
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <div>
          <h3 className="font-semibold">Рассмотрение объекта: назначение проверок</h3>
          <p className="text-sm text-muted-foreground">Выберите ведомства, которые должны провести выездные проверки объекта. Ответственные сотрудники получат уведомления.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {VEDOMSTVA.map(v => (
            <label key={v.name} className={`flex items-center gap-2.5 border rounded-lg p-3 cursor-pointer transition-colors ${picked.includes(v.name) ? 'border-[#B01E24] bg-red-50/50' : 'hover:bg-slate-50'}`}>
              <Checkbox checked={picked.includes(v.name)}
                onCheckedChange={() => setPicked(picked.includes(v.name) ? picked.filter(x => x !== v.name) : [...picked, v.name])} />
              <div>
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><UserRound className="w-3 h-3" /> {v.person}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={picked.length === 0} className="bg-[#B01E24] hover:bg-[#8f181d]"
            onClick={() => { assignVedomstva(objectId, picked); setPicked([]); }}>
            <ClipboardCheck className="w-4 h-4 mr-1.5" />
            Назначить проверки ({picked.length})
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {obj.checks.map(c => (
          <CheckCard key={c.id} objectId={objectId} check={c} />
        ))}
      </div>

      {/* Итоговое заключение */}
      {obj.conclusion ? (
        <div className={`rounded-lg border-2 p-5 ${obj.conclusion.result === 'approved' ? 'border-green-300 bg-green-50/60' : 'border-red-300 bg-red-50/60'}`}>
          <div className="flex items-center gap-2 mb-2">
            {obj.conclusion.result === 'approved'
              ? <CheckCircle2 className="w-5 h-5 text-green-700" />
              : <XCircle className="w-5 h-5 text-red-700" />}
            <h3 className="font-semibold">
              Итоговое заключение: {obj.conclusion.result === 'approved' ? 'работы согласованы' : 'работы отклонены'}
            </h3>
            <span className="text-sm text-muted-foreground ml-auto">{fmtDate(obj.conclusion.date)}</span>
          </div>
          <p className="text-sm leading-relaxed">{obj.conclusion.text}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {obj.checks.map(c => (
              <Badge key={c.id} variant="outline" className={c.verdict === 'agree' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                {c.vedomstvo}: {c.verdict === 'agree' ? 'согласовано' : 'отклонено'}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        obj.checks.length > 0 && (
          <div className="bg-white rounded-lg border p-4 text-sm text-muted-foreground">
            Итоговое заключение будет сформировано автоматически после завершения проверок всеми назначенными ведомствами
            ({obj.checks.filter(c => c.status === 'done').length} из {obj.checks.length} завершено).
          </div>
        )
      )}
      <DecisionPanel obj={obj} />
    </div>
  );
}

// ===== Карточка проверки одного ведомства =====
function CheckCard({ objectId, check }: { objectId: string; check: Check }) {
  const { role, vedomstvo } = useStore();
  const st = CHECK_STATUS[check.status];
  const mine = role === 'inspector' && check.vedomstvo === vedomstvo;

  return (
    <div className={`bg-white rounded-lg border p-4 space-y-3 ${mine && check.status !== 'done' ? 'ring-1 ring-[#B01E24]/40' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">{check.vedomstvo}</div>
          <div className="text-xs text-muted-foreground">Ответственный: {check.assignee}</div>
        </div>
        <Badge variant="outline" className={st.className}>{st.label}</Badge>
      </div>

      {check.status === 'pending' && mine && <StartCheckForm objectId={objectId} checkId={check.id} />}
      {check.status === 'in_progress' && mine && <CompleteCheckForm objectId={objectId} check={check} />}

      {check.status === 'pending' && !mine && (
        <p className="text-xs text-muted-foreground">Ожидает выезда ответственного сотрудника ведомства.</p>
      )}
      {check.status === 'in_progress' && !mine && (
        <p className="text-xs text-muted-foreground">Проверка проводится{check.visitDate ? `, дата выезда: ${fmtDate(check.visitDate)}` : ''}.</p>
      )}

      {check.status === 'done' && (
        <div className="space-y-2.5">
          <div className="text-xs text-muted-foreground">Выезд: {fmtDate(check.visitDate)} · заключение: {fmtDate(check.doneDate)}</div>
          {check.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {check.photos.map(p => (
                <div key={p.id} className="w-24">
                  <div className="w-24 h-16 rounded bg-gradient-to-br from-slate-200 to-slate-300 border flex items-center justify-center">
                    <Camera className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{p.label}</div>
                </div>
              ))}
            </div>
          )}
          {check.comment && <p className="text-sm bg-slate-50 rounded p-2.5 leading-relaxed">{check.comment}</p>}
          <Badge variant="outline" className={check.verdict === 'agree' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
            {check.verdict === 'agree' ? 'Необходимость работ согласована' : 'В работах отказано'}
          </Badge>
        </div>
      )}
    </div>
  );
}

// Регистрация выезда
function StartCheckForm({ objectId, checkId }: { objectId: string; checkId: string }) {
  const { startCheck } = useStore();
  const [date, setDate] = useState(TODAY_STR);
  return (
    <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 space-y-2">
      <Label className="text-xs">Дата выезда на объект</Label>
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm" />
        <Button size="sm" className="h-8 bg-[#B01E24] hover:bg-[#8f181d]" onClick={() => startCheck(objectId, checkId, date)}>
          Начать проверку
        </Button>
      </div>
    </div>
  );
}

// Форма результата проверки
function CompleteCheckForm({ objectId, check }: { objectId: string; check: Check }) {
  const { completeCheck } = useStore();
  const [visitDate, setVisitDate] = useState(check.visitDate ?? TODAY_STR);
  const [photos, setPhotos] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [verdict, setVerdict] = useState<Verdict | ''>('');
  const valid = comment.trim().length >= 10 && verdict !== '' && visitDate;

  const addPhoto = () => setPhotos(prev => [...prev, `Фото ${prev.length + 1} — ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`]);

  return (
    <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <Label className="text-xs">Дата выезда</Label>
          <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="h-8 text-sm" />
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={addPhoto}>
          <Camera className="w-3.5 h-3.5 mr-1" /> Добавить фото ({photos.length})
        </Button>
      </div>
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((p, i) => (
            <div key={i} className="w-20">
              <div className="w-20 h-14 rounded bg-gradient-to-br from-slate-200 to-slate-300 border flex items-center justify-center">
                <Camera className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{p}</div>
            </div>
          ))}
        </div>
      )}
      <div>
        <Label className="text-xs">Комментарий о выезде *</Label>
        <Textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Состояние объекта, выявленные замечания, обоснование заключения… (не менее 10 символов)" />
      </div>
      <div>
        <Label className="text-xs">Заключение *</Label>
        <RadioGroup className="flex gap-4 mt-1" value={verdict} onValueChange={v => setVerdict(v as Verdict)}>
          <label className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm ${verdict === 'agree' ? 'border-green-500 bg-green-50' : ''}`}>
            <RadioGroupItem value="agree" /> Согласовать необходимость работ
          </label>
          <label className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm ${verdict === 'reject' ? 'border-red-500 bg-red-50' : ''}`}>
            <RadioGroupItem value="reject" /> Отклонить
          </label>
        </RadioGroup>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={!valid} className="bg-[#B01E24] hover:bg-[#8f181d]"
          onClick={() => completeCheck(objectId, check.id, { visitDate, photos, comment: comment.trim(), verdict: verdict as Verdict })}>
          Завершить проверку
        </Button>
      </div>
      {!valid && <p className="text-[11px] text-muted-foreground">Для завершения заполните комментарий и выберите заключение.</p>}
    </div>
  );
}

// ===== Решение по объекту: вид работ и финансирование =====
function DecisionPanel({ obj }: { obj: RegistryObject }) {
  const { role, setDecision } = useStore();
  const [open, setOpen] = useState(false);
  const d = obj.decision;
  const canEdit = (role === 'coordinator' || role === 'manager') && !!obj.conclusion;

  if (!obj.conclusion) return null;

  if (!d) {
    return (
      <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 text-center">
        <p className="text-sm text-amber-800 mb-3">Итоговое заключение сформировано. Следующий шаг — оформить решение по объекту: вид работ и финансирование.</p>
        {canEdit && (
          <Button className="bg-[#B01E24] hover:bg-[#8f181d]" onClick={() => setOpen(true)}>
            <Wallet className="w-4 h-4 mr-1.5" /> Оформить решение
          </Button>
        )}
        <DecisionDialog obj={obj} open={open} onClose={() => setOpen(false)} onSubmit={setDecision} />
      </div>
    );
  }

  const dk = DECISION_KINDS[d.kind];
  const usedPct = d.planFunding > 0 ? Math.round((d.usedFunding / d.planFunding) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#B01E24]" /> Решение по объекту
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={dk.group === 'save' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
            {DECISION_GROUPS[dk.group].label}
          </Badge>
          <Badge variant="outline" style={{ color: dk.color, borderColor: dk.color + '55', background: dk.color + '14' }}>{dk.label}</Badge>
          <span className="text-xs text-muted-foreground">от {fmtDate(d.date)}</span>
          {canEdit && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(true)}>Изменить</Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
        <div><dt className="text-muted-foreground text-xs">Источник финансирования</dt><dd className="font-medium">{d.source}</dd></div>
        <div><dt className="text-muted-foreground text-xs">Плановое финансирование</dt><dd className="font-medium">{fmtMoney(d.planFunding)}</dd></div>
        <div><dt className="text-muted-foreground text-xs">Освоено</dt><dd className="font-medium">{fmtMoney(d.usedFunding)}</dd></div>
        <div><dt className="text-muted-foreground text-xs">Освоение</dt><dd className="font-medium">{usedPct}%</dd></div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${usedPct}%` }} />
      </div>
      <DecisionDialog obj={obj} open={open} onClose={() => setOpen(false)} onSubmit={setDecision} />
    </div>
  );
}

function DecisionDialog({ obj, open, onClose, onSubmit }: {
  obj: RegistryObject; open: boolean; onClose: () => void;
  onSubmit: (objectId: string, d: { kind: DecisionKind; date: string; planFunding: number; usedFunding: number; source: string }) => void;
}) {
  const approved = obj.conclusion?.result === 'approved';
  const allowedKinds = (Object.keys(DECISION_KINDS) as DecisionKind[])
    .filter(k => approved ? DECISION_KINDS[k].group === 'save' : DECISION_KINDS[k].group === 'close');
  const defaultKind: DecisionKind = approved
    ? (obj.type === 'Строительство' ? 'construction' : obj.type === 'Ремонт' ? 'capital' : 'capital')
    : 'transfer';

  const [kind, setKind] = useState<DecisionKind>(obj.decision?.kind ?? defaultKind);
  const [date, setDate] = useState(obj.decision?.date ?? TODAY_STR);
  const [plan, setPlan] = useState(String(obj.decision?.planFunding ?? ''));
  const [used, setUsed] = useState(String(obj.decision?.usedFunding ?? 0));
  const [source, setSource] = useState(obj.decision?.source ?? FUNDING_SOURCES[0]);

  const planN = parseFloat(plan.replace(',', '.'));
  const usedN = parseFloat(used.replace(',', '.'));
  const valid = !isNaN(planN) && planN > 0 && !isNaN(usedN) && usedN >= 0 && usedN <= planN && date;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Решение по объекту</DialogTitle>
          <DialogDescription>
            {approved
              ? 'Объект согласован: выберите вид работ по сохранению объекта и укажите финансирование.'
              : 'Работы отклонены: выберите решение по закрытию объекта (передача или снос).'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Вид решения *</Label>
              <Select value={kind} onValueChange={v => setKind(v as DecisionKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedKinds.map(k => <SelectItem key={k} value={k}>{DECISION_KINDS[k].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Дата решения *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Источник финансирования *</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FUNDING_SOURCES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Плановое финансирование, млн ₽ *</Label>
              <Input value={plan} onChange={e => setPlan(e.target.value)} placeholder="Например: 180" />
            </div>
            <div>
              <Label>Уже освоено, млн ₽</Label>
              <Input value={used} onChange={e => setUsed(e.target.value)} />
            </div>
          </div>
          {!valid && plan !== '' && (
            <p className="text-[11px] text-red-600">Проверьте суммы: план больше нуля, освоено — не больше плана.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!valid} className="bg-[#B01E24] hover:bg-[#8f181d]"
            onClick={() => { onSubmit(obj.id, { kind, date, planFunding: planN, usedFunding: usedN, source }); onClose(); }}>
            Сохранить решение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
