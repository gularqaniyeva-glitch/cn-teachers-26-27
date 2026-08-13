import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { TeacherFiltersBar } from '../components/teachers/TeacherFilters';
import { TeacherFilterTree } from '../components/teachers/TeacherFilterTree';
import { TeacherTable } from '../components/teachers/TeacherTable';
import { BulkActionBar } from '../components/teachers/BulkActionBar';
import { Pagination } from '../components/teachers/Pagination';
import { DEFAULT_FILTERS, filterTeachers, sortTeachers } from '../utils/teacherFilters';
import type { SortKey, SortState } from '../utils/teacherFilters';
import { exportTeachersToCsv } from '../utils/csvExport';
import { moduleAppliesToTeacher, upsertModuleResult } from '../utils/bulkActions';
import type { GradeGroup, TeacherLifecycleStatus, TrainingType } from '../types/teacher';

export function TeachersPage() {
  const { teachers, loading, load, updateManyTeachers } = useTeacherStore();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ key: 'fullName', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    load();
  }, [load]);

  const allSchools = useMemo(() => Array.from(new Set(teachers.map((t) => t.school))).sort(), [teachers]);

  const filtered = useMemo(() => filterTeachers(teachers, filters), [teachers, filters]);
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

  async function handleApplyModuleStatus(moduleId: string, passed: boolean) {
    const ids = Array.from(selectedIds);
    const applicableIds = teachers.filter((t) => ids.includes(t.id) && moduleAppliesToTeacher(t, moduleId)).map((t) => t.id);

    if (applicableIds.length === 0) {
      window.alert('Этот модуль не назначен ни одному из выбранных учителей (не совпадает группа классов).');
      return;
    }

    await updateManyTeachers(applicableIds, (teacher) => ({
      moduleResults: upsertModuleResult(teacher.moduleResults, moduleId, passed),
    }));

    if (applicableIds.length < ids.length) {
      window.alert(`Статус применён к ${applicableIds.length} из ${ids.length} выбранных — остальным этот модуль не назначен.`);
    }
    setSelectedIds(new Set());
  }

  async function handleAssign(patch: { school?: string; trainingType?: TrainingType }) {
    if (!patch.school && !patch.trainingType) return;
    await updateManyTeachers(Array.from(selectedIds), () => ({ ...patch }));
    setSelectedIds(new Set());
  }

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">Загрузка данных…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Учителя</h1>
          <p className="mt-1 text-sm text-slate-500">Найдено {sorted.length} из {teachers.length}</p>
        </div>
        <button
          onClick={() => exportTeachersToCsv(sorted)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Download size={16} />
          Экспорт в Excel/CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <TeacherFilterTree
          teachers={teachers}
          filters={filters}
          onToggleDistrict={(d) => toggleArrayValue('districts', d)}
          onToggleSchool={(s) => toggleArrayValue('schools', s)}
          onToggleGradeGroup={(g: GradeGroup) => toggleArrayValue('gradeGroups', g)}
          onToggleLifecycle={(s: TeacherLifecycleStatus) => toggleArrayValue('lifecycleStatuses', s)}
          onModuleChange={(id) => handleFilterChange('moduleId', id)}
          onModuleResultChange={(result) => handleFilterChange('moduleResult', result)}
        />

        <div className="space-y-4">
          <TeacherFiltersBar filters={filters} onChange={handleFilterChange} onReset={handleReset} />

          <BulkActionBar
            count={selectedIds.size}
            schools={allSchools}
            onClear={() => setSelectedIds(new Set())}
            onApplyModuleStatus={handleApplyModuleStatus}
            onAssign={handleAssign}
          />

          <TeacherTable
            teachers={pageItems}
            sort={sort}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAllOnPage}
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
      </div>
    </div>
  );
}
