import { useEffect } from 'react';
import { Users, LogIn, LogOut, TrendingUp } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Bar } from '../components/ui/Bar';
import { getModuleStatsByGradeGroup, getOverviewStats } from '../utils/stats';
import { GRADE_GROUPS } from '../data/constants';
import { useT } from '../i18n/useLocaleStore';

export function DashboardPage() {
  const { teachers, loading, load } = useTeacherStore();
  const t = useT();

  useEffect(() => {
    load();
  }, [load]);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">{t.common.loading}</p>;
  }

  const overview = getOverviewStats(teachers);
  const groupStats = getModuleStatsByGradeGroup(teachers, GRADE_GROUPS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t.dashboard.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.dashboard.totalTeachers} value={overview.total} icon={Users} accent="blue" />
        <StatCard
          label={t.dashboard.entered}
          value={overview.entered}
          icon={LogIn}
          accent="emerald"
          sublabel={`${Math.round((overview.entered / (overview.total || 1)) * 100)}% ${t.dashboard.ofTotal}`}
          tooltip={t.dashboard.enteredTooltip}
        />
        <StatCard
          label={t.dashboard.notEntered}
          value={overview.notEntered}
          icon={LogOut}
          accent="rose"
          sublabel={`${Math.round((overview.notEntered / (overview.total || 1)) * 100)}% ${t.dashboard.ofTotal}`}
          tooltip={t.dashboard.notEnteredTooltip}
        />
        <StatCard
          label={t.dashboard.successRate}
          value={`${overview.successRate}%`}
          icon={TrendingUp}
          accent="violet"
          sublabel={t.dashboard.successRateHint}
          tooltip={t.dashboard.successRateTooltip}
        />
      </div>

      <Card title={t.dashboard.moduleStatsTitle}>
        <div className="space-y-4">
          {groupStats.map((g) => (
            <Bar
              key={g.group}
              label={`${t.gradeGroup[g.group]} · ${t.dashboard.passedOf} ${g.passed} ${t.common.of} ${g.started}`}
              count={g.passed}
              percent={g.passRate}
              color={g.passRate >= 60 ? '#059669' : g.passRate >= 40 ? '#d97706' : '#e11d48'}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
