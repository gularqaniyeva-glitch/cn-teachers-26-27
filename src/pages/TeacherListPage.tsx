import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Settings2, X } from 'lucide-react';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { useTeacherStore } from '../store/useTeacherStore';
import { TeacherFiltersBar } from '../components/teachers/TeacherFilters';
import { TeacherFilterTree } from '../components/teachers/TeacherFilterTree';
import { TeacherTable } from '../components/teachers/TeacherTable';
import { BulkActionBar } from '../components/teachers/BulkActionBar';
import { ModuleQuickListPanel } from '../components/teachers/ModuleQuickListPanel';
import { ExportMenu } from '../components/teachers/ExportMenu';
import { DEFAULT_VISIBLE_TEACHER_COLUMNS } from '../components/teachers/teacherTableColumns';
import { Pagination } from '../components/teachers/Pagination';
import { TeacherQuickViewModal } from '../components/teacher/TeacherQuickViewModal';
import { DEFAULT_FILTERS, filterTeachers, sortTeachers } from '../utils/teacherFilters';
import type { SortKey, SortState } from '../utils/teacherFilters';
import { exportTeachersToCsv } from '../utils/csvExport';
import { moduleAppliesToTeacher, upsertModuleResult } from '../utils/bulkActions';
import type { GradeGroup, ModuleStatus, Teacher, TrainingType } from '../types/teacher';
import { MODULES } from '../data/constants';
import { useT } from '../i18n/useLocaleStore';

interface TeacherListPageProps {
  gradeGroups: GradeGroup[];
  title: string;
  subtitle: string;
}

type PageTab = 'all' | 'moduleReport';

export function TeacherListPage({ gradeGroups, title, subtitle }: TeacherListPageProps) {
  const t = useT();
  const { teachers: allTeachers, loading, refreshing, error, load, reload, updateManyTeachers } = useTeacherStore();
  const [activeTab, setActiveTab] = useState<PageTab>('all');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ key: 'fullName', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE_TEACHER_COLUMNS),
  );

  useEffect(() => {
    load();
  }, [load]);

  const scopedTeachers = useMemo(
    () => allTeachers.filter((teacher) => gradeGroups.includes(teacher.gradeGroup)),
    [allTeachers, gradeGroups],
  );

  const quickViewTeacher = useMemo(
    () => scopedTeachers.find((teacher) => teacher.id === quickViewId) ?? null,
    [scopedTeachers, quickViewId],
  );

  const allSchools = useMemo(() => Array.from(new Set(scopedTeachers.map((t) => t.school))).sort(), [scopedTeachers]);
  const scopedModules = useMemo(() => MODULES.filter((m) => gradeGroups.includes(m.group)), [gradeGroups]);

  const filtered = useMemo(() => filterTeachers(scopedTeachers, filters), [scopedTeachers, filters]);
  const sorted = useMemo(() => sortTeachers(filtered, sort), [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleFilterChange<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function toggleArrayValue<K extends 'districts' | 'schools' | 'gradeGroups' | 'lifecycleStatuses'>(
    key: K,
    value: string,
  ) {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
    setPage(1);
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' },
    );
  }

  function toggleColumn(key: string) {
    setVisibleColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const allSelected = pageItems.length > 0 && pageItems.every((t) => prev.has(t.id));
      const next = new Set(prev);
      if (allSelected) {
        pageItems.forEach((t) => next.delete(t.id));
      } else {
        pageItems.forEach((t) => next.add(t.id));
      }
      return next;
    });
  }

  async function handleApplyModuleStatus(moduleId: string, status: ModuleStatus) {
    const ids = Array.from(selectedIds);
    const applicableIds = scopedTeachers
      .filter((t) => ids.includes(t.id) && moduleAppliesToTeacher(t, moduleId))
      .map((t) => t.id);

    if (applicableIds.length === 0) {
      window.alert(t.bulk.notApplicableWarning);
      return;
    }

    await updateManyTeachers(applicableIds, (teacher: Teacher) => ({
      moduleResults: upsertModuleResult(teacher.moduleResults, moduleId, status),
    }));

    if (applicableIds.length < ids.length) {
      window.alert(
        t.bulk.partiallyAppliedWarning
          .replace('{applied}', String(applicableIds.length))
          .replace('{total}', String(ids.length)),
      );
    }
    setSelectedIds(new Set());
  }

  async function handleAssign(patch: { school?: string; trainingType?: TrainingType }) {
    if (!patch.school && !patch.trainingType) return;
    await updateManyTeachers(Array.from(selectedIds), () => ({ ...patch }));
    setSelectedIds(new Set());
  }

  if (loading && allTeachers.length === 0) {
    return <p className="text-slate-500">{t.common.loading}</p>;
  }

  if (error && allTeachers.length === 0) {
    return <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} onRetry={reload} retryLabel={t.common.retry} />}

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabs.allTeachers}
          </button>
          <button
            onClick={() => setActiveTab('moduleReport')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'moduleReport' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabs.moduleReport}
          </button>
        </div>

        <button
          onClick={() => reload()}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? t.common.refreshing : t.common.refreshData}
        </button>
      </div>

      {activeTab === 'all' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {t.common.found} {sorted.length} {t.common.of} {scopedTeachers.length}
            </p>
            <ExportMenu
              buttonLabel={t.common.exportCsv}
              defaultCheckedKeys={visibleColumnKeys}
              onExport={(keys) => exportTeachersToCsv(sorted, t, keys, 'teachers.csv')}
            />
          </div>

          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t.common.search}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings2 size={15} />
            {t.common.filtersToggle}
          </button>

          {filtersOpen && (
            <div className="fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/30" onClick={() => setFiltersOpen(false)} />
              <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-slate-50 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-900">{t.filters.treeTitle}</h2>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label={t.common.close}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 space-y-4 p-4">
                  <TeacherFilterTree
                    teachers={scopedTeachers}
                    filters={filters}
                    gradeGroupOptions={gradeGroups}
                    onToggleDistrict={(d) => toggleArrayValue('districts', d)}
                    onToggleSchool={(s) => toggleArrayValue('schools', s)}
                    onToggleGradeGroup={(g) => toggleArrayValue('gradeGroups', g)}
                    onToggleLifecycle={(s) => toggleArrayValue('lifecycleStatuses', s)}
                    onModuleChange={(id) => handleFilterChange('moduleId', id)}
                    onModuleResultChange={(result) => handleFilterChange('moduleResult', result)}
                    onSectorChange={(sector) => handleFilterChange('sector', sector)}
                  />
                  <TeacherFiltersBar filters={filters} onChange={handleFilterChange} onReset={handleReset} />
                </div>
              </aside>
            </div>
          )}

          <BulkActionBar
            count={selectedIds.size}
            modules={scopedModules}
            schools={allSchools}
            onClear={() => setSelectedIds(new Set())}
            onApplyModuleStatus={handleApplyModuleStatus}
            onAssign={handleAssign}
          />

          <TeacherTable
            teachers={pageItems}
            gradeGroups={gradeGroups}
            sort={sort}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAllOnPage}
            onRowClick={setQuickViewId}
            visibleKeys={visibleColumnKeys}
            onToggleColumn={toggleColumn}
          />

          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      ) : (
        <ModuleQuickListPanel teachers={scopedTeachers} gradeGroupOptions={gradeGroups} onRowClick={setQuickViewId} />
      )}

      <TeacherQuickViewModal teacher={quickViewTeacher} onClose={() => setQuickViewId(null)} />
    </div>
  );
}
