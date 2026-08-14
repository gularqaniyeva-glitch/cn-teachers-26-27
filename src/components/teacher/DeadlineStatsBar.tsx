import type { Teacher } from '../../types/teacher';
import { getTeacherOverallStats } from '../../utils/stats';
import { useT } from '../../i18n/useLocaleStore';

interface DeadlineStatsBarProps {
  teacher: Teacher;
}

function Tile({ emoji, label, value, accentClass }: { emoji: string; label: string; value: string; accentClass?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {emoji} {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${accentClass ?? 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

// Дедлайны модулей временно отключены — в источнике данных пока нет
// вкладки с датами сдачи, поэтому считаем успеваемость от ВСЕХ
// назначенных модулей программы (utils/deadlines.ts подключится обратно,
// когда появится реальный календарь дедлайнов).
export function DeadlineStatsBar({ teacher }: DeadlineStatsBarProps) {
  const t = useT();
  const stats = getTeacherOverallStats(teacher);

  const percentAccent = stats.percent >= 70 ? 'text-emerald-600' : stats.percent >= 50 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile emoji="📌" label={t.deadlines.assignedLabel} value={String(stats.assigned)} />
      <Tile emoji="✅" label={t.deadlines.passedLabel} value={String(stats.passed)} />
      <Tile emoji="📊" label={t.deadlines.percentLabel} value={`${stats.percent}%`} accentClass={percentAccent} />
    </div>
  );
}
