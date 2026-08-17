import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import type { Teacher } from '../../types/teacher';
import { Badge } from '../ui/Badge';
import { NoTranslate } from '../ui/NoTranslate';
import { ModuleResultsPanel } from './ModuleResultsPanel';
import { DeadlineStatsBar } from './DeadlineStatsBar';
import { formatAssignedClassesLabel, getTeacherAverageScore } from '../../utils/stats';
import { useT } from '../../i18n/useLocaleStore';

interface TeacherQuickViewModalProps {
  teacher: Teacher | null;
  onClose: () => void;
}

function ProfileField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function TeacherQuickViewModal({ teacher, onClose }: TeacherQuickViewModalProps) {
  const t = useT();

  useEffect(() => {
    if (!teacher) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [teacher, onClose]);

  if (!teacher) return null;

  const avgScore = getTeacherAverageScore(teacher);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              <NoTranslate>{teacher.fullName}</NoTranslate>
            </h2>
            <p className="text-sm text-slate-500">
              <NoTranslate>{teacher.school}</NoTranslate>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label={t.common.close}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <DeadlineStatsBar teacher={teacher} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <ProfileField label={t.detail.fields.district} value={teacher.district} />
            <ProfileField label={t.detail.fields.fin} value={<NoTranslate>{teacher.fin}</NoTranslate>} />
            <ProfileField label={t.detail.fields.lmsId} value={<NoTranslate>{teacher.lmsId}</NoTranslate>} />
            <ProfileField label={t.filters.sectorSection} value={t.language[teacher.language]} />
            <ProfileField label={t.quickList.columnFormat} value={t.trainingType[teacher.trainingType]} />
            <ProfileField label={t.detail.fields.lifecycleStatus} value={teacher.lifecycleStatus} />
            <ProfileField
              label={t.detail.fields.classesTaught}
              value={formatAssignedClassesLabel(teacher, t.gradeGroup)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">{t.detail.moduleResults}</h3>
              {avgScore !== null && (
                <Badge variant={avgScore >= 70 ? 'success' : avgScore >= 50 ? 'warning' : 'danger'}>
                  {t.detail.averageResult}: {avgScore}%
                </Badge>
              )}
            </div>
            <ModuleResultsPanel teacher={teacher} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Link
            to={`/teachers/${teacher.id}`}
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <ExternalLink size={14} />
            {t.detail.openFullProfile}
          </Link>
        </div>
      </div>
    </div>
  );
}
