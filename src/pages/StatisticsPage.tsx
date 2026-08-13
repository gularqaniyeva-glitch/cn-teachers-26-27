import { useEffect } from 'react';
import { useTeacherStore } from '../store/useTeacherStore';
import { Card } from '../components/ui/Card';
import { Bar } from '../components/ui/Bar';
import { countByKey, getModuleStats } from '../utils/stats';
import {
  GRADE_GROUP_LABELS,
  GRADE_GROUPS,
  LIFECYCLE_STATUSES,
  PLATFORM_STATUS_LABELS,
  TRAINING_TYPE_LABELS,
  TRAINING_TYPES,
} from '../data/constants';

const PALETTE = ['#5d00e9', '#059669', '#d97706', '#e11d48', '#0891b2', '#7c3aed'];

export function StatisticsPage() {
  const { teachers, loading, load } = useTeacherStore();

  useEffect(() => {
    load();
  }, [load]);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">Загрузка данных…</p>;
  }

  const byTrainingType = countByKey(teachers, (t) => t.trainingType, TRAINING_TYPE_LABELS, TRAINING_TYPES);
  const byGradeGroup = countByKey(teachers, (t) => t.gradeGroup, GRADE_GROUP_LABELS, GRADE_GROUPS);
  const byLifecycle = countByKey(
    teachers,
    (t) => t.lifecycleStatus,
    { OLD: 'OLD', NEW: 'NEW' },
    LIFECYCLE_STATUSES,
  );
  const byPlatformStatus = countByKey(
    teachers,
    (t) => t.platformStatus,
    PLATFORM_STATUS_LABELS,
    ['entered', 'not_entered'],
  );
  const moduleStats = getModuleStats(teachers);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Статистика</h1>
        <p className="mt-1 text-sm text-slate-500">Распределение учителей по ключевым признакам</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="По типу обучения">
          <div className="space-y-4">
            {byTrainingType.map((e, i) => (
              <Bar key={e.key} label={e.label} count={e.count} percent={e.percent} color={PALETTE[i % PALETTE.length]} />
            ))}
          </div>
        </Card>

        <Card title="По классам">
          <div className="space-y-4">
            {byGradeGroup.map((e, i) => (
              <Bar key={e.key} label={e.label} count={e.count} percent={e.percent} color={PALETTE[i % PALETTE.length]} />
            ))}
          </div>
        </Card>

        <Card title="По статусу OLD / NEW">
          <div className="space-y-4">
            {byLifecycle.map((e, i) => (
              <Bar key={e.key} label={e.label} count={e.count} percent={e.percent} color={PALETTE[i % PALETTE.length]} />
            ))}
          </div>
        </Card>

        <Card title="По статусу платформы">
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

        <Card title="По результатам модулей (доля прошедших)" className="lg:col-span-2">
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
    </div>
  );
}
