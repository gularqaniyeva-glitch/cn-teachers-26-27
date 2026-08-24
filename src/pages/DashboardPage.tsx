import { useEffect, useState } from 'react';
import { Users, LogIn, LogOut, TrendingUp } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Bar } from '../components/ui/Bar';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { ModuleHeatmapGrid } from '../components/statistics/ModuleHeatmapGrid';
import {
  formatTeachersPassed,
  getModuleStatsForGroup,
  getOverallTeacherPassStat,
  getOverviewStats,
  getTeacherPassStatsByGradeGroup,
} from '../utils/stats';
import { GRADE_GROUPS } from '../data/constants';
import type { GradeGroup } from '../types/teacher';
import { useT } from '../i18n/useLocaleStore';

export function DashboardPage() {
  const { teachers, loading, error, load, reload } = useTeacherStore();
  const t = useT();
  const [activeDetailGroup, setActiveDetailGroup] = useState<GradeGroup>('2-4');

  useEffect(() => {
    load();
  }, [load]);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">{t.common.loading}</p>;
  }

  if (error && teachers.length === 0) {
    return <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />;
  }

  // Та же единая база, что и на странице "Статистика": учителя без
  // назначенного класса исключены из знаменателя КАЖДОЙ верхней карточки,
  // иначе "Всего учителей" и "Прошли курс" считают по-разному.
  const eligibleTeachers = teachers.filter((te) => te.hasAssignedClass);
  const overview = getOverviewStats(eligibleTeachers);
  const overallTeacherPass = getOverallTeacherPassStat(eligibleTeachers);
  const teacherPassByGroup = getTeacherPassStatsByGradeGroup(teachers, GRADE_GROUPS);
  const activeGroupModules = getModuleStatsForGroup(teachers, activeDetailGroup);

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />}

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
          value={`${overallTeacherPass.percent}%`}
          icon={TrendingUp}
          accent="violet"
          sublabel={`${overallTeacherPass.passedTeachers} ${t.common.of} ${overallTeacherPass.totalTeachers} ${t.dashboard.ofTotal}`}
          tooltip={t.dashboard.successRateTooltip}
        />
      </div>

      {/* KPI по ФИЗИЧЕСКИМ учителям (1 человек = 1 сущность), а не по сумме
          сданных модулей — "X из Y учителей прошли курс (Z%)" на каждую
          параллель. */}
      <Card title={t.dashboard.moduleStatsTitle}>
        <div className="space-y-4">
          {teacherPassByGroup.map((g) => (
            <Bar
              key={g.group}
              label={`${t.gradeGroup[g.group]}: ${formatTeachersPassed(
                t.dashboard.teachersPassedFormat,
                g.passedTeachers,
                g.totalTeachers,
                g.percent,
              )}`}
              count={g.passedTeachers}
              percent={g.percent}
              color={g.percent >= 90 ? '#059669' : g.percent >= 70 ? '#d97706' : '#e11d48'}
            />
          ))}
        </div>
      </Card>

      <Card title={t.dashboard.moduleDetailTitle}>
        <div className="mb-4 flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
          {GRADE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveDetailGroup(g)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeDetailGroup === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.gradeGroup[g]}
            </button>
          ))}
        </div>
        <ModuleHeatmapGrid
          modules={activeGroupModules}
          passedLabel={t.dashboard.passedOf}
          ofLabel={t.common.of}
          emptyLabel={t.dashboard.moduleGridEmpty}
        />
      </Card>
    </div>
  );
}
