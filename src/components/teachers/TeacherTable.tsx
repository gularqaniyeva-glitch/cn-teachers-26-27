import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Eye, StickyNote, Search } from 'lucide-react';
import type { Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import { getTeacherAverageScore, getTeacherOverallStats } from '../../utils/stats';
import { hasAnomaly } from '../../utils/anomalies';
import type { SortKey, SortState } from '../../utils/teacherFilters';
import { useT } from '../../i18n/useLocaleStore';
import type { Dict } from '../../i18n/translations';

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

interface ColumnDef {
  key: string;
  sortKey?: SortKey;
  defaultVisible: boolean;
  alwaysVisible?: boolean;
  label: (t: Dict) => string;
}

// По умолчанию видны только 5 базовых колонок (ФИО, Школа, Район, Тип
// обучения, Результат) — остальные включаются по кнопке "Столбцы 👁️". На
// реальных ~6000 строках меньше колонок = меньше DOM-узлов и быстрее рендер.
const ALL_COLUMNS: ColumnDef[] = [
  { key: 'fullName', sortKey: 'fullName', alwaysVisible: true, defaultVisible: true, label: (t) => t.columns.fullName },
  { key: 'school', sortKey: 'school', defaultVisible: true, label: (t) => t.columns.school },
  { key: 'district', sortKey: 'district', defaultVisible: true, label: (t) => t.columns.district },
  { key: 'trainingType', sortKey: 'trainingType', defaultVisible: true, label: (t) => t.columns.trainingType },
  { key: 'result', sortKey: 'averageScore', defaultVisible: true, label: (t) => t.columns.result },
  { key: 'sector', defaultVisible: false, label: (t) => t.filters.sectorSection },
  { key: 'gradeGroup', sortKey: 'gradeGroup', defaultVisible: false, label: (t) => t.columns.gradeGroup },
  { key: 'lifecycleStatus', sortKey: 'lifecycleStatus', defaultVisible: false, label: (t) => t.columns.lifecycleStatus },
  { key: 'platformStatus', sortKey: 'platformStatus', defaultVisible: false, label: (t) => t.columns.platformStatus },
];

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

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)),
  );
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setColumnMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnMenuOpen]);

  function toggleColumn(key: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const columns = ALL_COLUMNS.filter((c) => c.alwaysVisible || visibleKeys.has(c.key));

  function renderCell(col: ColumnDef, teacher: Teacher) {
    switch (col.key) {
      case 'fullName':
        return <span className="font-medium text-slate-900">{teacher.fullName}</span>;
      case 'school':
        return teacher.school;
      case 'district':
        return teacher.district;
      case 'sector':
        return t.language[teacher.language];
      case 'gradeGroup':
        return t.gradeGroup[teacher.gradeGroup];
      case 'trainingType':
        return t.trainingType[teacher.trainingType];
      case 'lifecycleStatus':
        return <Badge variant={teacher.lifecycleStatus === 'NEW' ? 'purple' : 'neutral'}>{teacher.lifecycleStatus}</Badge>;
      case 'platformStatus':
        return (
          <Badge variant={teacher.platformStatus === 'entered' ? 'success' : 'danger'} dot>
            {teacher.platformStatus === 'entered' ? t.platformStatus.entered : t.platformStatus.notEntered}
          </Badge>
        );
      case 'result': {
        const score = getTeacherAverageScore(teacher);
        const overallStats = getTeacherOverallStats(teacher);
        const resultHint =
          overallStats.assigned > 0
            ? t.deadlines.resultHintAllModules
                .replace('{passed}', String(overallStats.passed))
                .replace('{assigned}', String(overallStats.assigned))
            : null;
        return (
          <div className="flex flex-col gap-0.5" title={resultHint ?? undefined}>
            <Badge variant={scoreVariant(score)}>{score === null ? t.common.noData : `${score}%`}</Badge>
            {resultHint && <span className="text-[11px] text-slate-400">({resultHint})</span>}
          </div>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="relative" ref={columnMenuRef}>
          <button
            onClick={() => setColumnMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Eye size={15} />
            {t.common.columnsToggle}
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {columnMenuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
              {ALL_COLUMNS.filter((c) => !c.alwaysVisible).map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={visibleKeys.has(c.key)}
                    onChange={() => toggleColumn(c.key)}
                    className="accent-brand-600"
                  />
                  {c.label(t)}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
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
                  {col.sortKey ? (
                    <button
                      onClick={() => onSort(col.sortKey!)}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      {col.label(t)}
                      {sort.key === col.sortKey ? (
                        sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={13} className="text-slate-300" />
                      )}
                    </button>
                  ) : (
                    col.label(t)
                  )}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map((teacher) => {
              const isSelected = selectedIds.has(teacher.id);
              const flagged = hasAnomaly(teacher);
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
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {renderCell(col, teacher)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {teacher.note && <StickyNote size={15} aria-label={t.columns.note} />}
                      {flagged && (
                        <span title={t.anomalies.tooltipText} className="text-amber-500">
                          <Search size={15} aria-label={t.moduleStatus.onReview} />
                        </span>
                      )}
                    </div>
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
    </div>
  );
}
