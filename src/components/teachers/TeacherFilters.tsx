import { RotateCcw } from 'lucide-react';
import { FilterSelect } from './FilterSelect';
import type { TeacherFilters as TeacherFiltersState } from '../../utils/teacherFilters';
import { TRAINING_TYPES } from '../../data/constants';
import { useT } from '../../i18n/useLocaleStore';

interface TeacherFiltersProps {
  filters: TeacherFiltersState;
  onChange: <K extends keyof TeacherFiltersState>(key: K, value: TeacherFiltersState[K]) => void;
  onReset: () => void;
}

export function TeacherFiltersBar({ filters, onChange, onReset }: TeacherFiltersProps) {
  const t = useT();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
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
