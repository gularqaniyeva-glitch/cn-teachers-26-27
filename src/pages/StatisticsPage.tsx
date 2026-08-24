import { useEffect, useMemo, useState } from 'react';
import { Activity, Award, Download, Search } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { Card } from '../components/ui/Card';
import { Bar } from '../components/ui/Bar';
import { StatCard } from '../components/ui/StatCard';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { NoTranslate } from '../components/ui/NoTranslate';
import { ModuleBreakdownTable } from '../components/statistics/ModuleBreakdownTable';
import { ModulePassRateChart } from '../components/statistics/ModulePassRateChart';
import {
  countByKey,
  formatTeachersPassed,
  getModulePassRateByLifecycle,
  getModulePassRateByTrainingType,
  getOverallTeacherPassStat,
  getOverviewStats,
  getTeacherPassStatsByGradeGroup,
  getTrainingTypeSummary,
} from '../utils/stats';
import { findGroupAnomalies, findIndividualAnomalies } from '../utils/anomalies';
import { exportAnomaliesToCsv } from '../utils/csvExport';
import { TeacherQuickViewModal } from '../components/teacher/TeacherQuickViewModal';
import { GRADE_GROUPS, LIFECYCLE_STATUSES, TRAINING_TYPES, getModule } from '../data/constants';
import { useT } from '../i18n/useLocaleStore';

const PALETTE = ['#5d00e9', '#059669', '#d97706', '#e11d48', '#0891b2', '#7c3aed'];
const TRAINING_TYPE_COLORS: Record<string, string> = { asinxron: '#5d00e9', onlayn: '#0891b2', əyani: '#059669' };
const LIFECYCLE_COLORS: Record<string, string> = { OLD: '#94a3b8', NEW: '#5d00e9' };

type StatTab = 'overview' | '2-4' | '5-9';
const MODULE_TABS: StatTab[] = ['overview', '2-4', '5-9'];

