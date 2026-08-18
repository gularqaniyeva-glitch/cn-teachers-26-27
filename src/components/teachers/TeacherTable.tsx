import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Eye, StickyNote, Search } from 'lucide-react';
import type { GradeGroup, Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import { NoTranslate } from '../ui/NoTranslate';
import { LmsLink } from '../ui/LmsLink';
import { ModuleScoreCell } from './ModuleScoreCell';
import { formatAssignedClassesLabel, getTeacherAverageScore, getTeacherOverallStats } from '../../utils/stats';
import { hasAnomaly } from '../../utils/anomalies';
import type { SortKey, SortState } from '../../utils/teacherFilters';
import { findModuleResultForColumn, getModuleColumnsForGroups } from '../../data/constants';
import { TEACHER_TABLE_COLUMNS, type TeacherColumnDef } from './teacherTableColumns';
import { useT } from '../../i18n/useLocaleStore';

interface TeacherTableProps {
  teachers: Teacher[];
  gradeGroups: GradeGroup[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (id: string) => void;
  visibleKeys: Set<string>;
  onToggleColumn: (key: string) => void;
}

function scoreVariant(score: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score === null) return 'neutral';
  if (score >= 70) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

export function TeacherTable({
  teachers,
  gradeGroups,
  sort,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  visibleKeys,
  onToggleColumn,
}: TeacherTableProps) {
  const t = useT();
  const allOnPageSelected = teachers.length > 0 && teachers.every((tt) => selectedIds.has(tt.id));
  const someOnPageSelected = teachers.some((tt) => selectedIds.has(tt.id));

  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  const showModuleColumns = visibleKeys.has('moduleColumns');
  const moduleColumns = useMemo(
    () => (showModuleColumns ? getModuleColumnsForGroups(gradeGroups) : []),
    [showModuleColumns, gradeGroups],
  );

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

  const columns = TEACHER_TABLE_COLUMNS.filter((c) => c.alwaysVisible || visibleKeys.has(c.key));

  function renderCell(col: TeacherColumnDef, teacher: Teacher) {
    switch (col.key) {
      case 'fullName':
        return (
          <span className="font-medium text-slate-900">
            <NoTranslate>{teacher.fullName}</NoTranslate>
          </span>
        );
      case 'school':
        return <NoTranslate>{teacher.school}</NoTranslate>;
      case 'district':
        return teacher.district;
      case 'classesTaught':
        return formatAssignedClassesLabel(teacher, t.gradeGroup);
      case 'lmsId':
        return <LmsLink lmsId={teacher.lmsId} />;
      case 'fin':
        return teacher.fin ? <NoTranslate>{teacher.fin}</NoTranslate> : t.common.noData;
      case 'phone':
        return teacher.phone || t.common.noData;
      case 'startYear':
        return teacher.startYear || t.common.noData;
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
      case 'averageScore': {
        const score = getTeacherAverageScore(teacher);
        return <Badge variant={scoreVariant(score)}>{score === null ? t.common.noData : `${score}%`}</Badge>;
      }
      case 'result': {
        const overallStats = getTeacherOverallStats(teacher);
        if (overallStats.assigned === 0) return <Badge variant="neutral">{t.common.noData}</Badge>;
        const label = t.deadlines.resultHintAllModules
          .replace('{passed}', String(overallStats.passed))
          .replace('{assigned}', String(overallStats.assigned));
        return (
          <Badge variant={overallStats.percent >= 70 ? 'success' : overallStats.percent >= 50 ? 'warning' : 'danger'}>
            {label}
          </Badge>
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
              {TEACHER_TABLE_COLUMNS.filter((c) => !c.alwaysVisible).map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={visibleKeys.has(c.key)}
                    onChange={() => onToggleColumn(c.key)}
                    className="accent-brand-600"
                  />
                  {c.label(t)}
                </label>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={showModuleColumns}
                  onChange={() => onToggleColumn('moduleColumns')}
                  className="accent-brand-600"
                />
                {t.columns.moduleColumns}
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="w-8 px-2.5 py-2">
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
                <th key={col.key} className="px-2.5 py-2 whitespace-nowrap">
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
              {showModuleColumns &&
                moduleColumns.map((col) => (
                  <th key={col.key} className="w-9 min-w-[2.25rem] px-0.5 py-2 text-center normal-case">
                    {col.label}
                  </th>
                ))}
              <th className="px-2.5 py-2" />
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
                  <td className="px-2.5 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(teacher.id)}
                      className="accent-brand-600"
                      aria-label={teacher.fullName}
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-2.5 py-1 whitespace-nowrap text-slate-600">
                      {renderCell(col, teacher)}
                    </td>
                  ))}
                  {showModuleColumns &&
                    moduleColumns.map((col) => {
                      const result = findModuleResultForColumn(teacher.moduleResults, col);
                      return (
                        <td key={col.key} className="px-0.5 py-1 text-center">
                          <ModuleScoreCell result={result} label={col.label} />
                        </td>
                      );
                    })}
                  <td className="px-2.5 py-1 text-slate-400">
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
