import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import type { GradeGroup, ModuleDefinition, Teacher } from '../../types/teacher';
import { MODULES } from '../../data/constants';
import { exportTeachersToCsv } from '../../utils/csvExport';
import { getEffectiveModuleStatus } from '../../utils/anomalies';
import type { DisplayModuleStatus } from '../../utils/anomalies';
import { Badge } from '../ui/Badge';
import { useT } from '../../i18n/useLocaleStore';
import type { Dict } from '../../i18n/translations';

interface ModuleQuickListPanelProps {
  teachers: Teacher[];
  gradeGroupOptions: GradeGroup[];
  onRowClick: (id: string) => void;
}

const STATUS_VARIANT = {
  passed: 'success',
  failed: 'danger',
  not_started: 'neutral',
  on_review: 'warning',
} as const;
const ALL_STATUSES: DisplayModuleStatus[] = ['passed', 'failed', 'not_started', 'on_review'];

function statusLabel(t: Dict, status: DisplayModuleStatus): string {
  if (status === 'not_started') return t.moduleStatus.notStarted;
  if (status === 'on_review') return t.moduleStatus.onReview;
  return t.moduleStatus[status];
}

type GradeGroupSelection = GradeGroup | 'all';

interface MatchedRow {
  teacher: Teacher;
  module: ModuleDefinition;
  status: DisplayModuleStatus;
  score: number;
}