export function StatisticsPage() {
  const { teachers, loading, error, load, reload } = useTeacherStore();
  const t = useT();
  const [activeTab, setActiveTab] = useState<StatTab>('overview');
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const individualAnomalies = useMemo(() => findIndividualAnomalies(teachers), [teachers]);
  const groupAnomalies = useMemo(() => findGroupAnomalies(teachers), [teachers]);
  const quickViewTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === quickViewId) ?? null,
    [teachers, quickViewId],
  );

  // Разбивки по модулям считаются один раз при изменении данных учителей —
  // переключение вкладок ниже только выбирает, что показать, не запускает
  // пересчёт заново.
  const byTrainingType24 = useMemo(() => getModulePassRateByTrainingType(teachers, '2-4'), [teachers]);
  const byTrainingType59 = useMemo(() => getModulePassRateByTrainingType(teachers, '5-9'), [teachers]);
  const byLifecycle24 = useMemo(() => getModulePassRateByLifecycle(teachers, '2-4'), [teachers]);
  const byLifecycle59 = useMemo(() => getModulePassRateByLifecycle(teachers, '5-9'), [teachers]);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">{t.common.loading}</p>;
  }

  if (error && teachers.length === 0) {
    return <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />;
  }

  // Единая база для ВСЕХ KPI-карточек этой страницы — учителя без
  // назначенного класса/параллели (hasAssignedClass=false) исключены из
  // знаменателя везде одинаково, иначе разные карточки считают "всего
  // учителей" по-разному (напр. 5183 против 5054) и цифры расходятся.
  const eligibleTeachers = teachers.filter((te) => te.hasAssignedClass);
  const total = eligibleTeachers.length || 1;
  const overview = getOverviewStats(eligibleTeachers);
  const overallTeacherPass = getOverallTeacherPassStat(eligibleTeachers);
  const teacherPassByGroup = getTeacherPassStatsByGradeGroup(teachers, GRADE_GROUPS);
  const trainingTypeSummary = getTrainingTypeSummary(eligibleTeachers);

  const byLifecycle = countByKey(
    eligibleTeachers,
    (te) => te.lifecycleStatus,
    { OLD: 'OLD', NEW: 'NEW' },
    LIFECYCLE_STATUSES,
  );
  const byPlatformStatus = countByKey(
    eligibleTeachers,
    (te) => te.platformStatus,
    { entered: t.platformStatus.entered, not_entered: t.platformStatus.notEntered },
    ['entered', 'not_entered'],
  );

  const trainingTypeSeries = TRAINING_TYPES.map((type) => ({
    key: type,
    label: t.trainingType[type],
    color: TRAINING_TYPE_COLORS[type],
  }));
  const lifecycleSeries = LIFECYCLE_STATUSES.map((status) => ({
    key: status,
    label: status,
    color: LIFECYCLE_COLORS[status],
  }));

  const trainingTypeRowsByTab: Record<'2-4' | '5-9', ReturnType<typeof getModulePassRateByTrainingType>> = {
    '2-4': byTrainingType24,
    '5-9': byTrainingType59,
  };
  const lifecycleRowsByTab: Record<'2-4' | '5-9', ReturnType<typeof getModulePassRateByLifecycle>> = {
    '2-4': byLifecycle24,
    '5-9': byLifecycle59,
  };

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />}

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t.statistics.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.statistics.subtitle}</p>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
        {MODULE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'overview' ? t.statistics.tabOverview : t.gradeGroup[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label={t.statistics.kpiAttestationTitle}
              value={`${overallTeacherPass.percent}%`}
              icon={Award}
              accent="violet"
              sublabel={`${overallTeacherPass.passedTeachers} ${t.common.of} ${overallTeacherPass.totalTeachers} · ${t.statistics.kpiAttestationHint}`}
            />
            <StatCard
              label={t.statistics.kpiPlatformActivityTitle}
              value={`${Math.round((overview.entered / total) * 100)}%`}
              icon={Activity}
              accent="emerald"
              sublabel={`${t.platformStatus.entered}: ${overview.entered} · ${t.platformStatus.notEntered}: ${overview.notEntered}`}
            />
          </div>

          <Card title={t.statistics.trainingTypeSummaryTitle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">{t.filters.trainingTypeLabel}</th>
                    <th className="px-3 py-2 text-center">{t.statistics.columnTeacherCount}</th>
                    <th className="px-3 py-2 text-center">{t.statistics.columnEnteredPercent}</th>
                    <th className="px-3 py-2 text-center">{t.statistics.columnSuccessRatePercent}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainingTypeSummary.map((row) => (
                    <tr key={row.type}>
                      <td className="py-2 pr-3 font-medium text-slate-800">{t.trainingType[row.type]}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{row.count}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{row.enteredPercent}%</td>
                      <td className="px-3 py-2 text-center text-slate-600">{row.successRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title={t.statistics.byGradeGroup} titleTooltip={t.statistics.tooltipGradeGroup}>
              <div className="space-y-4">
                {teacherPassByGroup.map((g, i) => (
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
                    color={PALETTE[i % PALETTE.length]}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">{t.statistics.expandHint}</p>
            </Card>

            <Card title={t.statistics.byLifecycle} titleTooltip={t.statistics.tooltipLifecycle}>
              <div className="space-y-4">
                {byLifecycle.map((e, i) => (
                  <Bar key={e.key} label={e.label} count={e.count} percent={e.percent} color={PALETTE[i % PALETTE.length]} />
                ))}
              </div>
            </Card>

            <Card title={t.statistics.byPlatformStatus} titleTooltip={t.statistics.tooltipPlatformStatus}>
              <div className="space-y-4">
                {byPlatformStatus.map((e) => (
                  <Bar
                    key={e.key}
                    label={e.label}
                    count={e.count}
                    percent={e.percent}
                    color={e.key === 'entered' ? '#059669' : '#e11d48'}
                  />
                ))}
              </div>
            </Card>
          </div>

          <Card title={`🔍 ${t.anomalies.title}`} titleTooltip={t.anomalies.hint}>
            {individualAnomalies.length === 0 && groupAnomalies.length === 0 ? (
              <p className="text-sm text-slate-500">{t.anomalies.noneFound}</p>
            ) : (
              <div className="space-y-6">
                {individualAnomalies.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-800">
                        {t.anomalies.individualSectionTitle} ({individualAnomalies.length})
                      </h4>
                      <button
                        onClick={() => exportAnomaliesToCsv(individualAnomalies, t)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Download size={13} />
                        {t.common.exportCsv}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {individualAnomalies.map(({ teacher, moduleIds }) => (
                        <div key={teacher.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              <NoTranslate>{teacher.fullName}</NoTranslate>
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              <NoTranslate>{teacher.school}</NoTranslate> · {t.anomalies.flaggedModulesLabel}:{' '}
                              {moduleIds.map((id) => getModule(id)?.shortTitle ?? id).join(', ')}
                            </p>
                          </div>
                          <button
                            onClick={() => setQuickViewId(teacher.id)}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
                          >
                            <Search size={13} />
                            {t.anomalies.checkLms}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupAnomalies.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">
                      {t.anomalies.groupSectionTitle} ({groupAnomalies.length})
                    </h4>
                    <div className="space-y-2">
                      {groupAnomalies.map((g, i) => (
                        <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm font-medium text-amber-800">⚠️ {t.anomalies.groupErrorLabel}</p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            {t.gradeGroup[g.gradeGroup]} · {t.language[g.sector]} · {t.trainingType[g.trainingType]} ·{' '}
                            {g.module.shortTitle} — {g.zeroRatio}% {t.anomalies.zeroRatioSuffix} ({g.teacherCount}{' '}
                            {t.anomalies.teachersSuffix}), {t.statistics.passedOf} {g.overallProgress}%{' '}
                            {t.dashboard.ofTotal}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card title={`${t.statistics.moduleByTrainingTypeTitle} — ${t.gradeGroup[activeTab]}`}>
            <div className="space-y-4">
              <ModulePassRateChart rows={trainingTypeRowsByTab[activeTab]} series={trainingTypeSeries} />
              <ModuleBreakdownTable
                rows={trainingTypeRowsByTab[activeTab]}
                columns={trainingTypeSeries}
                moduleColumnLabel={t.quickList.columnModule}
              />
            </div>
          </Card>

          <Card title={`${t.statistics.moduleByLifecycleTitle} — ${t.gradeGroup[activeTab]}`}>
            <div className="space-y-4">
              <ModulePassRateChart rows={lifecycleRowsByTab[activeTab]} series={lifecycleSeries} />
              <ModuleBreakdownTable
                rows={lifecycleRowsByTab[activeTab]}
                columns={lifecycleSeries}
                moduleColumnLabel={t.quickList.columnModule}
              />
            </div>
          </Card>
        </div>
      )}

      <TeacherQuickViewModal teacher={quickViewTeacher} onClose={() => setQuickViewId(null)} />
    </div>
  );
}
