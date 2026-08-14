import type { GradeGroup, ModuleStatus, Teacher, TeachingLanguage, TrainingType } from '../types/teacher';
import type { ModuleDefinition } from '../types/teacher';
import { GRADE_GROUPS, modulesForGrade } from '../data/constants';
import { getApplicableModules } from './stats';

/** Статус модуля, дополненный производным диагностическим значением "на проверку" */
export type DisplayModuleStatus = ModuleStatus | 'on_review';

const INDIVIDUAL_PASS_THRESHOLD = 0.7;
const GROUP_ZERO_THRESHOLD = 0.8;
const GROUP_PROGRESS_THRESHOLD = 0.5;
const GROUP_MIN_TEACHERS = 3;

/**
 * Индивидуальная аномалия: учитель сдал больше 70% всех модулей своей
 * программы, но конкретный модуль всё ещё "не начат" — скорее всего
 * сбой выгрузки LMS, а не реальный пропуск.
 */
export function getAnomalousModuleIds(teacher: Teacher): string[] {
  const applicable = getApplicableModules(teacher);
  if (applicable.length === 0) return [];

  const passedCount = teacher.moduleResults.filter((r) => r.status === 'passed').length;
  const passedRatio = passedCount / applicable.length;
  if (passedRatio <= INDIVIDUAL_PASS_THRESHOLD) return [];

  const notStartedIds = teacher.moduleResults.filter((r) => r.status === 'not_started').map((r) => r.moduleId);
  if (notStartedIds.length === 0 || notStartedIds.length === applicable.length) return [];
  return notStartedIds;
}

export function hasAnomaly(teacher: Teacher): boolean {
  return getAnomalousModuleIds(teacher).length > 0;
}

/**
 * Статус конкретного модуля у учителя с учётом авто-аудита: "не начал",
 * который сам детектор считает вероятным сбоем выгрузки LMS, получает
 * отдельное производное значение "on_review" — это не меняет реальные
 * сохранённые данные, только то, как модуль отображается и фильтруется.
 */
export function getEffectiveModuleStatus(teacher: Teacher, moduleId: string): DisplayModuleStatus {
  const result = teacher.moduleResults.find((r) => r.moduleId === moduleId);
  const status = result?.status ?? 'not_started';
  if (status === 'not_started' && getAnomalousModuleIds(teacher).includes(moduleId)) return 'on_review';
  return status;
}

export interface IndividualAnomaly {
  teacher: Teacher;
  moduleIds: string[];
}

export function findIndividualAnomalies(teachers: Teacher[]): IndividualAnomaly[] {
  const out: IndividualAnomaly[] = [];
  for (const teacher of teachers) {
    const moduleIds = getAnomalousModuleIds(teacher);
    if (moduleIds.length > 0) out.push({ teacher, moduleIds });
  }
  return out;
}

export interface GroupAnomaly {
  gradeGroup: GradeGroup;
  module: ModuleDefinition;
  sector: TeachingLanguage;
  trainingType: TrainingType;
  teacherCount: number;
  /** Доля "не начал" по этому модулю внутри группы, % */
  zeroRatio: number;
  /** Средний прогресс группы по ОСТАЛЬНЫМ модулям, % */
  overallProgress: number;
}

/**
 * Массовая аномалия: в конкретной группе (параллель + сектор + формат
 * обучения) почти все "не начали" один и тот же модуль, хотя по
 * остальным модулям эта же группа показывает хороший прогресс —
 * похоже на сбой выгрузки именно этого модуля для этого сегмента.
 */
export function findGroupAnomalies(teachers: Teacher[]): GroupAnomaly[] {
  const buckets = new Map<string, Teacher[]>();
  for (const teacher of teachers) {
    const key = `${teacher.gradeGroup}|${teacher.language}|${teacher.trainingType}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(teacher);
    else buckets.set(key, [teacher]);
  }

  const results: GroupAnomaly[] = [];

  for (const [key, group] of buckets) {
    if (group.length < GROUP_MIN_TEACHERS) continue;
    const [gradeGroup, sector, trainingType] = key.split('|') as [GradeGroup, TeachingLanguage, TrainingType];
    if (!GRADE_GROUPS.includes(gradeGroup)) continue;

    for (const module of modulesForGrade(gradeGroup)) {
      const resultsForModule = group
        .map((teacher) => teacher.moduleResults.find((r) => r.moduleId === module.id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r));
      if (resultsForModule.length === 0) continue;

      const notStartedCount = resultsForModule.filter((r) => r.status === 'not_started').length;
      const zeroRatio = notStartedCount / resultsForModule.length;
      if (zeroRatio <= GROUP_ZERO_THRESHOLD) continue;

      const otherResults = group.flatMap((teacher) => teacher.moduleResults.filter((r) => r.moduleId !== module.id));
      const startedOther = otherResults.filter((r) => r.status !== 'not_started');
      if (startedOther.length === 0) continue;
      const passedOther = startedOther.filter((r) => r.status === 'passed').length;
      const overallProgress = passedOther / startedOther.length;
      if (overallProgress < GROUP_PROGRESS_THRESHOLD) continue;

      results.push({
        gradeGroup,
        module,
        sector,
        trainingType,
        teacherCount: group.length,
        zeroRatio: Math.round(zeroRatio * 100),
        overallProgress: Math.round(overallProgress * 100),
      });
    }
  }

  return results;
}

function groupAnomalyKey(gradeGroup: GradeGroup, moduleId: string, sector: TeachingLanguage, trainingType: TrainingType): string {
  return `${gradeGroup}|${moduleId}|${sector}|${trainingType}`;
}

/** Набор ключей "группа+модуль", отмеченных как массовая аномалия — для быстрой построчной проверки в таблицах */
export function buildGroupAnomalyKeySet(teachers: Teacher[]): Set<string> {
  return new Set(
    findGroupAnomalies(teachers).map((a) => groupAnomalyKey(a.gradeGroup, a.module.id, a.sector, a.trainingType)),
  );
}

export function isGroupAnomalyRow(set: Set<string>, teacher: Teacher, moduleId: string): boolean {
  return set.has(groupAnomalyKey(teacher.gradeGroup, moduleId, teacher.language, teacher.trainingType));
}
