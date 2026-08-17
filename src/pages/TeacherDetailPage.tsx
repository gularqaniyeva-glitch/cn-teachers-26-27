import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { NoTranslate } from '../components/ui/NoTranslate';
import { TeacherEditForm } from '../components/teacher/TeacherEditForm';
import { ModuleResultsPanel } from '../components/teacher/ModuleResultsPanel';
import { NotesPanel } from '../components/teacher/NotesPanel';
import { DeadlineStatsBar } from '../components/teacher/DeadlineStatsBar';
import { formatAssignedClassesLabel, getTeacherAverageScore } from '../utils/stats';
import type { Teacher } from '../types/teacher';
import { useT } from '../i18n/useLocaleStore';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useT();
  const { teachers, loading, load, updateTeacher } = useTeacherStore();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const teacher = teachers.find((t) => t.id === id);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">{t.common.loading}</p>;
  }

  if (!teacher) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate('/teachers')} label={t.common.backToList} />
        <p className="text-slate-500">{t.common.notFound}</p>
      </div>
    );
  }

  async function handleSave(patch: Partial<Teacher>) {
    await updateTeacher(teacher!.id, patch);
    setEditing(false);
  }

  const avgScore = getTeacherAverageScore(teacher);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => navigate('/teachers')} label={t.common.backToList} />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              <NoTranslate>{teacher.fullName}</NoTranslate>
            </h1>
            <p className="text-sm text-slate-500">
              <NoTranslate>{teacher.school}</NoTranslate>
            </p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={15} />
            {t.common.edit}
          </button>
        )}
      </div>

      {editing ? (
        <Card title={t.detail.editTitle}>
          <TeacherEditForm teacher={teacher} onSave={handleSave} onCancel={() => setEditing(false)} />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card title={t.deadlines.cardTitle}>
            <DeadlineStatsBar teacher={teacher} />
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title={t.detail.basicInfo}>
              <InfoRow label={t.detail.fields.fullName} value={<NoTranslate>{teacher.fullName}</NoTranslate>} />
              <InfoRow label={t.detail.fields.fin} value={<NoTranslate>{teacher.fin}</NoTranslate>} />
              <InfoRow label={t.detail.fields.phone} value={teacher.phone} />
              <InfoRow label={t.detail.fields.lmsId} value={<NoTranslate>{teacher.lmsId}</NoTranslate>} />
              <InfoRow label={t.detail.fields.language} value={t.language[teacher.language]} />
            </Card>

            <Card title={t.detail.schoolAndTraining}>
              <InfoRow label={t.detail.fields.school} value={<NoTranslate>{teacher.school}</NoTranslate>} />
              <InfoRow label={t.detail.fields.district} value={teacher.district} />
              <InfoRow label={t.detail.fields.gradeGroup} value={t.gradeGroup[teacher.gradeGroup]} />
              <InfoRow label={t.detail.fields.trainingType} value={t.trainingType[teacher.trainingType]} />
              <InfoRow
                label={t.detail.fields.classesTaught}
                value={formatAssignedClassesLabel(teacher, t.gradeGroup)}
              />
              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-slate-500">{t.detail.fields.lifecycleStatus}</span>
                <Badge variant={teacher.lifecycleStatus === 'NEW' ? 'purple' : 'neutral'}>
                  {teacher.lifecycleStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-slate-500">{t.detail.fields.platformStatus}</span>
                <Badge variant={teacher.platformStatus === 'entered' ? 'success' : 'danger'} dot>
                  {teacher.platformStatus === 'entered' ? t.platformStatus.entered : t.platformStatus.notEntered}
                </Badge>
              </div>
            </Card>

            <Card
              title={t.detail.moduleResults}
              action={
                avgScore !== null ? (
                  <Badge variant={avgScore >= 70 ? 'success' : avgScore >= 50 ? 'warning' : 'danger'}>
                    {t.detail.averageResult}: {avgScore}%
                  </Badge>
                ) : (
                  <Badge variant="neutral">{t.common.noData}</Badge>
                )
              }
              className="lg:col-span-2"
            >
              <ModuleResultsPanel teacher={teacher} />
            </Card>

            <Card title={t.detail.internalNote} className="lg:col-span-2">
              <NotesPanel note={teacher.note} onSave={(note) => updateTeacher(teacher.id, { note })} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      aria-label={label}
    >
      <ArrowLeft size={16} />
    </button>
  );
}
