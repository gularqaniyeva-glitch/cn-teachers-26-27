import type { GradeGroup, ModuleDefinition, Teacher, TrainingType } from '../types/teacher';
import { LIFECYCLE_STATUSES, TRAINING_TYPES, getModule, modulesForGrade } from '../data/constants';

export interface OverviewStats {
  total: number;
  entered: number;
  notEntered: number;
  /** Доля "Сдал" среди уже начатых модулей (без учёта "Не начал"), % */
  successRate: number;
}

function passRateOf(passed: number, started: number): number {
  return started > 0 ? Math.round((passed / started) * 100) : 0;
}

export function getOverviewStats(teachers: Teacher[]): OverviewStats {
  const total = teachers.length;
  let entered = 0;
  let passed = 0;
  let started = 0;

  for (const t of teachers) {
    if (t.platformStatus === 'entered') entered += 1;
    for (const r of t.moduleResults) {
      if (r.status === 'passed' || r.status === 'failed') {
        started += 1;
        if (r.status === 'passed') passed += 1;
      }
    }
  }

  return { total, entered, notEntered: total - entered, successRate: passRateOf(passed, started) };
}

/** Средний результат учителя по всем модулям его программы (0 — за "не начал"), % */
export function getTeacherAverageScore(teacher: Teacher): number | null {
  if (teacher.moduleResults.length === 0) return null;
  const sum = teacher.moduleResults.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / teacher.moduleResults.length);
}

/**
 * Учебный год завершён, отдельного листа с дедлайнами в Google Sheets
 * пока нет — поэтому процент выполнения считается по ВСЕМ назначенным
 * учителю модулям программы (M1–M6 для 2–4 кл, M1–M13 для 5–9 кл), без
 * учёта сроков. Когда дедлайны появятся в источнике данных, переключить
 * этот флаг на true и перевести getTeacherOverallStats на
 * getTeacherDeadlineStats (см. utils/deadlines.ts) — учитывать только
 * модули с уже наступившим дедлайном.
 */
export const useDeadlines = false;

export interface TeacherOverallStats {
  /** Всего модулей, реально назначенных этому учителю */
  assigned: number;
  /** Сколько из них сдано успешно */
  passed: number;
  /** Доля сданного от всех назначенных модулей, % (0 — за "не начал"/"не сдал") */
  percent: number;
}

/**
 * Успеваемость учителя от ВСЕХ назначенных ему модулей — без учёта
 * дедлайнов (вкладки с дедлайнами в источнике данных пока нет). Когда
 * дедлайны появятся, здесь и в местах её использования подключится
 * utils/deadlines.ts вместо этой функции.
 */
export function getTeacherOverallStats(teacher: Teacher): TeacherOverallStats {
  const assigned = teacher.moduleResults.length;
  const passed = teacher.moduleResults.filter((r) => r.status === 'passed').length;
  return { assigned, passed, percent: assigned > 0 ? Math.round((passed / assigned) * 100) : 0 };
}

export interface ModuleStat {
  moduleId: string;
  shortTitle: string;
  group: GradeGroup;
  /** Всего учителей, которым модуль назначен по программе — для M1/M2 это ВСЯ система (обе параллели), а не только текущая вкладка */
  assigned: number;
  /** Сколько из них сдали: балл >=70% либо статус "Старый учитель" */
  passed: number;
  passRate: number;
}

const SHARED_MODULE_SHORT_TITLES = new Set(['M1', 'M2']);

/**
 * Статистика по каждому модулю ОДНОЙ параллели, с "умным" знаменателем:
 * - M1/M2 общие для 2–4 и 5–9 и назначены НЕЗАВИСИМО от параллели —
 *   поэтому их база (знаменатель) это ВСЕ учителя основных 2–9 классов
 *   сразу (обе параллели вместе), а не только те, кто относится к
 *   текущей вкладке.
 * - M3 и далее — база строго по учителям, которым назначена именно эта
 *   параллель (включая тех, кто ведёт сразу обе — getAssignedGradeGroups).
 * В числитель ("сдали") попадают только те, у кого балл >=70%, либо
 * статус "Старый учитель" (по бизнес-правилу их не считаем должниками).
 * Учителя без назначенного класса (hasAssignedClass=false) исключены из
 * любого знаменателя — их отсутствие параллели не портит процент другим.
 */
export function getModuleStatsForGroup(teachers: Teacher[], group: GradeGroup): ModuleStat[] {
  const eligible = teachers.filter((te) => te.hasAssignedClass);
  const sharedPopulation = eligible.filter((te) => te.gradeGroup !== '10-11');

  return modulesForGrade(group).map((m) => {
    const shared = SHARED_MODULE_SHORT_TITLES.has(m.shortTitle);
    const population = shared
      ? sharedPopulation
      : eligible.filter((te) => getAssignedGradeGroups(te).includes(group));
    const moduleIdsToCheck = shared ? [`2-4-${m.shortTitle}`, `5-9-${m.shortTitle}`] : [m.id];

    let assigned = 0;
    let passed = 0;
    for (const teacher of population) {
      const result = teacher.moduleResults.find((r) => moduleIdsToCheck.includes(r.moduleId));
      if (!result) continue;
      assigned += 1;
      if (result.status === 'old_teacher' || result.score >= PASS_THRESHOLD) passed += 1;
    }

    return {
      moduleId: m.id,
      shortTitle: m.shortTitle,
      group,
      assigned,
      passed,
      passRate: assigned > 0 ? Math.round((passed / assigned) * 100) : 0,
    };
  });
}

