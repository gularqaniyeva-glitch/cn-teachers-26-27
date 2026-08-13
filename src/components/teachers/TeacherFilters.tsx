import { Search, RotateCcw } from 'lucide-react';
import { FilterSelect } from './FilterSelect';
import type { TeacherFilters as TeacherFiltersState } from '../../utils/teacherFilters';
import { PLATFORM_STATUS_LABELS, TRAINING_TYPE_LABELS, TRAINING_TYPES } from '../../data/constants';

interface TeacherFiltersProps {
  filters: TeacherFiltersState;
  onChange: <K extends keyof TeacherFiltersState>(key: K, value: TeacherFiltersState[K]) => void;
  onReset: () => void;
}

export function TeacherFiltersBar({ filters, onChange, onReset }: TeacherFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Поиск по ФИО, школе, FIN или LMS ID…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Тип обучения"
            value={filters.trainingType}
            onChange={(v) => onChange('trainingType', v)}
            options={[
              { value: '', label: 'Любой' },
              ...TRAINING_TYPES.map((t) => ({ value: t, label: TRAINING_TYPE_LABELS[t] })),
            ]}
          />
          <FilterSelect
            label="Статус платформы"
            value={filters.platformStatus}
            onChange={(v) => onChange('platformStatus', v)}
            options={[
              { value: '', label: 'Любой' },
              { value: 'entered', label: PLATFORM_STATUS_LABELS.entered },
              { value: 'not_entered', label: PLATFORM_STATUS_LABELS.not_entered },
            ]}
          />

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} />
            Сбросить все фильтры
          </button>
        </div>
      </div>
    </div>
  );
}
