import { RotateCcw } from 'lucide-react';
import { FilterSelect } from './FilterSelect';
import { MultiSelectFilter } from './MultiSelectFilter';
import type { TeacherFilters as TeacherFiltersState } from '../../utils/teacherFilters';
import { TRAINING_TYPES } from '../../data/constants';
import { useT } from '../../i18n/useLocaleStore';

interface TeacherFiltersProps {
  filters: TeacherFiltersState;
  districts: string[];
  startYears: string[];
  classesTaught: string[];
  onChange: <K extends keyof TeacherFiltersState>(key: K, value: TeacherFiltersState[K]) => void;
  onReset: () => void;
}

// Единая, сквозная панель фильтров — используется одинаково на вкладках
// "2–9 классы", "10–11 классы" и "Отчёт по модулю" (см. TeacherListPage).
// Tabeçilik, Год начала/Стаж, Классы и Статус прохождения — множественный
// выбор (можно отметить сразу несколько значений сразу); Тип обучения
// оставлен одиночным выбором, как и был.
export function TeacherFiltersBar({ filters, districts, startYears, classesTaught, onChange, onReset }: TeacherFiltersProps) {
  const t = useT();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <MultiSelectFilter
          label={t.filters.districtLabel}
          selected={filters.districts}
          onChange={(next) => onChange('districts', next)}
          options={districts.map((d) => ({ value: d, label: d }))}
        />
        <MultiSelectFilter
          label={t.filters.startYearLabel}
          selected={filters.startYears}
          onChange={(next) => onChange('startYears', next)}
          options={startYears.map((y) => ({ value: y, label: y }))}
        />
        <MultiSelectFilter
          label={t.filters.classesTaughtLabel}
          selected={filters.classesTaught}
          onChange={(next) => onChange('classesTaught', next)}
          options={classesTaught.map((c) => ({ value: c, label: c }))}
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
        <MultiSelectFilter
          label={t.filters.platformStatusLabel}
          selected={filters.platformStatuses}
          onChange={(next) => onChange('platformStatuses', next)}
          options={[
            { value: 'entered', label: t.platformStatus.entered },
            { value: 'not_entered', label: t.platformStatus.notEntered },
          ]}
          searchable={false}
        />

        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            {t.filters.scoreFromLabel}
            <input
              type="number"
              min={0}
              max={100}
              value={filters.scoreMin ?? ''}
              onChange={(e) => onChange('scoreMin', e.target.value === '' ? null : Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            {t.filters.scoreToLabel}
            <input
              type="number"
              min={0}
              max={100}
              value={filters.scoreMax ?? ''}
              onChange={(e) => onChange('scoreMax', e.target.value === '' ? null : Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

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
