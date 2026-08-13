import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { GradeGroup, ModuleStatus, Teacher } from '../../types/teacher';
import { MODULES } from '../../data/constants';
import { getTeacherAverageScore } from '../../utils/stats';
import { exportTeachersToCsv } from '../../utils/csvExport';
import { Badge } from '../ui/Badge';
import { useT } from '../../i18n/useLocaleStore';

interface ModuleQuickListPanelProps {
  teachers: Teacher[];
  gradeGroupOptions: GradeGroup[];
}

const STATUS_VARIANT = { passed: 'success', failed: 'danger', not_started: 'neutral' } as const;

export function ModuleQuickListPanel({ teachers, gradeGroupOptions }: ModuleQuickListPanelProps) {
  const t = useT();
  const [gradeGroup, setGradeGroup] = useState<GradeGroup>(gradeGroupOptions[0]);
  const modulesInGroup = MODULES.filter((m) => m.group === gradeGroup);
  const [moduleId, setModuleId] = useState(modulesInGroup[0]?.id ?? '');
  const [status, setStatus] = useState<ModuleStatus>('passed');

  function handleGradeGroupChange(next: GradeGroup) {
    setGradeGroup(next);
    const firstModule = MODULES.find((m) => m.group === next);
    setModuleId(firstModule?.id ?? '');
  }

  const matched = useMemo(
    () =>
      teachers.filter(
        (teacher) =>
          teacher.gradeGroup === gradeGroup &&
          teacher.moduleResults.find((r) => r.moduleId === moduleId)?.status === status,
      ),
    [teachers, gradeGroup, moduleId, status],
  );

  const currentModule = MODULES.find((m) => m.id === moduleId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{t.quickList.title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{t.quickList.hint}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {gradeGroupOptions.length > 1 && (
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            {t.quickList.gradeGroupLabel}
            <select
              value={gradeGroup}
              onChange={(e) => handleGradeGroupChange(e.target.value as GradeGroup)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {gradeGroupOptions.map((g) => (
                <option key={g} value={g}>
                  {t.gradeGroup[g]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {t.quickList.moduleLabel}
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {modulesInGroup.map((m) => (
              <option key={m.id} value={m.id}>
                {m.shortTitle}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {t.quickList.statusLabel}
          <div className="flex gap-1.5">
            {(['passed', 'failed', 'not_started'] as ModuleStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${
                  status === s
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.moduleStatus[s === 'not_started' ? 'notStarted' : s]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => exportTeachersToCsv(matched, t, `${gradeGroup}-${currentModule?.shortTitle ?? moduleId}.csv`)}
          disabled={matched.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
        >
          <Download size={15} />
          {t.quickList.exportButton}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {matched.length} {t.quickList.resultCount}
      </p>

      {matched.length > 0 && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">{t.columns.fullName}</th>
                <th className="px-3 py-2">{t.columns.school}</th>
                <th className="px-3 py-2">{t.quickList.columnScore}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matched.map((teacher) => {
                const result = teacher.moduleResults.find((r) => r.moduleId === moduleId);
                return (
                  <tr key={teacher.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">{teacher.fullName}</td>
                    <td className="px-3 py-2 text-slate-600">{teacher.school}</td>
                    <td className="px-3 py-2">
                      <Badge variant={STATUS_VARIANT[status]}>
                        {result ? `${result.score}%` : getTeacherAverageScore(teacher)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
