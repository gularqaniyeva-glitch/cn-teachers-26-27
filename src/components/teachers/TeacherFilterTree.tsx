import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { GradeGroup, Teacher, TeacherLifecycleStatus } from '../../types/teacher';
import type { TeacherFilters } from '../../utils/teacherFilters';
import { LIFECYCLE_STATUSES, MODULES } from '../../data/constants';
import { useT } from '../../i18n/useLocaleStore';

interface TeacherFilterTreeProps {
  teachers: Teacher[];
  filters: TeacherFilters;
  gradeGroupOptions: GradeGroup[];
  onToggleDistrict: (district: string) => void;
  onToggleSchool: (school: string) => void;
  onToggleGradeGroup: (group: GradeGroup) => void;
  onToggleLifecycle: (status: TeacherLifecycleStatus) => void;
  onModuleChange: (moduleId: string) => void;
  onModuleResultChange: (result: string) => void;
  onSectorChange: (sector: string) => void;
}

type SectionKey = 'location' | 'grade' | 'lifecycle' | 'module' | 'sector';

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-1.5 py-2 text-left text-sm font-semibold text-slate-800"
    >
      {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      {title}
    </button>
  );
}

export function TeacherFilterTree({
  teachers,
  filters,
  gradeGroupOptions,
  onToggleDistrict,
  onToggleSchool,
  onToggleGradeGroup,
  onToggleLifecycle,
  onModuleChange,
  onModuleResultChange,
  onSectorChange,
}: TeacherFilterTreeProps) {
  const t = useT();
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set<SectionKey>(['location', 'grade', 'lifecycle', 'module', 'sector']),
  );
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  function toggleSection(key: SectionKey) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDistrictExpanded(district: string) {
    setExpandedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(district)) next.delete(district);
      else next.add(district);
      return next;
    });
  }

  const districtGroups = useMemo(() => {
    const map = new Map<string, { count: number; schools: Map<string, number> }>();
    for (const t of teachers) {
      if (!map.has(t.district)) map.set(t.district, { count: 0, schools: new Map() });
      const entry = map.get(t.district)!;
      entry.count += 1;
      entry.schools.set(t.school, (entry.schools.get(t.school) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([district, { count, schools }]) => ({
        district,
        count,
        schools: Array.from(schools.entries())
          .map(([school, schoolCount]) => ({ school, count: schoolCount }))
          .sort((a, b) => a.school.localeCompare(b.school)),
      }))
      .sort((a, b) => a.district.localeCompare(b.district));
  }, [teachers]);

  const gradeCounts = useMemo(() => {
    const map = new Map<GradeGroup, number>();
    for (const t of teachers) map.set(t.gradeGroup, (map.get(t.gradeGroup) ?? 0) + 1);
    return map;
  }, [teachers]);

  const lifecycleCounts = useMemo(() => {
    const map = new Map<TeacherLifecycleStatus, number>();
    for (const t of teachers) map.set(t.lifecycleStatus, (map.get(t.lifecycleStatus) ?? 0) + 1);
    return map;
  }, [teachers]);

  const moduleOptions = MODULES.filter((m) => gradeGroupOptions.includes(m.group));
  const multiGrade = gradeGroupOptions.length > 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.filters.treeTitle}</h3>

      <div className="divide-y divide-slate-100">
        {/* Район → Школа */}
        <div className="py-1">
          <SectionHeader
            title={t.filters.locationSection}
            expanded={expandedSections.has('location')}
            onToggle={() => toggleSection('location')}
          />
          {expandedSections.has('location') && (
            <div className="space-y-0.5 pb-2 pl-1">
              {districtGroups.map(({ district, count, schools }) => {
                const districtOpen = expandedDistricts.has(district);
                return (
                  <div key={district}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleDistrictExpanded(district)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-400 hover:text-slate-700"
                        aria-label={`${district}`}
                      >
                        {districtOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                      <label className="flex flex-1 items-center justify-between gap-2 py-1 text-sm text-slate-700">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.districts.includes(district)}
                            onChange={() => onToggleDistrict(district)}
                            className="accent-brand-600"
                          />
                          {district}
                        </span>
                        <span className="text-xs text-slate-400">{count}</span>
                      </label>
                    </div>
                    {districtOpen && (
                      <div className="ml-6 space-y-0.5 border-l border-slate-100 pl-3">
                        {schools.map(({ school, count: schoolCount }) => (
                          <label
                            key={school}
                            className="flex items-center justify-between gap-2 py-1 text-sm text-slate-600"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={filters.schools.includes(school)}
                                onChange={() => onToggleSchool(school)}
                                className="accent-brand-600"
                              />
                              {school}
                            </span>
                            <span className="text-xs text-slate-400">{schoolCount}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Параллель — скрываем, если у страницы только одна группа классов */}
        {gradeGroupOptions.length > 1 && (
          <div className="py-1">
            <SectionHeader
              title={t.filters.gradeSection}
              expanded={expandedSections.has('grade')}
              onToggle={() => toggleSection('grade')}
            />
            {expandedSections.has('grade') && (
              <div className="space-y-0.5 pb-2 pl-1">
                {gradeGroupOptions.map((g) => (
                  <label key={g} className="flex items-center justify-between gap-2 py-1 text-sm text-slate-700">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.gradeGroups.includes(g)}
                        onChange={() => onToggleGradeGroup(g)}
                        className="accent-brand-600"
                      />
                      {t.gradeGroup[g]}
                    </span>
                    <span className="text-xs text-slate-400">{gradeCounts.get(g) ?? 0}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Статус учителя */}
        <div className="py-1">
          <SectionHeader
            title={t.filters.lifecycleSection}
            expanded={expandedSections.has('lifecycle')}
            onToggle={() => toggleSection('lifecycle')}
          />
          {expandedSections.has('lifecycle') && (
            <div className="space-y-0.5 pb-2 pl-1">
              {LIFECYCLE_STATUSES.map((s) => (
                <label key={s} className="flex items-center justify-between gap-2 py-1 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.lifecycleStatuses.includes(s)}
                      onChange={() => onToggleLifecycle(s)}
                      className="accent-brand-600"
                    />
                    {s}
                  </span>
                  <span className="text-xs text-slate-400">{lifecycleCounts.get(s) ?? 0}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Сектор */}
        <div className="py-1">
          <SectionHeader
            title={t.filters.sectorSection}
            expanded={expandedSections.has('sector')}
            onToggle={() => toggleSection('sector')}
          />
          {expandedSections.has('sector') && (
            <div className="flex flex-wrap gap-1.5 pb-2 pl-1">
              {[
                { value: '', label: t.filters.sectorAll },
                { value: 'az', label: t.language.az },
                { value: 'ru', label: t.language.ru },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSectorChange(opt.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    filters.sector === opt.value
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Статус прохождения модуля */}
        <div className="py-1">
          <SectionHeader
            title={t.filters.moduleSection}
            expanded={expandedSections.has('module')}
            onToggle={() => toggleSection('module')}
          />
          {expandedSections.has('module') && (
            <div className="space-y-2 pb-2 pl-1">
              <select
                value={filters.moduleId}
                onChange={(e) => onModuleChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">{t.filters.anyModule}</option>
                {moduleOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {multiGrade ? `${t.gradeGroup[m.group]} · ${m.shortTitle}` : m.shortTitle}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: '', label: t.filters.anyStatus },
                  { value: 'passed', label: t.moduleStatus.passed },
                  { value: 'failed', label: t.moduleStatus.failed },
                  { value: 'not_started', label: t.moduleStatus.notStarted },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    disabled={!filters.moduleId}
                    onClick={() => onModuleResultChange(opt.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset disabled:cursor-not-allowed disabled:opacity-40 ${
                      filters.moduleResult === opt.value
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
