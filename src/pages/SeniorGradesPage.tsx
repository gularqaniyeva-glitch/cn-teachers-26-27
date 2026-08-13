import { TeacherListPage } from './TeacherListPage';
import { useT } from '../i18n/useLocaleStore';

export function SeniorGradesPage() {
  const t = useT();
  return <TeacherListPage gradeGroups={['10-11']} title={t.senior.title} subtitle={t.senior.subtitle} />;
}
