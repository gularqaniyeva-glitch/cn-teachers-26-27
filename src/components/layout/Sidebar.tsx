import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Laptop, BarChart3, GraduationCap, X } from 'lucide-react';
import { useT } from '../../i18n/useLocaleStore';
import type { Dict } from '../../i18n/translations';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: (t: Dict) => string;
  icon: typeof LayoutDashboard;
  end: boolean;
}

interface NavGroup {
  label: (t: Dict) => string;
  items: NavItem[];
}

// Один пункт массива — один проект в портале. Сайт задуман как единый
// аналитический портал: чтобы добавить сюда новый проект в будущем,
// достаточно добавить сюда ещё один объект {label, items} — он отрисуется
// отдельным блоком со своим заголовком, без изменений в остальной вёрстке.
const NAV_GROUPS: NavGroup[] = [
  {
    label: (t) => t.nav.projectLabel,
    items: [
      { to: '/', label: (t) => t.nav.home, icon: LayoutDashboard, end: true },
      { to: '/statistics', label: (t) => t.nav.statistics, icon: BarChart3, end: false },
      { to: '/teachers', label: (t) => t.nav.teachers, icon: Users, end: false },
      { to: '/senior', label: (t) => t.nav.seniorGrades, icon: Laptop, end: false },
    ],
  },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();

  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <GraduationCap size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{t.nav.brandTitle}</p>
          <p className="truncate text-xs text-slate-400">{t.nav.brandSubtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label(t)}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {group.label(t)}
            </p>
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label(t)}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Десктоп: постоянная боковая панель */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 lg:flex">
        <NavContent />
      </aside>

      {/* Мобильный: выезжающая панель поверх контента */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900">
            <button
              onClick={onClose}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Закрыть меню"
            >
              <X size={18} />
            </button>
            <NavContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
