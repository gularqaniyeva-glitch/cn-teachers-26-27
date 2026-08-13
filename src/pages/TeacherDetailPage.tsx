import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useTeacherStore } from '../store/useTeacherStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TeacherEditForm } from '../components/teacher/TeacherEditForm';
import { ModuleResultsPanel } from '../components/teacher/ModuleResultsPanel';
import { NotesPanel } from '../components/teacher/NotesPanel';
import {
  GRADE_GROUP_LABELS,
  LANGUAGE_LABELS,
  PLATFORM_STATUS_LABELS,
  TRAINING_TYPE_LABELS,
} from '../data/constants';
import { getTeacherAverageScore } from '../utils/stats';
import type { Teacher } from '../types/teacher';

function InfoRow({ label, value }: { label: string; value: string }) {
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
  const { teachers, loading, load, updateTeacher } = useTeacherStore();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const teacher = teachers.find((t) => t.id === id);

  if (loading && teachers.length === 0) {
    return <p className="text-slate-500">Загрузка данных…</p>;
  }

  if (!teacher) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate('/teachers')} />
        <p className="text-slate-500">Учитель не найден.</p>
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
          <BackButton onClick={() => navigate('/teachers')} />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{teacher.fullName}</h1>
            <p className="text-sm text-slate-500">{teacher.school}</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={15} />
            Редактировать
          </button>
        )}
      </div>

      {editing ? (
        <Card title="Редактирование данных">
          <TeacherEditForm teacher={teacher} onSave={handleSave} onCancel={() => setEditing(false)} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Основная информация">
            <InfoRow label="ФИО" value={teacher.fullName} />
            <InfoRow label="FIN" value={teacher.fin} />
            <InfoRow label="Телефон" value={teacher.phone} />
            <InfoRow label="LMS ID" value={teacher.lmsId} />
            <InfoRow label="Язык" value={LANGUAGE_LABELS[teacher.language]} />
          </Card>

          <Card title="Школа и обучение">
            <InfoRow label="Школа" value={teacher.school} />
            <InfoRow label="Район" value={teacher.district} />
            <InfoRow label="Классы" value={GRADE_GROUP_LABELS[teacher.gradeGroup]} />
            <InfoRow label="Тип обучения" value={TRAINING_TYPE_LABELS[teacher.trainingType]} />
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-slate-500">OLD / NEW</span>
              <Badge variant={teacher.lifecycleStatus === 'NEW' ? 'purple' : 'neutral'}>
                {teacher.lifecycleStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-slate-500">Статус платформы</span>
              <Badge variant={teacher.platformStatus === 'entered' ? 'success' : 'danger'} dot>
                {PLATFORM_STATUS_LABELS[teacher.platformStatus]}
              </Badge>
            </div>
          </Card>

          <Card
            title="Результаты модулей"
            action={
              avgScore !== null ? (
                <Badge variant={avgScore >= 70 ? 'success' : avgScore >= 50 ? 'warning' : 'danger'}>
                  Средний результат: {avgScore}%
                </Badge>
              ) : (
                <Badge variant="neutral">Нет данных</Badge>
              )
            }
            className="lg:col-span-2"
          >
            <ModuleResultsPanel teacher={teacher} />
          </Card>

          <Card title="Внутренняя заметка" className="lg:col-span-2">
            <NotesPanel note={teacher.note} onSave={(note) => updateTeacher(teacher.id, { note })} />
          </Card>
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      aria-label="Назад к списку"
    >
      <ArrowLeft size={16} />
    </button>
  );
}
