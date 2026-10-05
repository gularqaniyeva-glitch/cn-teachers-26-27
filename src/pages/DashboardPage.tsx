import { useEffect, useRef, useState } from 'react';
import { Users, LogIn, LogOut, TrendingUp, Gauge, Laptop, Award } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Bar } from '../components/ui/Bar';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { RefreshDataControl } from '../components/ui/RefreshDataControl';
import { DownloadPngButton } from '../components/ui/DownloadPngButton';
import { ModuleHeatmapGrid } from '../components/statistics/ModuleHeatmapGrid';
import { formatPercentComma, formatTeachersPassed, recalculateAllMetrics } from '../utils/stats';
import { GRADE_GROUPS } from '../data/constants';
import type { GradeGroup } from '../types/teacher';
import { useT } from '../i18n/useLocaleStore';

export function DashboardPage() {
  const { teachers, loading, error, load, reload } = useTeacherStore();
  const t = useT();
  const [activeDetailGroup, setActiveDetailGroup] = useState<GradeGroup>('2-4');
  const passByGroupRef = useRef<HTMLDivElement>(null);
  const moduleHeatmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">{t.common.loading}</p>;
  }

  if (error && teachers.length === 0) {
    return <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />;
  }

  // Один пересчёт "с нуля" из свежего teachers на каждый рендер (см.
  // recalculateAllMetrics в utils/stats.ts) — единственный источник всех
  // цифр на этой странице, чтобы "Главная" и "Статистика" не могли
  // разойтись между собой на похожих, но отдельно посчитанных числах.
  const metrics = recalculateAllMetrics(teachers);
  const { total, entered, notEntered } = metrics.platform;
  const overallTeacherPass = metrics.overallPass;
  const categoryLabels = {
    only24: t.dashboard.categoryOnly24,
    only59: t.dashboard.categoryOnly59,
    both: t.dashboard.categoryBoth,
    it: t.dashboard.categoryIt,
  } as const;
  const activeGroupModules = metrics.moduleStatsByGroup[activeDetailGroup];
  const formatAverage = (average: number | null) => (average === null ? '—' : `${average.toFixed(1).replace('.', ',')}%`);

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.dashboard.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.dashboard.subtitle}</p>
        </div>
        <RefreshDataControl />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label={t.dashboard.totalTeachers}
          value={total}
          icon={Users}
          accent="blue"
          tooltip={t.dashboard.totalTeachersTooltip}
        />
        <StatCard
          label={t.dashboard.entered}
          value={entered}
          icon={LogIn}
          accent="emerald"
          sublabel={`${formatPercentComma(entered, total)} ${t.dashboard.ofTotal}`}
          tooltip={t.dashboard.enteredTooltip}
        />
        <StatCard
          label={t.dashboard.notEntered}
          value={notEntered}
          icon={LogOut}
          accent="rose"
          sublabel={`${formatPercentComma(notEntered, total)} ${t.dashboard.ofTotal}`}
          tooltip={t.dashboard.notEnteredTooltip}
        />
        <StatCard
          label={t.dashboard.successRate}
          value={`${overallTeacherPass.percent}%`}
          icon={TrendingUp}
          accent="violet"
          sublabel={t.dashboard.passedAllOpenFormat
            .replace('{passed}', String(overallTeacherPass.passedTeachers))
            .replace('{total}', String(overallTeacherPass.totalTeachers))}
          tooltip={t.dashboard.successRateTooltip}
        />
        <StatCard
          label={t.dashboard.averageScore}
          value={formatAverage(metrics.averageScore.average)}
          icon={Gauge}
          accent="blue"
          sublabel={t.dashboard.averageScoreSublabel.replace('{active}', String(metrics.averageScore.activeTeachers))}
          tooltip={t.dashboard.averageScoreTooltip}
        />
      </div>

      {/* Непересекающиеся категории учителей: каждый учитель — ровно в одной
          (двухпараллельный считается ОДНИМ человеком), суммы по категориям
          равны общему числу учителей с классом. */}
      <Card
        title={t.dashboard.moduleStatsTitle}
        titleTooltip={t.dashboard.moduleStatsTooltip}
        action={<DownloadPngButton targetRef={passByGroupRef} filename="proshli-kurs-po-kategoriyam.png" />}
      >
        <div ref={passByGroupRef} className="space-y-4 bg-white">
          {metrics.passByCategory.map((c) => (
            <div key={c.category} className="space-y-1.5">
              <Bar
                label={`${categoryLabels[c.category]} · ${t.dashboard.performanceLabel}: ${formatTeachersPassed(
                  t.dashboard.teachersPassedFormat,
                  c.passedTeachers,
                  c.totalTeachers,
                  c.percent,
                )}`}
                count={c.passedTeachers}
                percent={c.percent}
                color={c.percent >= 90 ? '#059669' : c.percent >= 70 ? '#d97706' : '#e11d48'}
              />
              <p className="text-sm text-slate-600">
                {t.dashboard.attendanceFormat
                  .replace('{active}', String(c.activeTeachers))
                  .replace('{total}', String(c.totalTeachers))
                  .replace('{percent}', String(c.activePercent))}
              </p>
              <p className="text-sm text-slate-600">
                {t.dashboard.averageScoreByGroupFormat
                  .replace('{group}', categoryLabels[c.category])
                  .replace('{value}', formatAverage(c.averageScore.average))}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Отдельный виджет IT-классов (10–11) — та же категория «IT-классы»
          из блока выше, собранная в одном месте. */}
      <Card title={t.dashboard.itWidgetTitle} titleTooltip={t.dashboard.itWidgetTooltip}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label={t.dashboard.itAttendance}
            value={`${metrics.itClasses.activePercent}%`}
            icon={Laptop}
            accent="emerald"
            sublabel={`${metrics.itClasses.activeTeachers} ${t.common.of} ${metrics.itClasses.totalTeachers}`}
            tooltip={t.dashboard.itAttendanceTooltip}
          />
          <StatCard
            label={t.dashboard.itAverageScore}
            value={formatAverage(metrics.itClasses.averageScore.average)}
            icon={Gauge}
            accent="blue"
            sublabel={t.dashboard.averageScoreSublabel.replace('{active}', String(metrics.itClasses.averageScore.activeTeachers))}
            tooltip={t.dashboard.averageScoreTooltip}
          />
          <StatCard
            label={t.dashboard.itAttestation}
            value={`${metrics.itClasses.percent}%`}
            icon={Award}
            accent="violet"
            sublabel={`${metrics.itClasses.passedTeachers} ${t.common.of} ${metrics.itClasses.totalTeachers}`}
            tooltip={t.dashboard.itAttestationTooltip}
          />
        </div>
      </Card>

      <Card
        title={t.dashboard.moduleDetailTitle}
        titleTooltip={t.dashboard.moduleDetailTooltip}
        action={
          <DownloadPngButton
            targetRef={moduleHeatmapRef}
            filename={`moduli-${activeDetailGroup}.png`}
          />
        }
      >
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
        <div ref={moduleHeatmapRef} className="bg-white">
          <ModuleHeatmapGrid
            modules={activeGroupModules}
            passedLabel={t.dashboard.passedOf}
            ofLabel={t.common.of}
            emptyLabel={t.dashboard.moduleGridEmpty}
          />
        </div>
      </Card>
    </div>
  );
}
