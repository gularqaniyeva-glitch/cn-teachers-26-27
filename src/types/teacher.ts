// Основная модель данных приложения.
// Позже, при подключении Google Sheets, эта форма данных останется прежней —
// поменяется только то, откуда она берётся (см. src/services/teacherService.ts).

export type GradeGroup = '2-4' | '5-9' | '10-11';

export type TrainingType = 'asinxron' | 'onlayn' | 'əyani';

export type TeacherLifecycleStatus = 'OLD' | 'NEW';

export type TeachingLanguage = 'az' | 'ru';

export type PlatformStatus = 'entered' | 'not_entered';

/**
 * Статусы прохождения модуля. "old_teacher" — отдельная категория из
 * исходной таблицы ("Старый учитель" в тексте статуса): формально балл
 * низкий/нулевой, но по бизнес-правилу это не считается провалом — таких
 * учителей нельзя показывать как "Не прошёл"/0%.
 */
export type ModuleStatus = 'passed' | 'failed' | 'not_started' | 'old_teacher';

export interface ModuleResult {
  moduleId: string;
  status: ModuleStatus;
  /** Процент результата модуля, 0–100 (0 при статусе "не начал") */
  score: number;
}

export interface Teacher {
  id: string;
  fullName: string;
  school: string;
  district: string;
  /** Идентификационный номер (FIN) — в тестовых данных случайный, не связан с реальными людьми */
  fin: string;
  phone: string;
  email: string;
  lmsId: string;
  language: TeachingLanguage;
  trainingType: TrainingType;
  lifecycleStatus: TeacherLifecycleStatus;
  /** Год начала работы в LMS "как есть" из таблицы (lifecycleStatus — уже выведенный из него OLD/NEW статус) */
  startYear: string;
  gradeGroup: GradeGroup;
  platformStatus: PlatformStatus;
  /** Реальные классы, которые ведёт учитель (не путать с gradeGroup — это его параллель) */
  classesTaught: string;
  /**
   * false — учителю ещё не назначили класс/параллель в исходной таблице
   * (обе колонки "M3 ... Статус" говорят "нет класса" или пустые). gradeGroup
   * в этом случае — техническое значение по умолчанию, а не реальное
   * назначение; при этом уже выполненные модули (напр. M1/M2) всё равно
   * показываются как есть.
   */
  hasAssignedClass: boolean;
  moduleResults: ModuleResult[];
  /** Внутренняя заметка администратора, не видна учителю */
  note: string;
  updatedAt: string;
}

export interface ModuleDefinition {
  id: string;
  /** Отображаемый короткий код в рамках своей группы классов, напр. "M1" */
  shortTitle: string;
  group: GradeGroup;
  index: number;
}
