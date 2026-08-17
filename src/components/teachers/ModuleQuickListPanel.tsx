import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import type { GradeGroup, ModuleDefinition, Teacher } from '../../types/teacher';
import { MODULES } from '../../data/constants';
import { exportTeachersToCsv } from '../../utils/csvExport';
import { getApplicableModules, getTeacherOverallStats } from '../../utils/stats';
import { getEffectiveModuleStatus, isGroupAnomalyRow } from '../../utils/anomalies';
import type { DisplayModuleStatus } from '../../utils/anomalies';
import { useGroupAnomalySet } from '../../hooks/useGroupAnomalySet';
import { Badge } from '../ui/Badge';
import { Pagination } from './Pagination';
import { useT } from '../../i18n/useLocaleStore';
import type { Dict } from '../../i18n/translations';

interface ModuleQuickListPanelProps {
  teachers: Teacher[];
  gradeGroupOptions: GradeGroup[];
  onRowClick: (id: string) => void;
}

const STATUS_DOT_COLOR = { passed: '#059669', failed: '#e11d48', not_started: '#94a3b8', on_review: '#d97706' } as const;
const ALL_STATUSES: DisplayModuleStatus[] = ['passed', 'failed', 'not_started', 'on_review'];
const MAX_BADGES_PER_ROW = 5;

function statusLabel(t: Dict, status: DisplayModuleStatus): string {
  if (status === 'not_started') return t.moduleStatus.notStarted;
  if (status === 'on_review') return t.moduleStatus.onReview;
  return t.moduleStatus[status];
}

/** Сортировка "M9" перед "M9-2" перед "M10" — обычная сортировка строк тут не годится */
function moduleSortKey(shortTitle: string): number {
  return parseFloat(shortTitle.replace('M', '').replace('-2', '.5'));
}

type GradeGroupSelection = GradeGroup | 'all';

interface ModuleBadge {
  module: ModuleDefinition;
  status: DisplayModuleStatus;
  score: number;
}

interface MatchedRow {
  teacher: Teacher;
  badges: ModuleBadge[];
}

