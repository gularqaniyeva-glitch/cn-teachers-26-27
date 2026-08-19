import { RotateCcw } from 'lucide-react';
import { FilterSelect } from './FilterSelect';
import type { TeacherFilters as TeacherFiltersState } from '../../utils/teacherFilters';
import { TRAINING_TYPES } from '../../data/constants';
import { useT } from '../../i18n/useLocaleStore';

interface TeacherFiltersProps {
  filters: TeacherFiltersState;
  districts: string[];
  onChange: <K extends keyof TeacherFiltersState>(key: K, value: TeacherFiltersState[K]) => void;
  onReset: () => void;
}

export function TeacherFiltersBar({ filters, districts, onChange, onReset }: TeacherFiltersProps) {
  const t = useT();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label={t.filters.districtLabel}
          value={filters.districts[0] ?? ''}
          onChange={(v) => onChange('districts', v ? [v] : [])}
          options={[
            { value: '', label: t.filters.allDistricts },
            ...districts.map((d) => ({ value: d, label: d })),
          ]}
        />
        <FilterSelect
          label={t.filters.trainingTypeLabel}
          value={filters.trainingType}
          onChange={(v) => onChange('trainingType', v)}
          options={[
            { value: '', label: t.common.any },
            ...TRAINING_TYPES.map((type) => ({ value: type, label: t.trainingType[type] })),
          ]}
        />
        <FilterSelect
          label={t.filters.platformStatusLabel}
          value={filters.platformStatus}
          onChange={(v) => onChange('platformStatus', v)}
          options={[
            { value: '', label: t.common.any },
            { value: 'entered', label: t.platformStatus.entered },
            { value: 'not_entered', label: t.platformStatus.notEntered },
          ]}
        />

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={filters.unassignedClassOnly}
            onChange={(e) => onChange('unassignedClassOnly', e.target.checked)}
            className="accent-brand-600"
          />
          {t.common.classNotAssignedFilter}
        </label>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={14} />
          {t.common.resetAllFilters}
        </button>
      </div>
    </div>
  );
}
