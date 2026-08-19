import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Eye } from 'lucide-react';
import type { GradeGroup, Teacher } from '../../types/teacher';
import {
  findModuleResultForColumn,
  getModuleColumnsForGroups,
  getUnifiedModuleResult,
  getUnifiedModuleShortTitles,
  type ModuleColumn,
} from '../../data/constants';
import { exportTeachersToCsv } from '../../utils/csvExport';
import { formatAssignedClassesLabel, getTeacherOverallStats } from '../../utils/stats';
import { getEffectiveModuleStatus, isGroupAnomalyRow } from '../../utils/anomalies';
import type { DisplayModuleStatus } from '../../utils/anomalies';
import { useGroupAnomalySet } from '../../hooks/useGroupAnomalySet';
import { Badge } from '../ui/Badge';
import { NoTranslate } from '../ui/NoTranslate';
import { Pagination } from './Pagination';
import { ExportMenu } from './ExportMenu';
import { ModuleScoreCell } from './ModuleScoreCell';
import { useT } from '../../i18n/useLocaleStore';
import type { Dict } from '../../i18n/translations';

interface TableColumnDef {
  key: string;
  defaultVisible: boolean;
  alwaysVisible?: boolean;
  label: (t: Dict) => string;
}

// По умолчанию видны ФИО, Школа, Район, Назначенные классы, Тип обучения и
// Результат — как и в таблице "Все учителя". Параллель и Сектор скрыты по
// умолчанию, но доступны через "Столбцы 👁️".
const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'fullName', alwaysVisible: true, defaultVisible: true, label: (t) => t.columns.fullName },
  { key: 'school', defaultVisible: true, label: (t) => t.columns.school },
  { key: 'district', defaultVisible: true, label: (t) => t.columns.district },
  { key: 'classesTaught', defaultVisible: true, label: (t) => t.detail.fields.classesTaught },
  { key: 'trainingType', defaultVisible: true, label: (t) => t.columns.trainingType },
  { key: 'gradeGroup', defaultVisible: false, label: (t) => t.quickList.gradeGroupLabel },
  { key: 'sector', defaultVisible: false, label: (t) => t.filters.sectorSection },
  { key: 'result', defaultVisible: true, label: (t) => t.columns.result },
];

interface ModuleQuickListPanelProps {
  teachers: Teacher[];
  gradeGroupOptions: GradeGroup[];
  onRowClick: (id: string) => void;
}

const STATUS_DOT_COLOR = {
  passed: '#059669',
  failed: '#e11d48',
  not_started: '#94a3b8',
  on_review: '#d97706',
  old_teacher: '#94a3b8',
} as const;
const ALL_STATUSES: DisplayModuleStatus[] = ['passed', 'failed', 'not_started', 'old_teacher', 'on_review'];

function statusLabel(t: Dict, status: DisplayModuleStatus): string {
  if (status === 'not_started') return t.moduleStatus.notStarted;
  if (status === 'on_review') return t.moduleStatus.onReview;
  if (status === 'old_teacher') return t.moduleStatus.oldTeacher;
  return t.moduleStatus[status];
}

type GradeGroupSelection = GradeGroup | 'all';

