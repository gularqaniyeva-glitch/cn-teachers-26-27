import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, GraduationCap, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Главная', icon: LayoutDashboard, end: true },
  { to: '/teachers', label: 'Учителя', icon: Users, end: false },
  { to: '/statistics', label: 'Статистика', icon: BarChart3, end: false },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <GraduationCap size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">ЦН обучение</p>
          <p className="text-xs text-slate-400">26/27 · панель администратора</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-500">
        Тестовые данные · 50 учителей
      </div>
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