export function ModuleQuickListPanel({ teachers, gradeGroupOptions, onRowClick }: ModuleQuickListPanelProps) {
  const t = useT();
  const groupAnomalySet = useGroupAnomalySet();
  const canSelectAllGroups = gradeGroupOptions.length > 1;
  const [gradeGroupSelection, setGradeGroupSelection] = useState<GradeGroupSelection>(
    canSelectAllGroups ? 'all' : gradeGroupOptions[0],
  );
  // Пустой массив = "Все модули" (тот же принцип, что и у статусов ниже).
  const [selectedModuleTitles, setSelectedModuleTitles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<DisplayModuleStatus[]>([]);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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

  const moduleTitleOptions = useMemo(() => {
    const titles = new Set<string>();
    for (const m of MODULES) {
      if (activeGroups.includes(m.group)) titles.add(m.shortTitle);
    }
    return Array.from(titles).sort((a, b) => moduleSortKey(a) - moduleSortKey(b));
  }, [activeGroups]);

  function toggleModule(shortTitle: string) {
    setSelectedModuleTitles((prev) =>
      prev.includes(shortTitle) ? prev.filter((s) => s !== shortTitle) : [...prev, shortTitle],
    );
    setPage(1);
  }

  function moduleSummaryLabel(): string {
    if (selectedModuleTitles.length === 0) return t.quickList.allModules;
    const sorted = [...selectedModuleTitles].sort((a, b) => moduleSortKey(a) - moduleSortKey(b));
    if (sorted.length <= 3) return sorted.join(', ');
    return `${sorted.slice(0, 2).join(', ')} +${sorted.length - 2}`;
  }

  function toggleStatus(status: DisplayModuleStatus) {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
    setPage(1);
  }

  // ВАЖНО: одна строка результата = один учитель, независимо от того,
  // сколько модулей выбрано. Раньше здесь на каждую пару "учитель+модуль"
  // создавалась отдельная строка — на реальных ~6000 учителей это давало
  // десятки тысяч строк в DOM и вешало браузер.
  const matched = useMemo<MatchedRow[]>(() => {
    const rows: MatchedRow[] = [];
    for (const teacher of teachers) {
      if (!activeGroups.includes(teacher.gradeGroup)) continue;

      const relevantModules = getApplicableModules(teacher).filter(
        (m) => selectedModuleTitles.length === 0 || selectedModuleTitles.includes(m.shortTitle),
      );
      if (relevantModules.length === 0) continue;

      const badges: ModuleBadge[] = relevantModules.map((module) => {
        const result = teacher.moduleResults.find((r) => r.moduleId === module.id);
        const groupFlagged = isGroupAnomalyRow(groupAnomalySet, teacher, module.id);
        const status = groupFlagged ? 'on_review' : getEffectiveModuleStatus(teacher, module.id);
        return { module, status, score: result?.score ?? 0 };
      });

      const matchesStatus = selectedStatuses.length === 0 || badges.some((b) => selectedStatuses.includes(b.status));
      if (!matchesStatus) continue;

      rows.push({ teacher, badges });
    }
    rows.sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName));
    return rows;
  }, [teachers, activeGroups, selectedModuleTitles, selectedStatuses, groupAnomalySet]);

  const totalPages = Math.max(1, Math.ceil(matched.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = matched.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleExport() {
    const moduleSuffix = selectedModuleTitles.length > 0 ? selectedModuleTitles.join('-') : 'all';
    exportTeachersToCsv(
      matched.map((row) => row.teacher),
      t,
      `module-report-${moduleSuffix}-${activeGroups.join('-')}.csv`,
    );
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
              onChange={(e) => {
                setGradeGroupSelection(e.target.value as GradeGroupSelection);
                setPage(1);
              }}
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

        <div className="flex flex-col gap-1 text-xs font-medium text-slate-500" ref={moduleDropdownRef}>
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
                    checked={selectedModuleTitles.length === 0}
                    onChange={() => {
                      setSelectedModuleTitles([]);
                      setPage(1);
                    }}
                    className="accent-brand-600"
                  />
                  {t.quickList.allModules}
                </label>
                <div className="my-1 border-t border-slate-100" />
                {moduleTitleOptions.map((title) => (
                  <label
                    key={title}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModuleTitles.includes(title)}
                      onChange={() => toggleModule(title)}
                      className="accent-brand-600"
                    />
                    {title}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={matched.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
        >
          <Download size={15} />
          {t.quickList.exportButton}
        </button>
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
        {matched.length} {t.quickList.resultCount}
      </p>

      {matched.length === 0 ? (
        <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
          {t.quickList.empty}
        </p>
      ) : (
        <>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/95 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">{t.columns.fullName}</th>
                  <th className="px-3 py-2">{t.columns.school}</th>
                  <th className="px-3 py-2">{t.columns.district}</th>
                  <th className="px-3 py-2">{t.quickList.gradeGroupLabel}</th>
                  <th className="px-3 py-2">{t.filters.sectorSection}</th>
                  <th className="px-3 py-2">{t.quickList.columnModule}</th>
                  <th className="px-3 py-2">{t.columns.result}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map(({ teacher, badges }) => {
                  const overall = getTeacherOverallStats(teacher);
                  return (
                    <tr
                      key={teacher.id}
                      onClick={() => onRowClick(teacher.id)}
                      className="cursor-pointer hover:bg-brand-50/60"
                    >
                      <td className="px-3 py-2 font-medium text-brand-700 underline-offset-2 hover:underline whitespace-nowrap">
                        {teacher.fullName}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{teacher.school}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{teacher.district}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.gradeGroup[teacher.gradeGroup]}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.language[teacher.language]}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {badges.slice(0, MAX_BADGES_PER_ROW).map((b) => (
                            <span
                              key={b.module.id}
                              title={`${b.module.shortTitle}: ${statusLabel(t, b.status)} (${b.score}%)`}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: STATUS_DOT_COLOR[b.status] }}
                              />
                              {b.module.shortTitle}
                            </span>
                          ))}
                          {badges.length > MAX_BADGES_PER_ROW && (
                            <span className="text-[11px] text-slate-400">+{badges.length - MAX_BADGES_PER_ROW}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge variant={overall.percent >= 70 ? 'success' : overall.percent >= 50 ? 'warning' : 'danger'}>
                          {overall.percent}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={matched.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
