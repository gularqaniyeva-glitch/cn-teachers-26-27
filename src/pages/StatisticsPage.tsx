import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { Card } from '../components/ui/Card';
import { Bar } from '../components/ui/Bar';
import { countByKey, getModuleStatsByGradeGroup } from '../utils/stats';
import { GRADE_GROUPS, LIFECYCLE_STATUSES, TRAINING_TYPES } from '../data/constants';
import type { GradeGroup } from '../types/teacher';
import { useT } from '../i18n/useLocaleStore';

const PALETTE = ['#5d00e9', '#059669', '#d97706', '#e11d48', '#0891b2', '#7c3aed'];

export function StatisticsPage() {
  const { teachers, loading, load } = useTeacherStore();
  const t = useT();
  const [expandedGroup, setExpandedGroup] = useState<GradeGroup | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">{t.common.loading}</p>;
  }

  const byTrainingType = countByKey(teachers, (te) => te.trainingType, t.trainingType, TRAINING_TYPES);
  const byLifecycle = countByKey(teachers, (te) => te.lifecycleStatus, { OLD: 'OLD', NEW: 'NEW' }, LIFECYCLE_STATUSES);
  const byPlatformStatus = countByKey(
    teachers,
    (te) => te.platformStatus,
    { entered: t.platformStatus.entered, not_entered: t.platformStatus.notEntered },
    ['entered', 'not_entered'],
  );
  const groupStats = getModuleStatsByGradeGroup(teachers, GRADE_GROUPS);
  const total = teachers.length || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t.statistics.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.statistics.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={t.statistics.byTrainingType} titleTooltip={t.statistics.tooltipTrainingType}>
          <div className="space-y-4">
            {byTrainingType.map((e, i) => (
              <Bar key={e.key} label={e.label} count={e.count} percent={e.percent} color={PALETTE[i % PALETTE.length]} />
            ))}
          </div>
        </Card>

        <Card title={t.statistics.byGradeGroup} titleTooltip={t.statistics.tooltipGradeGroup}>
          <div className="divide-y divide-slate-100">
            {groupStats.map((g, i) => {
              const isOpen = expandedGroup === g.group;
              const percent = Math.round((g.assigned / total) * 100);
              return (
                <div key={g.group} className="py-2">
                  <button
                    onClick={() => setExpandedGroup(isOpen ? null : g.group)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown size={15} className="shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight size={15} className="shrink-0 text-slate-400" />
                    )}
                    <div className="flex-1">
                      <Bar
                        label={t.gradeGroup[g.group]}
                        count={g.assigned}
                        percent={percent}
                        color={PALETTE[i % PALETTE.length]}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3 pl-9">
                      {g.modules.map((m) => (
                        <Bar
                          key={m.moduleId}
                          label={`${m.shortTitle} · ${t.statistics.passedOf} ${m.passed} ${t.common.of} ${m.started}`}
                          count={m.passed}
                          percent={m.passRate}
                          color={m.passRate >= 60 ? '#059669' : m.passRate >= 40 ? '#d97706' : '#e11d48'}
                        />
                      ))}
                    </div>
                  )}
                  {!isOpen && <p className="ml-6 mt-1 text-xs text-slate-400">{t.statistics.expandHint}</p>}
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
