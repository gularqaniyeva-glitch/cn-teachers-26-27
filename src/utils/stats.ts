import type { GradeGroup, ModuleDefinition, Teacher, TrainingType } from '../types/teacher';
import { LIFECYCLE_STATUSES, MODULES, TRAINING_TYPES, getModule, modulesForGrade } from '../data/constants';

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
  /** Сколько учителей должны проходить этот модуль (входит в их программу) */
  assigned: number;
  /** Сколько уже начали сдавать (сдал или не сдал) */
  started: number;
  passed: number;
  /** Доля прошедших среди начавших, % */
  passRate: number;
}

/** Один проход по всем результатам всех учителей вместо N проходов на каждый модуль каталога — важно на реальных ~6000 строках */
export function getModuleStats(teachers: Teacher[]): ModuleStat[] {
  const byModule = new Map<string, { assigned: number; started: number; passed: number }>();

  for (const t of teachers) {
    for (const r of t.moduleResults) {
      const entry = byModule.get(r.moduleId) ?? { assigned: 0, started: 0, passed: 0 };
      entry.assigned += 1;
      if (r.status === 'passed' || r.status === 'failed') {
        entry.started += 1;
        if (r.status === 'passed') entry.passed += 1;
      }
      byModule.set(r.moduleId, entry);
    }
  }

  return MODULES.map((module) => {
    const entry = byModule.get(module.id) ?? { assigned: 0, started: 0, passed: 0 };
    return {
      moduleId: module.id,
      shortTitle: module.shortTitle,
      group: module.group,
      assigned: entry.assigned,
      started: entry.started,
      passed: entry.passed,
      passRate: passRateOf(entry.passed, entry.started),
    };
  });
}

export interface GradeGroupModuleStat {
  group: GradeGroup;
  assigned: number;
  started: number;
  passed: number;
  passRate: number;
  modules: ModuleStat[];
}

/** Статистика модулей, агрегированная по группам классов — для Главной и Статистики */
export function getModuleStatsByGradeGroup(teachers: Teacher[], groups: GradeGroup[]): GradeGroupModuleStat[] {
  const allModuleStats = getModuleStats(teachers);

  return groups.map((group) => {
    const modules = allModuleStats.filter((m) => m.group === group);
    const started = modules.reduce((sum, m) => sum + m.started, 0);
    const passed = modules.reduce((sum, m) => sum + m.passed, 0);
    return {
      group,
      // "Назначено" на уровне группы — это учителя, у которых есть хотя бы
      // один модуль этой параллели (а не строго teacher.gradeGroup === group,
      // так как один учитель может вести сразу несколько параллелей).
      assigned: teachers.filter((t) => t.moduleResults.some((r) => getModule(r.moduleId)?.group === group)).length,
      started,
      passed,
      passRate: passRateOf(passed, started),
      modules,
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
 * "нет данных" здесь принципиально не показываем: пустая строка бывает
 * только в исключительном случае, когда у учителя нет вообще ни одного
 * назначенного модуля — тогда используем то, что реально есть в Sheets,
 * либо прочерк.
 */
export function formatAssignedClassesLabel(teacher: Teacher, gradeGroupLabels: Record<GradeGroup, string>): string {
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
