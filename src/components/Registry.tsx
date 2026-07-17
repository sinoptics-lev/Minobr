import { useMemo, useState } from 'react';
import { Plus, Search, FolderPlus, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { OBJECT_STATUS, INDUSTRIES, OBJECT_CATEGORIES, fmtDate } from '@/lib/meta';
import type { ObjectStatus, ObjectType } from '@/types';

const TYPE_OPTIONS: ObjectType[] = ['Строительство', 'Ремонт', 'Реконструкция'];

export function Registry() {
  const { objects, projects, tasks, navigate, role, addObject, createProject } = useStore();
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState<string>('all');
  const [fIndustry, setFIndustry] = useState<string>('all');
  const [fType, setFType] = useState<string>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);

  const filtered = useMemo(() => objects.filter(o => {
    const q = search.trim().toLowerCase();
    if (q && !`${o.name} ${o.address}`.toLowerCase().includes(q)) return false;
    if (fStatus !== 'all' && o.status !== fStatus) return false;
    if (fIndustry !== 'all' && o.industry !== fIndustry) return false;
    if (fType !== 'all' && o.type !== fType) return false;
    return true;
  }), [objects, search, fStatus, fIndustry, fType]);

  const hasFilter = search || fStatus !== 'all' || fIndustry !== 'all' || fType !== 'all';
  const canMerge = (role === 'coordinator' || role === 'manager');

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#1f2937]">Реестр объектов</h1>
          <p className="text-sm text-muted-foreground">
            Объекты поступают из внешних информационных систем после геоанализа, либо добавляются вручную
          </p>
        </div>
        <div className="flex gap-2">
          {canMerge && (
            <Button variant="outline" disabled={selected.length < 2} onClick={() => setProjOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-1.5" />
              Объединить в проект{selected.length > 0 ? ` (${selected.length})` : ''}
            </Button>
          )}
          <Button onClick={() => setAddOpen(true)} className="bg-[#B01E24] hover:bg-[#8f181d]">
            <Plus className="w-4 h-4 mr-1.5" />
            Добавить объект
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg border p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Поиск по названию или адресу…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(OBJECT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fIndustry} onValueChange={setFIndustry}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Отрасль" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все отрасли</SelectItem>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fType} onValueChange={setFType}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Тип работ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFStatus('all'); setFIndustry('all'); setFType('all'); }}>
            <X className="w-3.5 h-3.5 mr-1" /> Сбросить
          </Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">Найдено: {filtered.length}</span>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b text-left text-xs text-slate-500 uppercase tracking-wide">
              {canMerge && <th className="p-3 w-8"></th>}
              <th className="p-3">Наименование объекта</th>
              <th className="p-3 w-[110px]">Тип работ</th>
              <th className="p-3 w-[130px]">Отрасль</th>
              <th className="p-3 w-[120px]">Поступил</th>
              <th className="p-3 w-[130px]">Проверки</th>
              <th className="p-3 w-[130px]">Статус</th>
              <th className="p-3 w-[150px]">Проект</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const st = OBJECT_STATUS[o.status as ObjectStatus];
              const done = o.checks.filter(c => c.status === 'done').length;
              const proj = projects.find(p => p.id === o.projectId);
              const overdueTasks = tasks.filter(t => t.objectId === o.id && t.status !== 'done' && new Date(t.planEnd) < new Date('2026-07-17')).length;
              return (
                <tr key={o.id} className="border-b last:border-0 hover:bg-red-50/30 cursor-pointer transition-colors"
                  onClick={() => navigate({ name: 'object', id: o.id })}>
                  {canMerge && (
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggleSelect(o.id)} />
                    </td>
                  )}
                  <td className="p-3">
                    <div className="font-medium text-[#1f2937]">{o.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {o.address}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {o.source === 'external' ? 'из внешней ИС' : 'добавлен вручную'}
                      </Badge>
                      {overdueTasks > 0 && (
                        <Badge variant="outline" className="text-[10px] font-normal bg-red-50 text-red-700 border-red-200">
                          просрочено задач: {overdueTasks}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{o.type}</td>
                  <td className="p-3">{o.industry}</td>
                  <td className="p-3">{fmtDate(o.incomingDate)}</td>
                  <td className="p-3">
                    {o.checks.length === 0 ? <span className="text-muted-foreground">—</span> : (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${(done / o.checks.length) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{done}/{o.checks.length}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3"><Badge variant="outline" className={st.className}>{st.label}</Badge></td>
                  <td className="p-3">
                    {proj ? (
                      <span className="text-xs text-[#B01E24] font-medium leading-tight">{proj.name}</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">Объекты не найдены. Измените условия фильтра.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddObjectDialog open={addOpen} onClose={() => setAddOpen(false)} onSubmit={(d) => { const id = addObject(d); setAddOpen(false); navigate({ name: 'object', id }); }} />
      <CreateProjectDialog open={projOpen} onClose={() => setProjOpen(false)} objectIds={selected}
        onSubmit={(name, desc) => { createProject(name, desc, selected); setProjOpen(false); setSelected([]); navigate({ name: 'projects' }); }} />
    </div>
  );
}

// ===== Диалог ручного добавления объекта =====
function AddObjectDialog({ open, onClose, onSubmit }: {
  open: boolean; onClose: () => void;
  onSubmit: (d: { name: string; type: ObjectType; industry: string; category: string; district: string; address: string; coords: [number, number]; description: string }) => void;
}) {
  const { objects } = useStore();
  const districts = [...new Set(objects.map(o => o.district))].sort();
  const [name, setName] = useState('');
  const [type, setType] = useState<ObjectType>('Строительство');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [category, setCategory] = useState(OBJECT_CATEGORIES[0]);
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('55.75');
  const [lon, setLon] = useState('37.61');
  const [description, setDescription] = useState('');
  const valid = name.trim().length > 3 && district.trim().length > 2 && address.trim().length > 3 && !isNaN(+lat) && !isNaN(+lon);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавление объекта вручную</DialogTitle>
          <DialogDescription>Объект будет добавлен в реестр со статусом «Новый» и направлен координатору на рассмотрение.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Наименование объекта *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Школа № 3 — строительство пристройки" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Тип работ</Label>
              <Select value={type} onValueChange={v => setType(v as ObjectType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Отрасль</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Тип объекта</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OBJECT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Муниципальный округ *</Label>
            <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="Например: г.о. Балашиха" list="districts-list" />
            <datalist id="districts-list">
              {districts.map(d => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div>
            <Label>Адрес *</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="г. …, ул. …, …" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Широта *</Label>
              <Input value={lat} onChange={e => setLat(e.target.value)} />
            </div>
            <div>
              <Label>Долгота *</Label>
              <Input value={lon} onChange={e => setLon(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Описание / обоснование</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Основание для добавления объекта в реестр…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!valid} className="bg-[#B01E24] hover:bg-[#8f181d]"
            onClick={() => onSubmit({ name: name.trim(), type, industry, category, district: district.trim(), address: address.trim(), coords: [parseFloat(lat), parseFloat(lon)], description: description.trim() || 'Объект добавлен вручную.' })}>
            Добавить в реестр
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Диалог объединения объектов в проект =====
function CreateProjectDialog({ open, onClose, objectIds, onSubmit }: {
  open: boolean; onClose: () => void; objectIds: string[];
  onSubmit: (name: string, description: string) => void;
}) {
  const { objects } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const selectedObjects = objects.filter(o => objectIds.includes(o.id));
  const valid = name.trim().length > 3;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Объединение объектов в проект</DialogTitle>
          <DialogDescription>
            Для объектов проекта будет сформирована сводная дорожная карта с задачами по всем объектам.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg border p-3 space-y-1.5">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Объекты в проекте ({selectedObjects.length})</div>
            {selectedObjects.map(o => (
              <div key={o.id} className="text-sm font-medium">• {o.name}</div>
            ))}
          </div>
          <div>
            <Label>Название проекта *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Реорганизация школьной сети г. Подольска" />
          </div>
          <div>
            <Label>Описание сценария проекта</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Например: после ремонта школы № 5 учащиеся школы № 7 переводятся в отремонтированное здание, здание школы № 7 передаётся на другой баланс…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!valid} className="bg-[#B01E24] hover:bg-[#8f181d]" onClick={() => onSubmit(name.trim(), description.trim())}>
            Создать проект
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
