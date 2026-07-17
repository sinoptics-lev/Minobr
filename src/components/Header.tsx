import { Bell, Building2, FolderKanban, LayoutDashboard, UserRound, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { ROLE_LABELS, ROLE_USERS, VEDOMSTVA, fmtDateTime } from '@/lib/meta';
import { Emblem } from '@/components/Emblem';
import type { Role, View } from '@/types';

const NAV: { key: View['name']; label: string; icon: React.ElementType; roles: Role[] }[] = [
  { key: 'registry', label: 'Реестр объектов', icon: ClipboardList, roles: ['coordinator', 'inspector', 'manager'] },
  { key: 'projects', label: 'Проекты', icon: FolderKanban, roles: ['coordinator', 'inspector', 'manager'] },
  { key: 'cabinet', label: 'Личный кабинет', icon: UserRound, roles: ['coordinator', 'inspector', 'manager'] },
  { key: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, roles: ['manager'] },
];

export function Header() {
  const { role, setRole, vedomstvo, setVedomstvo, view, navigate, notifications, markAllRead, markRead } = useStore();
  const user = ROLE_USERS[role];
  const myNotifications = notifications.filter(n => n.roles.includes(role));
  const unread = myNotifications.filter(n => !n.read).length;
  const activeTab = view.name === 'object' ? 'registry' : view.name === 'project' ? 'projects' : view.name;

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="h-1 bg-[#B01E24]" />
      <div className="max-w-[1400px] mx-auto px-4 pt-3 pb-2 flex items-center gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate({ name: 'registry' })}>
          <Emblem size={40} />
          <div>
            <div className="font-bold text-lg leading-tight text-[#1f2937]">
              ИС СА <span className="text-[#B01E24]">·</span> Московская область
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight">
              Информационная система предварительной проработки решений о строительстве и ремонте объектов
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Переключатель роли */}
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground px-1">Роль пользователя</span>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-[220px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ведомство сотрудника */}
          {role === 'inspector' && (
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground px-1">Ведомство</span>
              <Select value={vedomstvo} onValueChange={setVedomstvo}>
                <SelectTrigger className="w-[220px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEDOMSTVA.map(v => (
                    <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Уведомления */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative h-9 w-9 mt-3">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#B01E24] text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unread}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0" align="end">
              <div className="flex items-center justify-between px-4 py-2.5 border-b">
                <span className="font-semibold text-sm">Уведомления</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>Прочитать все</Button>
              </div>
              <ScrollArea className="h-[320px]">
                {myNotifications.length === 0 && (
                  <div className="p-6 text-sm text-muted-foreground text-center">Нет уведомлений</div>
                )}
                {myNotifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-2.5 border-b text-sm cursor-pointer hover:bg-slate-50 ${n.read ? 'opacity-60' : 'bg-red-50/40'}`}
                    onClick={() => { markRead(n.id); if (n.objectId) navigate({ name: 'object', id: n.objectId }); }}
                  >
                    <div className="flex gap-2">
                      {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#B01E24] shrink-0" />}
                      <div className={n.read ? 'pl-4' : ''}>
                        <div className="leading-snug">{n.text}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{fmtDateTime(n.date)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Профиль */}
          <div className="flex items-center gap-2 mt-3 pl-2 border-l">
            <div className="w-9 h-9 rounded-full bg-[#B01E24] text-white flex items-center justify-center text-xs font-bold">
              {user.short.split(' ')[0][0]}{user.short.split(' ')[1]?.[0] ?? ''}
            </div>
            <div className="hidden lg:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                {user.post}{role === 'inspector' ? ` · ${vedomstvo}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="max-w-[1400px] mx-auto px-4 flex gap-1">
        {NAV.filter(n => n.roles.includes(role)).map(n => (
          <button
            key={n.key}
            onClick={() => navigate({ name: n.key } as View)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
              activeTab === n.key
                ? 'border-[#B01E24] text-[#B01E24] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-[#B01E24] hover:bg-slate-50'
            }`}
          >
            <n.icon className="w-4 h-4" />
            {n.label}
          </button>
        ))}
        <div className="ml-auto flex items-center pb-1">
          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
            Интерактивный прототип · данные демонстрационные
          </Badge>
        </div>
      </div>
      <Separator />
    </header>
  );
}

// иконка для внешнего использования
export { Building2 };
