import { useState } from 'react';
import { X } from 'lucide-react';
import type { ModuleDefinition, ModuleStatus, TrainingType } from '../../types/teacher';
import { TRAINING_TYPES } from '../../data/constants';
import { useT } from '../../i18n/useLocaleStore';

interface BulkActionBarProps {
  count: number;
  modules: ModuleDefinition[];
  schools: string[];
  onClear: () => void;
  onApplyModuleStatus: (moduleId: string, status: ModuleStatus) => void;
  onAssign: (patch: { school?: string; trainingType?: TrainingType }) => void;
}

export function BulkActionBar({ count, modules, schools, onClear, onApplyModuleStatus, onAssign }: BulkActionBarProps) {
  const t = useT();
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? '');
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus>('passed');
  const [assignSchool, setAssignSchool] = useState('');
  const [assignTrainingType, setAssignTrainingType] = useState('');

  if (count === 0) return null;

  function handleApplyModuleStatus() {
    if (!moduleId) return;
    onApplyModuleStatus(moduleId, moduleStatus);
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
        {t.common.selected}: {count}
        <button
          onClick={onClear}
          className="flex h-6 w-6 items-center justify-center rounded-full text-brand-600 hover:bg-brand-100"
          aria-label={t.common.clearSelection}
        >
          <X size={14} />
        </button>
      </div>

      <div className="h-8 w-px bg-brand-200" />

      <div className="flex flex-wrap items-end gap-2">
        <span className="text-xs font-medium text-slate-500">{t.bulk.changeModuleStatus}</span>
        <select
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.shortTitle}
            </option>
          ))}
        </select>
        <select
          value={moduleStatus}
          onChange={(e) => setModuleStatus(e.target.value as ModuleStatus)}
          className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="passed">{t.moduleStatus.passed}</option>
          <option value="failed">{t.moduleStatus.failed}</option>
          <option value="not_started">{t.moduleStatus.notStarted}</option>
        </select>
        <button
          onClick={handleApplyModuleStatus}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t.common.apply}
        </button>
      </div>

      <div className="h-8 w-px bg-brand-200" />

      <div className="flex flex-wrap items-end gap-2">
        <span className="text-xs font-medium text-slate-500">{t.bulk.assignCourseSchool}</span>
        <select
          value={assignTrainingType}
          onChange={(e) => setAssignTrainingType(e.target.value)}
          className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">{t.bulk.trainingTypeNoChange}</option>
          {TRAINING_TYPES.map((type) => (
            <option key={type} value={type}>
              {t.trainingType[type]}
            </option>
          ))}
        </select>
        <select
          value={assignSchool}
          onChange={(e) => setAssignSchool(e.target.value)}
          className="max-w-[220px] rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">{t.bulk.schoolNoChange}</option>
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
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
