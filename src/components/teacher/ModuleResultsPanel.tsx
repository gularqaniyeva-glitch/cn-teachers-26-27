import type { Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { getApplicableModules } from '../../utils/stats';
import { getEffectiveModuleStatus, isGroupAnomalyRow } from '../../utils/anomalies';
import { useGroupAnomalySet } from '../../hooks/useGroupAnomalySet';
import { useT } from '../../i18n/useLocaleStore';

interface ModuleResultsPanelProps {
  teacher: Teacher;
}

const STATUS_VARIANT = {
  passed: 'success',
  failed: 'danger',
  not_started: 'neutral',
  on_review: 'warning',
  old_teacher: 'neutral',
} as const;
const STATUS_COLOR = {
  passed: '#059669',
  failed: '#e11d48',
  not_started: '#cbd5e1',
  on_review: '#d97706',
  old_teacher: '#94a3b8',
} as const;

export function ModuleResultsPanel({ teacher }: ModuleResultsPanelProps) {
  const t = useT();
  const modules = getApplicableModules(teacher);
  const groupAnomalySet = useGroupAnomalySet();

  // У "двухпараллельных" учителей (2–4 И 5–9 одновременно) одинаковый номер
  // модуля (M3–M6) встречается ДВАЖДЫ — это разные назначения с разными
  // баллами (2-4-M3 и 5-9-M3), а не дубликат одной и той же строки. Если
  // не уточнить параллель в подписи, обе строки выглядят как "M3"/"M3" и
  // неотличимы друг от друга.
  const shortTitleCounts = new Map<string, number>();
  for (const m of modules) shortTitleCounts.set(m.shortTitle, (shortTitleCounts.get(m.shortTitle) ?? 0) + 1);

  return (
    <div className="divide-y divide-slate-100">
      {modules.map((module) => {
        const result = teacher.moduleResults.find((r) => r.moduleId === module.id);
        const status = getEffectiveModuleStatus(teacher, module.id);
        const groupFlagged = isGroupAnomalyRow(groupAnomalySet, teacher, module.id);
        const label =
          status === 'not_started'
            ? t.moduleStatus.notStarted
            : status === 'on_review'
              ? t.moduleStatus.onReview
              : status === 'old_teacher'
                ? t.moduleStatus.oldTeacher
                : t.moduleStatus[status];
        const isAmbiguous = (shortTitleCounts.get(module.shortTitle) ?? 0) > 1;
        const moduleTitle = isAmbiguous ? `${module.shortTitle} (${t.gradeGroup[module.group]})` : module.shortTitle;
        return (
          <div key={module.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{moduleTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${result?.score ?? 0}%`, backgroundColor: groupFlagged ? '#d97706' : STATUS_COLOR[status] }}
                />
              </div>
              <span className="w-10 text-right text-sm text-slate-600">{result?.score ?? 0}%</span>
              {groupFlagged ? (
                <Badge variant="warning">{t.anomalies.groupRowLabel}</Badge>
              ) : (
                <Badge variant={STATUS_VARIANT[status]}>{label}</Badge>
              )}
              {(status === 'on_review' || groupFlagged) && (
                <Tooltip text={groupFlagged ? t.anomalies.groupRowLabel : t.anomalies.tooltipText} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
