import type { GradeGroup, ModuleDefinition, Teacher } from '../types/teacher';
import { MODULES, getModule, modulesForGrade } from '../data/constants';

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
