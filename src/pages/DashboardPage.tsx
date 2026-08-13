import { useEffect } from 'react';
import { Users, LogIn, LogOut, TrendingUp } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Bar } from '../components/ui/Bar';
import { getModuleStats, getOverviewStats } from '../utils/stats';

export function DashboardPage() {
  const { teachers, loading, load } = useTeacherStore();

  useEffect(() => {
    load();
  }, [load]);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">Загрузка данных…</p>;
  }

  const overview = getOverviewStats(teachers);
  const moduleStats = getModuleStats(teachers);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Главная</h1>
        <p className="mt-1 text-sm text-slate-500">
          Общая картина по учителям проекта «ЦН обучение 26/27»
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего учителей" value={overview.total} icon={Users} accent="blue" />
        <StatCard
          label="Вошли на платформу"
          value={overview.entered}
          icon={LogIn}
          accent="emerald"
          sublabel={`${Math.round((overview.entered / (overview.total || 1)) * 100)}% от общего числа`}
        />
        <StatCard
          label="Не вошли"
          value={overview.notEntered}
          icon={LogOut}
          accent="rose"
          sublabel={`${Math.round((overview.notEntered / (overview.total || 1)) * 100)}% от общего числа`}
        />
        <StatCard
          label="Успеваемость по модулям"
          value={`${overview.successRate}%`}
          icon={TrendingUp}
          accent="violet"
          sublabel="доля пройденных результатов"
        />
      </div>

      <Card title="Статистика по модулям">
        <div className="space-y-4">
          {moduleStats.map((m) => (
            <Bar
              key={m.moduleId}
              label={`${m.title} · сдали ${m.completed} из ${m.assigned}`}
              count={m.passed}
              percent={m.passRate}
              color={m.passRate >= 60 ? '#059669' : m.passRate >= 40 ? '#d97706' : '#e11d48'}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
