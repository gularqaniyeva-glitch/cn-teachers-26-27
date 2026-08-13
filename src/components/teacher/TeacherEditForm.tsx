import { useState } from 'react';
import type {
  GradeGroup,
  ModuleResult,
  PlatformStatus,
  Teacher,
  TeacherLifecycleStatus,
  TeachingLanguage,
  TrainingType,
} from '../../types/teacher';
import {
  DISTRICTS,
  GRADE_GROUP_LABELS,
  GRADE_GROUPS,
  LANGUAGE_LABELS,
  LIFECYCLE_STATUSES,
  PLATFORM_STATUS_LABELS,
  TRAINING_TYPE_LABELS,
  TRAINING_TYPES,
  modulesForGrade,
} from '../../data/constants';

interface TeacherEditFormProps {
  teacher: Teacher;
  onSave: (patch: Partial<Teacher>) => Promise<void>;
  onCancel: () => void;
}

interface FormState {
  fullName: string;
  district: string;
  school: string;
  fin: string;
  phone: string;
  lmsId: string;
  language: TeachingLanguage;
  trainingType: TrainingType;
  lifecycleStatus: TeacherLifecycleStatus;
  gradeGroup: GradeGroup;
  platformStatus: PlatformStatus;
}

interface ModuleFormRow {
  moduleId: string;
  hasResult: boolean;
  score: number;
}

function buildModuleRows(teacher: Teacher, gradeGroup: GradeGroup): ModuleFormRow[] {
  return modulesForGrade(gradeGroup).map((m) => {
    const existing = teacher.moduleResults.find((r) => r.moduleId === m.id);
    return { moduleId: m.id, hasResult: Boolean(existing), score: existing?.score ?? 60 };
  });
}

export function TeacherEditForm({ teacher, onSave, onCancel }: TeacherEditFormProps) {
  const [form, setForm] = useState<FormState>({
    fullName: teacher.fullName,
    district: teacher.district,
    school: teacher.school,
    fin: teacher.fin,
    phone: teacher.phone,
    lmsId: teacher.lmsId,
    language: teacher.language,
    trainingType: teacher.trainingType,
    lifecycleStatus: teacher.lifecycleStatus,
    gradeGroup: teacher.gradeGroup,
    platformStatus: teacher.platformStatus,
  });
  const [moduleRows, setModuleRows] = useState<ModuleFormRow[]>(() => buildModuleRows(teacher, teacher.gradeGroup));
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'gradeGroup') {
      setModuleRows(buildModuleRows(teacher, value as GradeGroup));
    }
  }

  function updateModuleRow(moduleId: string, patch: Partial<ModuleFormRow>) {
    setModuleRows((prev) => prev.map((r) => (r.moduleId === moduleId ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    setSaving(true);
    const moduleResults: ModuleResult[] = moduleRows
      .filter((r) => r.hasResult)
      .map((r) => ({ moduleId: r.moduleId, score: r.score, passed: r.score >= 60 }));
    try {
      await onSave({ ...form, moduleResults });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="ФИО" value={form.fullName} onChange={(v) => updateField('fullName', v)} />
        <TextField label="FIN" value={form.fin} onChange={(v) => updateField('fin', v)} />
        <TextField label="Телефон" value={form.phone} onChange={(v) => updateField('phone', v)} />
        <TextField label="LMS ID" value={form.lmsId} onChange={(v) => updateField('lmsId', v)} />
        <SelectField
          label="Район"
          value={form.district}
          onChange={(v) => updateField('district', v)}
          options={DISTRICTS.map((d) => ({ value: d, label: d }))}
        />
        <TextField label="Школа" value={form.school} onChange={(v) => updateField('school', v)} />
        <SelectField
          label="Язык"
          value={form.language}
          onChange={(v) => updateField('language', v as TeachingLanguage)}
          options={[
            { value: 'az', label: LANGUAGE_LABELS.az },
            { value: 'ru', label: LANGUAGE_LABELS.ru },
          ]}
        />
        <SelectField
          label="Тип обучения"
          value={form.trainingType}
          onChange={(v) => updateField('trainingType', v as TrainingType)}
          options={TRAINING_TYPES.map((t) => ({ value: t, label: TRAINING_TYPE_LABELS[t] }))}
        />
        <SelectField
          label="Классы"
          value={form.gradeGroup}
          onChange={(v) => updateField('gradeGroup', v as GradeGroup)}
          options={GRADE_GROUPS.map((g) => ({ value: g, label: GRADE_GROUP_LABELS[g] }))}
        />
        <SelectField
          label="OLD / NEW"
          value={form.lifecycleStatus}
          onChange={(v) => updateField('lifecycleStatus', v as TeacherLifecycleStatus)}
          options={LIFECYCLE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="Статус платформы"
          value={form.platformStatus}
          onChange={(v) => updateField('platformStatus', v as PlatformStatus)}
          options={[
            { value: 'entered', label: PLATFORM_STATUS_LABELS.entered },
            { value: 'not_entered', label: PLATFORM_STATUS_LABELS.not_entered },
          ]}
        />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-900">Результаты модулей</h4>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {moduleRows.map((row) => (
            <div key={row.moduleId} className="flex items-center gap-4 px-3 py-2.5">
              <label className="flex w-40 shrink-0 items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={row.hasResult}
                  onChange={(e) => updateModuleRow(row.moduleId, { hasResult: e.target.checked })}
                  className="rounded border-slate-300"
                />
                {row.moduleId}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={row.score}
                disabled={!row.hasResult}
                onChange={(e) => updateModuleRow(row.moduleId, { score: Number(e.target.value) })}
                className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400"
              />
              <span className="text-xs text-slate-400">% результат</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Сохранить изменения
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
