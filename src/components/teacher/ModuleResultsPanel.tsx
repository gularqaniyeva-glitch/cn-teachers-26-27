import type { Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { getApplicableModules } from '../../utils/stats';
import { getEffectiveModuleStatus } from '../../utils/anomalies';
import { useT } from '../../i18n/useLocaleStore';

interface ModuleResultsPanelProps {
  teacher: Teacher;
}

const STATUS_VARIANT = {
  passed: 'success',
  failed: 'danger',
  not_started: 'neutral',
  on_review: 'warning',
} as const;
const STATUS_COLOR = { passed: '#059669', failed: '#e11d48', not_started: '#cbd5e1', on_review: '#d97706' } as const;

export function ModuleResultsPanel({ teacher }: ModuleResultsPanelProps) {
  const t = useT();
  const modules = getApplicableModules(teacher);

  return (
    <div className="divide-y divide-slate-100">
      {modules.map((module) => {
        const result = teacher.moduleResults.find((r) => r.moduleId === module.id);
        const status = getEffectiveModuleStatus(teacher, module.id);
        const label =
          status === 'not_started'
            ? t.moduleStatus.notStarted
            : status === 'on_review'
              ? t.moduleStatus.onReview
              : t.moduleStatus[status];
        return (
          <div key={module.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{module.shortTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${result?.score ?? 0}%`, backgroundColor: STATUS_COLOR[status] }}
                />
              </div>
              <span className="w-10 text-right text-sm text-slate-600">{result?.score ?? 0}%</span>
              <Badge variant={STATUS_VARIANT[status]}>{label}</Badge>
              {status === 'on_review' && <Tooltip text={t.anomalies.tooltipText} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
