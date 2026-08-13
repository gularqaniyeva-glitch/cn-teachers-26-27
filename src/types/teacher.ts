// Основная модель данных приложения.
// Позже, при подключении Google Sheets, эта форма данных останется прежней —
// поменяется только то, откуда она берётся (см. src/services/teacherService.ts).

export type GradeGroup = '2-4' | '5-9' | '10-11';

export type TrainingType = 'asinxron' | 'onlayn' | 'əyani';

export type TeacherLifecycleStatus = 'OLD' | 'NEW';

export type TeachingLanguage = 'az' | 'ru';

export type PlatformStatus = 'entered' | 'not_entered';

export interface ModuleResult {
  moduleId: string;
  passed: boolean;
  /** Процент результата модуля, 0–100 */
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
  lmsId: string;
  language: TeachingLanguage;
  trainingType: TrainingType;
  lifecycleStatus: TeacherLifecycleStatus;
  gradeGroup: GradeGroup;
  platformStatus: PlatformStatus;
  moduleResults: ModuleResult[];
  /** Внутренняя заметка администратора, не видна учителю */
  note: string;
  updatedAt: string;
}

export interface ModuleDefinition {
  id: string;
  title: string;
  shortTitle: string;
  group: 'common' | GradeGroup;
}