export interface CountEntry<T extends string = string> {
  key: T;
  label: string;
  count: number;
  percent: number;
}

export function countByKey<T extends string>(
  teachers: Teacher[],
  keyFn: (t: Teacher) => T,
  labels: Record<T, string>,
  order: readonly T[],
): CountEntry<T>[] {
  const total = teachers.length || 1;
  const counts = new Map<T, number>();
  for (const t of teachers) {
    const key = keyFn(t);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return order.map((key) => {
    const count = counts.get(key) ?? 0;
    return { key, label: labels[key], count, percent: Math.round((count / total) * 100) };
  });
}

/**
 * Модули, реально назначенные конкретному учителю. Берём напрямую из его
 * moduleResults (а не жёстко по teacher.gradeGroup) — в реальных данных
 * один учитель может одновременно вести, например, и 2–4, и 5–9 классы,
 * и тогда у него есть модули из обеих программ сразу.
 */
export function getApplicableModules(teacher: Teacher): ModuleDefinition[] {
  if (teacher.moduleResults.length === 0) return modulesForGrade(teacher.gradeGroup);
  return teacher.moduleResults
    .map((r) => getModule(r.moduleId))
    .filter((m): m is ModuleDefinition => Boolean(m));
}

/**
 * Какие параллели реально ведёт учитель — определяем напрямую по префиксу
 * id его назначенных модулей (2-4-M.../5-9-M...), а не по единственному
 * teacher.gradeGroup, которое хранит только "основную" параллель и не
 * покажет вторую у двухпараллельных учителей.
 */
export function getAssignedGradeGroups(teacher: Teacher): GradeGroup[] {
  if (teacher.gradeGroup === '10-11') return ['10-11'];
  const groups: GradeGroup[] = [];
  if (teacher.moduleResults.some((r) => r.moduleId.startsWith('2-4-'))) groups.push('2-4');
  if (teacher.moduleResults.some((r) => r.moduleId.startsWith('5-9-'))) groups.push('5-9');
  return groups;
}

/**
 * Текст для колонки "Классы" — вместо сырого (часто пустого) значения из
 * Sheets выводим параллели, реально выведенные из назначенных модулей.
 * Если учителю ещё не назначили класс/параллель вовсе (hasAssignedClass
 * false) — явно говорим об этом, а не подставляем технический gradeGroup
 * по умолчанию как будто это настоящее назначение. "нет данных" в этой
 * колонке принципиально не показываем.
 */
export function formatAssignedClassesLabel(
  teacher: Teacher,
  gradeGroupLabels: Record<GradeGroup, string>,
  notAssignedLabel: string,
): string {
  if (!teacher.hasAssignedClass) return notAssignedLabel;
  const groups = getAssignedGradeGroups(teacher);
  if (groups.length > 0) return groups.map((g) => gradeGroupLabels[g]).join(', ');
  return teacher.classesTaught || '—';
}

/**
 * Общий процент "сдал аттестацию" по всем учителям — доля модулей со
 * статусом "Сдал" среди ВСЕХ назначенных модулей (не только начатых, в
 * отличие от OverviewStats.successRate) — тот же принцип "конец года,
 * считаем от всего назначенного", что и в getTeacherOverallStats.
 */
export function getOverallPassPercent(teachers: Teacher[]): number {
  let assigned = 0;
  let passed = 0;
  for (const teacher of teachers) {
    for (const r of teacher.moduleResults) {
      assigned += 1;
      if (r.status === 'passed') passed += 1;
    }
  }
  return assigned > 0 ? Math.round((passed / assigned) * 100) : 0;
}

/**
 * "Прошёл курс" — считаем по УЧИТЕЛЮ (человеку), а не по сумме отдельных
 * модулей: все его назначенные модули набрали >=70%. Модули со статусом
 * old_teacher по бизнес-правилу исключаются из проверки (таких учителей
 * не считаем должниками) — если после исключения ничего не остаётся,
 * учитель всё равно засчитывается прошедшим.
 */
export function hasTeacherPassedCourse(teacher: Teacher): boolean {
  const relevant = teacher.moduleResults.filter((r) => r.status !== 'old_teacher');
  if (relevant.length === 0) return teacher.moduleResults.length > 0;
  return relevant.every((r) => r.score >= PASS_THRESHOLD);
}

export interface GradeGroupTeacherPassStat {
  group: GradeGroup;
  totalTeachers: number;
  passedTeachers: number;
  percent: number;
}

/**
 * KPI по ФИЗИЧЕСКИМ учителям (1 человек = 1 сущность), а не по сумме
 * сданных модулей — "X из Y учителей прошли курс (Z%)" по каждой
 * параллели. Учителя без назначенного класса (hasAssignedClass=false) не
 * входят ни в одну параллель — их результаты видны в таблицах, но в этот
 * KPI они не в знаменателе ни одной группы.
 */
export function getTeacherPassStatsByGradeGroup(teachers: Teacher[], groups: GradeGroup[]): GradeGroupTeacherPassStat[] {
  return groups.map((group) => {
    const groupTeachers = teachers.filter((te) => te.hasAssignedClass && getAssignedGradeGroups(te).includes(group));
    const passedTeachers = groupTeachers.filter(hasTeacherPassedCourse).length;
    return {
      group,
      totalTeachers: groupTeachers.length,
      passedTeachers,
      percent: groupTeachers.length > 0 ? Math.round((passedTeachers / groupTeachers.length) * 100) : 0,
    };
  });
}

export interface OverallTeacherPassStat {
  totalTeachers: number;
  passedTeachers: number;
  percent: number;
}

/** То же самое, но по всем учителям сразу (для верхней KPI-карточки) */
export function getOverallTeacherPassStat(teachers: Teacher[]): OverallTeacherPassStat {
  const eligible = teachers.filter((te) => te.hasAssignedClass);
  const passedTeachers = eligible.filter(hasTeacherPassedCourse).length;
  return {
    totalTeachers: eligible.length,
    passedTeachers,
    percent: eligible.length > 0 ? Math.round((passedTeachers / eligible.length) * 100) : 0,
  };
}

/** Подставляет {passed}/{total}/{percent} в шаблон вида "{passed} из {total} учителей..." */
export function formatTeachersPassed(template: string, passed: number, total: number, percent: number): string {
  return template
    .replace('{passed}', String(passed))
    .replace('{total}', String(total))
    .replace('{percent}', String(percent));
}

export interface TrainingTypeSummary {
  type: TrainingType;
  count: number;
  /** % учителей этого типа обучения, хотя бы раз заходивших на платформу */
  enteredPercent: number;
  /** % "Сдал" среди начатых модулей (см. OverviewStats.successRate) */
  successRate: number;
}

/** Сводка "Кол-во учителей | % заходивших | % успеваемости" по каждому типу обучения */
export function getTrainingTypeSummary(teachers: Teacher[]): TrainingTypeSummary[] {
  return TRAINING_TYPES.map((type) => {
    const subset = teachers.filter((te) => te.trainingType === type);
    const overview = getOverviewStats(subset);
    return {
      type,
      count: subset.length,
      enteredPercent: subset.length > 0 ? Math.round((overview.entered / subset.length) * 100) : 0,
      successRate: overview.successRate,
    };
  });
}

export interface ModuleSegmentRow {
  moduleId: string;
  shortTitle: string;
  /** ключ сегмента (тип обучения либо OLD/NEW) -> % сдавших (score >= 70) среди назначенных этот модуль */
  values: Record<string, number>;
}

const PASS_THRESHOLD = 70;

/** Общий движок разбивки модулей одной параллели по произвольному сегменту (тип обучения, стаж, ...) — один проход по всем результатам */
function getModulePassRateBySegment<K extends string>(
  teachers: Teacher[],
  group: GradeGroup,
  segmentKeys: readonly K[],
  segmentOf: (teacher: Teacher) => K,
): ModuleSegmentRow[] {
  const modules = modulesForGrade(group);
  const acc = new Map<string, Map<K, { assigned: number; passed: number }>>();
  for (const m of modules) {
    const segMap = new Map<K, { assigned: number; passed: number }>();
    for (const key of segmentKeys) segMap.set(key, { assigned: 0, passed: 0 });
    acc.set(m.id, segMap);
  }

  for (const teacher of teachers) {
    const segment = segmentOf(teacher);
    for (const r of teacher.moduleResults) {
      const segMap = acc.get(r.moduleId);
      if (!segMap) continue;
      const entry = segMap.get(segment);
      if (!entry) continue;
      entry.assigned += 1;
      if (r.score >= PASS_THRESHOLD) entry.passed += 1;
    }
  }

  return modules.map((m) => {
    const segMap = acc.get(m.id)!;
    const values: Record<string, number> = {};
    for (const key of segmentKeys) {
      const { assigned, passed } = segMap.get(key)!;
      values[key] = assigned > 0 ? Math.round((passed / assigned) * 100) : 0;
    }
    return { moduleId: m.id, shortTitle: m.shortTitle, values };
  });
}

/** % сдавших (>=70%) каждый модуль параллели `group`, отдельно по типу обучения (asinxron/onlayn/əyani) */
export function getModulePassRateByTrainingType(teachers: Teacher[], group: GradeGroup): ModuleSegmentRow[] {
  return getModulePassRateBySegment(teachers, group, TRAINING_TYPES, (te) => te.trainingType);
}

/** % сдавших (>=70%) каждый модуль параллели `group`, отдельно по стажу (OLD/NEW) */
export function getModulePassRateByLifecycle(teachers: Teacher[], group: GradeGroup): ModuleSegmentRow[] {
  return getModulePassRateBySegment(teachers, group, LIFECYCLE_STATUSES, (te) => te.lifecycleStatus);
}
