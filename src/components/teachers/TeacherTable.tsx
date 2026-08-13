import { ArrowDown, ArrowUp, ArrowUpDown, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import {
  GRADE_GROUP_LABELS,
  PLATFORM_STATUS_LABELS,
  TRAINING_TYPE_LABELS,
} from '../../data/constants';
import { getTeacherAverageScore } from '../../utils/stats';
import type { SortKey, SortState } from '../../utils/teacherFilters';

interface Column {
  key: SortKey;
  label: string;
}

const COLUMNS: Column[] = [
  { key: 'fullName', label: 'ФИО' },
  { key: 'school', label: 'Школа' },
  { key: 'district', label: 'Район' },
  { key: 'gradeGroup', label: 'Классы' },
  { key: 'trainingType', label: 'Тип обучения' },
  { key: 'lifecycleStatus', label: 'OLD/NEW' },
  { key: 'platformStatus', label: 'Платформа' },
  { key: 'averageScore', label: 'Результат' },
];

interface TeacherTableProps {
  teachers: Teacher[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

function scoreVariant(score: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score === null) return 'neutral';
  if (score >= 70) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

export function TeacherTable({
  teachers,
  sort,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: TeacherTableProps) {
  const navigate = useNavigate();
  const allOnPageSelected = teachers.length > 0 && teachers.every((t) => selectedIds.has(t.id));
  const someOnPageSelected = teachers.some((t) => selectedIds.has(t.id));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                }}
                onChange={onToggleSelectAll}
                className="accent-brand-600"
                aria-label="Выбрать всех на странице"
              />
            </th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={() => onSort(col.key)}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  {col.label}
                  {sort.key === col.key ? (
                    sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                  ) : (
                    <ArrowUpDown size={13} className="text-slate-300" />
                  )}
                </button>
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {teachers.map((t) => {
            const score = getTeacherAverageScore(t);
            const isSelected = selectedIds.has(t.id);
            return (
              <tr
                key={t.id}
                onClick={() => navigate(`/teachers/${t.id}`)}
                className={`cursor-pointer transition-colors hover:bg-brand-50/60 ${isSelected ? 'bg-brand-50/40' : ''}`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(t.id)}
                    className="accent-brand-600"
                    aria-label={`Выбрать ${t.fullName}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{t.fullName}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.school}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.district}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{GRADE_GROUP_LABELS[t.gradeGroup]}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{TRAINING_TYPE_LABELS[t.trainingType]}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={t.lifecycleStatus === 'NEW' ? 'purple' : 'neutral'}>{t.lifecycleStatus}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={t.platformStatus === 'entered' ? 'success' : 'danger'} dot>
                    {PLATFORM_STATUS_LABELS[t.platformStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={scoreVariant(score)}>{score === null ? 'нет данных' : `${score}%`}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {t.note && <StickyNote size={15} aria-label="Есть заметка" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {teachers.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          Ничего не найдено — попробуйте изменить фильтры
        </div>
      )}
    </div>
  );
}
