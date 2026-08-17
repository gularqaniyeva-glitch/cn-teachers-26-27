import type { SortKey } from '../../utils/teacherFilters';
import type { Dict } from '../../i18n/translations';

export interface TeacherColumnDef {
  key: string;
  sortKey?: SortKey;
  defaultVisible: boolean;
  alwaysVisible?: boolean;
  label: (t: Dict) => string;
}

// По умолчанию видны 7 базовых колонок (ФИО, Школа, Район, Классы, Тип
// обучения, Средний результат %, Результат/Статус) — остальные включаются
// по кнопке "Столбцы 👁️". На реальных ~6000 строках меньше колонок =
// меньше DOM-узлов и быстрее рендер. Вынесено в отдельный модуль, чтобы
// страница со списком учителей могла использовать тот же набор ключей для
// модалки настройки экспорта (по умолчанию отмечены ровно те столбцы,
// что сейчас видны в таблице).
export const TEACHER_TABLE_COLUMNS: TeacherColumnDef[] = [
  { key: 'fullName', sortKey: 'fullName', alwaysVisible: true, defaultVisible: true, label: (t) => t.columns.fullName },
  { key: 'school', sortKey: 'school', defaultVisible: true, label: (t) => t.columns.school },
  { key: 'district', sortKey: 'district', defaultVisible: true, label: (t) => t.columns.district },
  { key: 'classesTaught', defaultVisible: true, label: (t) => t.detail.fields.classesTaught },
  { key: 'trainingType', sortKey: 'trainingType', defaultVisible: true, label: (t) => t.columns.trainingType },
  { key: 'averageScore', sortKey: 'averageScore', defaultVisible: true, label: (t) => t.columns.averageScore },
  { key: 'result', defaultVisible: true, label: (t) => t.quickList.columnScore },
  { key: 'sector', defaultVisible: false, label: (t) => t.filters.sectorSection },
  { key: 'gradeGroup', sortKey: 'gradeGroup', defaultVisible: false, label: (t) => t.columns.gradeGroup },
  { key: 'lifecycleStatus', sortKey: 'lifecycleStatus', defaultVisible: false, label: (t) => t.columns.lifecycleStatus },
  { key: 'platformStatus', sortKey: 'platformStatus', defaultVisible: false, label: (t) => t.columns.platformStatus },
  { key: 'lmsId', defaultVisible: false, label: (t) => t.detail.fields.lmsId },
  { key: 'fin', defaultVisible: false, label: (t) => t.detail.fields.fin },
  { key: 'phone', defaultVisible: false, label: (t) => t.detail.fields.phone },
  { key: 'startYear', defaultVisible: false, label: (t) => t.detail.fields.startYear },
];

export const DEFAULT_VISIBLE_TEACHER_COLUMNS = new Set(
  TEACHER_TABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
);