export function ModuleQuickListPanel({ teachers, gradeGroupOptions, onRowClick }: ModuleQuickListPanelProps) {
  const t = useT();
  const canSelectAllGroups = gradeGroupOptions.length > 1;
  const [gradeGroupSelection, setGradeGroupSelection] = useState<GradeGroupSelection>(
    canSelectAllGroups ? 'all' : gradeGroupOptions[0],
  );
  // Пустой массив = "Все модули" (тот же принцип, что и у статусов ниже).
  const [selectedModuleIndices, setSelectedModuleIndices] = useState<number[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<DisplayModuleStatus[]>([]);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moduleDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(e.target as Node)) {
        setModuleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moduleDropdownOpen]);

  const activeGroups = gradeGroupSelection === 'all' ? gradeGroupOptions : [gradeGroupSelection];

  const moduleIndexOptions = useMemo(() => {
    const indices = new Set<number>();
    for (const m of MODULES) {
      if (activeGroups.includes(m.group)) indices.add(m.index);
    }
    return Array.from(indices).sort((a, b) => a - b);
  }, [activeGroups]);

  function toggleModule(index: number) {
    setSelectedModuleIndices((prev) => (prev.includes(index) ? prev.filter((n) => n !== index) : [...prev, index]));
  }

  function moduleSummaryLabel(): string {
    if (selectedModuleIndices.length === 0) return t.quickList.allModules;
    const sorted = [...selectedModuleIndices].sort((a, b) => a - b);
    if (sorted.length <= 3) return sorted.map((n) => `M${n}`).join(', ');
    return `${sorted
      .slice(0, 2)
      .map((n) => `M${n}`)
      .join(', ')} +${sorted.length - 2}`;
  }

  function toggleStatus(status: DisplayModuleStatus) {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }

  const matched = useMemo<MatchedRow[]>(() => {
    const rows: MatchedRow[] = [];
    for (const teacher of teachers) {
      if (!activeGroups.includes(teacher.gradeGroup)) continue;
      const modulesForTeacher = MODULES.filter(
        (m) => m.group === teacher.gradeGroup && (selectedModuleIndices.length === 0 || selectedModuleIndices.includes(m.index)),
      );
      for (const module of modulesForTeacher) {
        const result = teacher.moduleResults.find((r) => r.moduleId === module.id);
        if (!result) continue;
        const status = getEffectiveModuleStatus(teacher, module.id);
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) continue;
        rows.push({ teacher, module, status, score: result.score });
      }
    }
    rows.sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName) || a.module.index - b.module.index);
    return rows;
  }, [teachers, activeGroups, selectedModuleIndices, selectedStatuses]);

  const uniqueTeachers = useMemo(
    () => Array.from(new Map(matched.map((row) => [row.teacher.id, row.teacher])).values()),
    [matched],
  );

  function handleExport() {
    const moduleSuffix = selectedModuleIndices.length > 0 ? selectedModuleIndices.map((n) => `M${n}`).join('-') : 'all';
    exportTeachersToCsv(uniqueTeachers, t, `module-report-${moduleSuffix}-${activeGroups.join('-')}.csv`);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{t.quickList.title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{t.quickList.hint}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {canSelectAllGroups && (
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            {t.quickList.gradeGroupLabel}
            <select
              value={gradeGroupSelection}
              onChange={(e) => setGradeGroupSelection(e.target.value as GradeGroupSelection)}
              className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="all">
                {t.quickList.allGradeGroups} ({gradeGroupOptions.map((g) => t.gradeGroup[g]).join(', ')})
              </option>
              {gradeGroupOptions.map((g) => (
                <option key={g} value={g}>
                  {t.gradeGroup[g]}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          onClick={handleExport}
          disabled={uniqueTeachers.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
        >
          <Download size={15} />
          {t.quickList.exportButton}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-500" ref={moduleDropdownRef}>
        {t.quickList.moduleLabel}
        <div className="relative">
          <button
            onClick={() => setModuleDropdownOpen((v) => !v)}
            className="flex w-full min-w-[200px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            <span className="truncate">{moduleSummaryLabel()}</span>
            <ChevronDown size={14} className="shrink-0 text-slate-400" />
          </button>
          {moduleDropdownOpen && (
            <div className="absolute z-10 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedModuleIndices.length === 0}
                  onChange={() => setSelectedModuleIndices([])}
                  className="accent-brand-600"
                />
                {t.quickList.allModules}
              </label>
              <div className="my-1 border-t border-slate-100" />
              {moduleIndexOptions.map((n) => (
                <label
                  key={n}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedModuleIndices.includes(n)}
                    onChange={() => toggleModule(n)}
                    className="accent-brand-600"
                  />
                  M{n}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-500">
        {t.quickList.statusLabel}
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${
                selectedStatuses.includes(s)
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {statusLabel(t, s)}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {uniqueTeachers.length} {t.quickList.resultCount}
      </p>

      {matched.length === 0 ? (
        <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
          {t.quickList.empty}
        </p>
      ) : (
        <div className="mt-2 max-h-[480px] overflow-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="sticky top-0">
              <tr className="border-b border-slate-100 bg-slate-50/95 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">{t.columns.fullName}</th>
                <th className="px-3 py-2">{t.columns.school}</th>
                <th className="px-3 py-2">{t.columns.district}</th>
                <th className="px-3 py-2">{t.quickList.gradeGroupLabel}</th>
                <th className="px-3 py-2">{t.quickList.columnModule}</th>
                <th className="px-3 py-2">{t.filters.sectorSection}</th>
                <th className="px-3 py-2">{t.quickList.columnFormat}</th>
                <th className="px-3 py-2">{t.quickList.columnScore}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matched.map(({ teacher, module, status, score }) => (
                <tr
                  key={`${teacher.id}-${module.id}`}
                  onClick={() => onRowClick(teacher.id)}
                  className="cursor-pointer hover:bg-brand-50/60"
                >
                  <td className="px-3 py-2 font-medium text-brand-700 underline-offset-2 hover:underline whitespace-nowrap">
                    {teacher.fullName}
                  </td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{teacher.school}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{teacher.district}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.gradeGroup[teacher.gradeGroup]}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{module.shortTitle}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.language[teacher.language]}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.trainingType[teacher.trainingType]}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{score}%</span>
                      <Badge variant={STATUS_VARIANT[status]}>{statusLabel(t, status)}</Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
