import { ArrowDown, ArrowUp, ArrowUpDown, StickyNote } from 'lucide-react';
import type { Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import { getTeacherAverageScore } from '../../utils/stats';
import type { SortKey, SortState } from '../../utils/teacherFilters';
import { useT } from '../../i18n/useLocaleStore';

interface TeacherTableProps {
  teachers: Teacher[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (id: string) => void;
}

function scoreVariant(score: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score === null) return 'neutral';
  if (score >= 70) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

export function TeacherTable({
  teachers,
  sort,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
}: TeacherTableProps) {
  const t = useT();
  const allOnPageSelected = teachers.length > 0 && teachers.every((tt) => selectedIds.has(tt.id));
  const someOnPageSelected = teachers.some((tt) => selectedIds.has(tt.id));

  const columns: { key: SortKey; label: string }[] = [
    { key: 'fullName', label: t.columns.fullName },
    { key: 'school', label: t.columns.school },
    { key: 'district', label: t.columns.district },
    { key: 'gradeGroup', label: t.columns.gradeGroup },
    { key: 'trainingType', label: t.columns.trainingType },
    { key: 'lifecycleStatus', label: t.columns.lifecycleStatus },
    { key: 'platformStatus', label: t.columns.platformStatus },
    { key: 'averageScore', label: t.columns.result },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                }}
                onChange={onToggleSelectAll}
                className="accent-brand-600"
                aria-label={t.common.selectAllOnPage}
              />
            </th>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={() => onSort(col.key)}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  {col.label}
                  {sort.key === col.key ? (
                    sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                  ) : (
                    <ArrowUpDown size={13} className="text-slate-300" />
                  )}
                </button>
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {teachers.map((teacher) => {
            const score = getTeacherAverageScore(teacher);
            const isSelected = selectedIds.has(teacher.id);
            return (
              <tr
                key={teacher.id}
                onClick={() => onRowClick(teacher.id)}
                className={`cursor-pointer transition-colors hover:bg-brand-50/60 ${isSelected ? 'bg-brand-50/40' : ''}`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(teacher.id)}
                    className="accent-brand-600"
                    aria-label={teacher.fullName}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{teacher.fullName}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{teacher.school}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{teacher.district}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.gradeGroup[teacher.gradeGroup]}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.trainingType[teacher.trainingType]}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={teacher.lifecycleStatus === 'NEW' ? 'purple' : 'neutral'}>{teacher.lifecycleStatus}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={teacher.platformStatus === 'entered' ? 'success' : 'danger'} dot>
                    {teacher.platformStatus === 'entered' ? t.platformStatus.entered : t.platformStatus.notEntered}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={scoreVariant(score)}>{score === null ? t.common.noData : `${score}%`}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {teacher.note && <StickyNote size={15} aria-label={t.columns.note} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {teachers.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">{t.quickList.empty}</div>
      )}
    </div>
  );
}
