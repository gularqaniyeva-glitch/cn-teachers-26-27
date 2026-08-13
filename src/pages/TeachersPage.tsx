import { TeacherListPage } from './TeacherListPage';
import { useT } from '../i18n/useLocaleStore';

export function TeachersPage() {
  const t = useT();
  return <TeacherListPage gradeGroups={['2-4', '5-9']} title={t.teachers.title} subtitle={t.teachers.subtitle} />;
}