interface ModuleBadge {
  column: ModuleColumn;
  moduleId: string;
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
  // Хранит НОМЕРА модулей (shortTitle, напр. "M6"), а не ключи колонок —
  // выбор одного номера "раскрывает" сразу обе колонки параллели, если
  // этот номер неоднозначен (M3–M6 есть и в 2–4, и в 5–9 одновременно).
  const [selectedModuleNumbers, setSelectedModuleNumbers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<DisplayModuleStatus[]>([]);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(TABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)),
  );
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

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

  const columns = TABLE_COLUMNS.filter((c) => c.alwaysVisible || visibleKeys.has(c.key));

  const activeGroups = gradeGroupSelection === 'all' ? gradeGroupOptions : [gradeGroupSelection];

  // Полный список колонок модулей для активных параллелей — уже в верном
  // порядке и с разведёнными по параллели дубликатами номеров (M3-M6).
  const moduleColumnOptions = useMemo(() => getModuleColumnsForGroups(activeGroups), [activeGroups]);

  // Для выбора в дропдауне — один пункт на номер модуля (без дублей вроде
  // "M6 (2–4)"/"M6 (5–9)"), в том же порядке, что и moduleColumnOptions.
  const moduleNumberOptions = useMemo(() => {
    const seen = new Set<string>();
    const numbers: string[] = [];
    for (const col of moduleColumnOptions) {
      if (seen.has(col.shortTitle)) continue;
      seen.add(col.shortTitle);
      numbers.push(col.shortTitle);
    }
    return numbers;
  }, [moduleColumnOptions]);

  // Без явного выбора модуля ("Все модули") показываем ЕДИНЫЕ колонки
  // M1..M13 — без дублей "M3 (2–4)"/"M3 (5–9)"; для каждого учителя
  // подтягивается результат его основной параллели. Разведение на две
  // колонки параллели происходит ТОЛЬКО при явном выборе конкретного
  // номера модуля в фильтре — тогда нужно сравнить обе параллели сразу.
  const isUnifiedView = selectedModuleNumbers.length === 0;

  // Столбцы, которые реально рисуются в таблице. Это НЕ рендер
  // "учитель×модуль" отдельными строками (та ошибка уже исправлена раньше)
  // — здесь всегда 1 строка = 1 учитель, просто с несколькими узкими
  // колонками вместо одной.
  const displayedModuleColumns = useMemo<ModuleColumn[]>(() => {
    if (isUnifiedView) {
      return getUnifiedModuleShortTitles(activeGroups).map((title) => ({
        key: title,
        shortTitle: title,
        label: title,
        moduleIds: [],
      }));
    }
    return moduleColumnOptions.filter((c) => selectedModuleNumbers.includes(c.shortTitle));
  }, [isUnifiedView, activeGroups, selectedModuleNumbers, moduleColumnOptions]);

  function toggleModule(shortTitle: string) {
    setSelectedModuleNumbers((prev) =>
      prev.includes(shortTitle) ? prev.filter((s) => s !== shortTitle) : [...prev, shortTitle],
    );
    setPage(1);
  }

  function moduleSummaryLabel(): string {
    if (selectedModuleNumbers.length === 0) return t.quickList.allModules;
    if (selectedModuleNumbers.length <= 3) return selectedModuleNumbers.join(', ');
    return `${selectedModuleNumbers.slice(0, 2).join(', ')} +${selectedModuleNumbers.length - 2}`;
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

      const badges: ModuleBadge[] = [];
      for (const column of displayedModuleColumns) {
        const result = isUnifiedView
          ? getUnifiedModuleResult(teacher, teacher.moduleResults, column.shortTitle)
          : findModuleResultForColumn(teacher.moduleResults, column);
        if (!result) continue;
        const groupFlagged = isGroupAnomalyRow(groupAnomalySet, teacher, result.moduleId);
        const status = groupFlagged ? 'on_review' : getEffectiveModuleStatus(teacher, result.moduleId);
        badges.push({ column, moduleId: result.moduleId, status, score: result.score });
      }
      if (badges.length === 0) continue;

      const matchesStatus = selectedStatuses.length === 0 || badges.some((b) => selectedStatuses.includes(b.status));
      if (!matchesStatus) continue;

      rows.push({ teacher, badges });
    }
    rows.sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName));
    return rows;
  }, [teachers, activeGroups, isUnifiedView, displayedModuleColumns, selectedStatuses, groupAnomalySet]);

  const totalPages = Math.max(1, Math.ceil(matched.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = matched.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleExport(keys: Set<string>) {
    const moduleSuffix = selectedModuleNumbers.length > 0 ? selectedModuleNumbers.join('-') : 'all';
    exportTeachersToCsv(
      matched.map((row) => row.teacher),
      t,
      keys,
      `module-report-${moduleSuffix}-${activeGroups.join('-')}.csv`,
    );
  }

  function renderCell(col: TableColumnDef, teacher: Teacher) {
    switch (col.key) {
      case 'fullName':
        return <NoTranslate>{teacher.fullName}</NoTranslate>;
      case 'school':
        return <NoTranslate>{teacher.school}</NoTranslate>;
      case 'district':
        return teacher.district;
      case 'classesTaught':
        return teacher.hasAssignedClass ? (
          formatAssignedClassesLabel(teacher, t.gradeGroup, t.common.classNotAssigned)
        ) : (
          <Badge variant="neutral">{t.common.classNotAssigned}</Badge>
        );
      case 'trainingType':
        return t.trainingType[teacher.trainingType];
      case 'gradeGroup':
        return t.gradeGroup[teacher.gradeGroup];
      case 'sector':
        return t.language[teacher.language];
      default:
        return null;
    }
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
                    checked={selectedModuleNumbers.length === 0}
                    onChange={() => {
                      setSelectedModuleNumbers([]);
                      setPage(1);
                    }}
                    className="accent-brand-600"
                  />
                  {t.quickList.allModules}
                </label>
                <div className="my-1 border-t border-slate-100" />
                {moduleNumberOptions.map((number) => (
                  <label
                    key={number}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModuleNumbers.includes(number)}
                      onChange={() => toggleModule(number)}
                      className="accent-brand-600"
                    />
                    {number}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
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
                {TABLE_COLUMNS.filter((c) => !c.alwaysVisible).map((c) => (
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

          <ExportMenu
            buttonLabel={t.quickList.exportButton}
            disabled={matched.length === 0}
            defaultCheckedKeys={new Set([...visibleKeys, 'modules'])}
            onExport={handleExport}
          />
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
        {matched.length} {t.quickList.resultCount}
      </p>

      {matched.length === 0 ? (
        <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
          {t.quickList.empty}
        </p>
      ) : (
        <>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/95 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {columns
                    .filter((c) => c.key !== 'result')
                    .map((col) => (
                      <th key={col.key} className="px-2 py-1.5 whitespace-nowrap">
                        {col.label(t)}
                      </th>
                    ))}
                  {displayedModuleColumns.map((col) => (
                    <th key={col.key} className="w-9 min-w-[2.25rem] px-0.5 py-1.5 text-center normal-case">
                      {col.label}
                    </th>
                  ))}
                  {visibleKeys.has('result') && <th className="px-2 py-1.5">{t.columns.result}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map(({ teacher, badges }) => {
                  const overall = getTeacherOverallStats(teacher);
                  const badgeByColKey = new Map(badges.map((b) => [b.column.key, b]));
                  return (
                    <tr
                      key={teacher.id}
                      onClick={() => onRowClick(teacher.id)}
                      className="cursor-pointer hover:bg-brand-50/60"
                    >
                      {columns
                        .filter((c) => c.key !== 'result')
                        .map((col) =>
                          col.key === 'fullName' ? (
                            <td
                              key={col.key}
                              className="px-2 py-1 font-medium text-brand-700 underline-offset-2 hover:underline whitespace-nowrap"
                            >
                              <NoTranslate>{teacher.fullName}</NoTranslate>
                            </td>
                          ) : (
                            <td key={col.key} className="px-2 py-1 text-slate-600 whitespace-nowrap">
                              {renderCell(col, teacher)}
                            </td>
                          ),
                        )}
                      {displayedModuleColumns.map((col) => {
                        const cell = badgeByColKey.get(col.key);
                        const isOnReview = cell?.status === 'on_review';
                        return (
                          <td key={col.key} className="px-0.5 py-1 text-center">
                            <ModuleScoreCell
                              result={cell}
                              label={col.label}
                              colorOverride={isOnReview ? STATUS_DOT_COLOR.on_review : undefined}
                              tooltipOverride={
                                isOnReview
                                  ? `${col.label}: ${statusLabel(t, cell!.status)} (${cell!.score}%)`
                                  : undefined
                              }
                            />
                          </td>
                        );
                      })}
                      {visibleKeys.has('result') && (
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Badge variant={overall.percent >= 70 ? 'success' : overall.percent >= 50 ? 'warning' : 'danger'}>
                            {overall.percent}%
                          </Badge>
                        </td>
                      )}
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
