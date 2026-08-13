import { useState } from 'react';
import { X } from 'lucide-react';
import type { TrainingType } from '../../types/teacher';
import { MODULES, TRAINING_TYPE_LABELS, TRAINING_TYPES } from '../../data/constants';

interface BulkActionBarProps {
  count: number;
  schools: string[];
  onClear: () => void;
  onApplyModuleStatus: (moduleId: string, passed: boolean) => void;
  onAssign: (patch: { school?: string; trainingType?: TrainingType }) => void;
}

export function BulkActionBar({ count, schools, onClear, onApplyModuleStatus, onAssign }: BulkActionBarProps) {
  const [moduleId, setModuleId] = useState(MODULES[0].id);
  const [moduleStatus, setModuleStatus] = useState<'passed' | 'failed'>('passed');
  const [assignSchool, setAssignSchool] = useState('');
  const [assignTrainingType, setAssignTrainingType] = useState('');

  if (count === 0) return null;

  function handleApplyModuleStatus() {
    onApplyModuleStatus(moduleId, moduleStatus === 'passed');
  }

  function handleAssign() {
    // Ключи включаются только если реально выбраны — иначе при слиянии patch
    // объект с "school: undefined" затрёт существующее значение школы.
    const patch: { school?: string; trainingType?: TrainingType } = {};
    if (assignSchool) patch.school = assignSchool;
    if (assignTrainingType) patch.trainingType = assignTrainingType as TrainingType;
    onAssign(patch);
    setAssignSchool('');
    setAssignTrainingType('');
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-brand-200 bg-brand-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
        Выбрано: {count}
        <button
          onClick={onClear}
          className="flex h-6 w-6 items-center justify-center rounded-full text-brand-600 hover:bg-brand-100"
          aria-label="Снять выделение"
        >
          <X size={14} />
        </button>
      </div>

      <div className="h-8 w-px bg-brand-200" />

      <div className="flex flex-wrap items-end gap-2">
        <span className="text-xs font-medium text-slate-500">Изменить статус модуля</span>
        <select
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {MODULES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.shortTitle}
            </option>
          ))}
        </select>
        <select
          value={moduleStatus}
          onChange={(e) => setModuleStatus(e.target.value as 'passed' | 'failed')}
          className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="passed">Пройден</option>
          <option value="failed">Не пройден</option>
        </select>
        <button
          onClick={handleApplyModuleStatus}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Применить
        </button>
      </div>

      <div className="h-8 w-px bg-brand-200" />

      <div className="flex flex-wrap items-end gap-2">
        <span className="text-xs font-medium text-slate-500">Назначить курс / школу</span>
        <select
          value={assignTrainingType}
          onChange={(e) => setAssignTrainingType(e.target.value)}
          className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Тип обучения — не менять</option>
          {TRAINING_TYPES.map((t) => (
            <option key={t} value={t}>
              {TRAINING_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={assignSchool}
          onChange={(e) => setAssignSchool(e.target.value)}
          className="max-w-[220px] rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Школа — не менять</option>
          {schools.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={!assignSchool && !assignTrainingType}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-700"
        >
          Применить
        </button>
      </div>
    </div>
  );
}
