import { useState } from 'react';
import type {
  GradeGroup,
  ModuleResult,
  ModuleStatus,
  PlatformStatus,
  Teacher,
  TeacherLifecycleStatus,
  TeachingLanguage,
  TrainingType,
} from '../../types/teacher';
import {
  DISTRICTS,
  GRADE_GROUPS,
  LIFECYCLE_STATUSES,
  TRAINING_TYPES,
  getModule,
  modulesForGrade,
} from '../../data/constants';
import { useT } from '../../i18n/useLocaleStore';

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
  status: ModuleStatus;
  score: number;
}

function buildModuleRows(teacher: Teacher, gradeGroup: GradeGroup): ModuleFormRow[] {
  return modulesForGrade(gradeGroup).map((m) => {
    const existing = teacher.moduleResults.find((r) => r.moduleId === m.id);
    return { moduleId: m.id, status: existing?.status ?? 'not_started', score: existing?.score ?? 0 };
  });
}

export function TeacherEditForm({ teacher, onSave, onCancel }: TeacherEditFormProps) {
  const t = useT();
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
    const moduleResults: ModuleResult[] = moduleRows.map((r) => ({
      moduleId: r.moduleId,
      status: r.status,
      score: r.status === 'not_started' ? 0 : r.score,
    }));
    try {
      await onSave({ ...form, moduleResults });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label={t.detail.fields.fullName} value={form.fullName} onChange={(v) => updateField('fullName', v)} />
        <TextField label={t.detail.fields.fin} value={form.fin} onChange={(v) => updateField('fin', v)} />
        <TextField label={t.detail.fields.phone} value={form.phone} onChange={(v) => updateField('phone', v)} />
        <TextField label={t.detail.fields.lmsId} value={form.lmsId} onChange={(v) => updateField('lmsId', v)} />
        <SelectField
          label={t.detail.fields.district}
          value={form.district}
          onChange={(v) => updateField('district', v)}
          options={DISTRICTS.map((d) => ({ value: d, label: d }))}
        />
        <TextField label={t.detail.fields.school} value={form.school} onChange={(v) => updateField('school', v)} />
        <SelectField
          label={t.detail.fields.language}
          value={form.language}
          onChange={(v) => updateField('language', v as TeachingLanguage)}
          options={[
            { value: 'az', label: t.language.az },
            { value: 'ru', label: t.language.ru },
          ]}
        />
        <SelectField
          label={t.detail.fields.trainingType}
          value={form.trainingType}
          onChange={(v) => updateField('trainingType', v as TrainingType)}
          options={TRAINING_TYPES.map((type) => ({ value: type, label: t.trainingType[type] }))}
        />
        <SelectField
          label={t.detail.fields.gradeGroup}
          value={form.gradeGroup}
          onChange={(v) => updateField('gradeGroup', v as GradeGroup)}
          options={GRADE_GROUPS.map((g) => ({ value: g, label: t.gradeGroup[g] }))}
        />
        <SelectField
          label={t.detail.fields.lifecycleStatus}
          value={form.lifecycleStatus}
          onChange={(v) => updateField('lifecycleStatus', v as TeacherLifecycleStatus)}
          options={LIFECYCLE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label={t.detail.fields.platformStatus}
          value={form.platformStatus}
          onChange={(v) => updateField('platformStatus', v as PlatformStatus)}
          options={[
            { value: 'entered', label: t.platformStatus.entered },
            { value: 'not_entered', label: t.platformStatus.notEntered },
          ]}
        />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-900">{t.detail.moduleResults}</h4>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {moduleRows.map((row) => (
            <div key={row.moduleId} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-10 shrink-0 text-sm font-medium text-slate-700">{getModule(row.moduleId)?.shortTitle}</span>
              <select
                value={row.status}
                onChange={(e) => updateModuleRow(row.moduleId, { status: e.target.value as ModuleStatus })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
              >
                <option value="passed">{t.moduleStatus.passed}</option>
                <option value="failed">{t.moduleStatus.failed}</option>
                <option value="not_started">{t.moduleStatus.notStarted}</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                value={row.score}
                disabled={row.status === 'not_started'}
                onChange={(e) => updateModuleRow(row.moduleId, { score: Number(e.target.value) })}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400"
              />
              <span className="text-xs text-slate-400">%</span>
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
          {t.detail.saveChanges}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          {t.common.cancel}
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
