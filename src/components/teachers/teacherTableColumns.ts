import type { SortKey } from '../../utils/teacherFilters';
import type { Dict } from '../../i18n/translations';

export interface TeacherColumnDef {
  key: string;
  sortKey?: SortKey;
  defaultVisible: boolean;
  alwaysVisible?: boolean;
  label: (t: Dict) => string;
}

// Зафиксированный единый порядок базовых колонок (одинаков на всех
// вкладках 2–9 и 10–11 классов): Tabeçilik, Школа, ФИО, Год начала/стаж,
// LMS ID, Назначенные классы, Тип обучения — дальше служебные метрики и
// остальные поля, включаемые по кнопке "Столбцы 👁️". Вынесено в отдельный
// модуль, чтобы страница со списком учителей могла использовать тот же
// набор ключей для модалки настройки экспорта (по умолчанию отмечены
// ровно те столбцы, что сейчас видны в таблице).
export const TEACHER_TABLE_COLUMNS: TeacherColumnDef[] = [
  { key: 'district', sortKey: 'district', alwaysVisible: true, defaultVisible: true, label: (t) => t.columns.district },
  { key: 'school', sortKey: 'school', defaultVisible: true, label: (t) => t.columns.school },
  { key: 'fullName', sortKey: 'fullName', alwaysVisible: true, defaultVisible: true, label: (t) => t.columns.fullName },
  { key: 'startYear', defaultVisible: true, label: (t) => t.detail.fields.startYear },
  { key: 'lmsId', defaultVisible: true, label: (t) => t.detail.fields.lmsId },
  { key: 'classesTaught', defaultVisible: true, label: (t) => t.detail.fields.classesTaught },
  { key: 'trainingType', sortKey: 'trainingType', defaultVisible: true, label: (t) => t.columns.trainingType },
  { key: 'averageScore', sortKey: 'averageScore', defaultVisible: true, label: (t) => t.columns.averageScore },
  { key: 'result', defaultVisible: true, label: (t) => t.quickList.columnScore },
  { key: 'sector', defaultVisible: false, label: (t) => t.filters.sectorSection },
  { key: 'gradeGroup', sortKey: 'gradeGroup', defaultVisible: false, label: (t) => t.columns.gradeGroup },
  { key: 'lifecycleStatus', sortKey: 'lifecycleStatus', defaultVisible: false, label: (t) => t.columns.lifecycleStatus },
  { key: 'platformStatus', sortKey: 'platformStatus', defaultVisible: false, label: (t) => t.columns.platformStatus },
  { key: 'fin', defaultVisible: false, label: (t) => t.detail.fields.fin },
  { key: 'phone', defaultVisible: false, label: (t) => t.detail.fields.phone },
  { key: 'email', defaultVisible: false, label: (t) => t.detail.fields.email },
];

export const DEFAULT_VISIBLE_TEACHER_COLUMNS = new Set(
  TEACHER_TABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
);
