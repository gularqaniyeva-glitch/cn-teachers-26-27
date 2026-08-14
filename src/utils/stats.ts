import type { GradeGroup, Teacher } from '../types/teacher';
import { MODULES, modulesForGrade } from '../data/constants';

export interface OverviewStats {
  total: number;
  entered: number;
  notEntered: number;
  /** Доля "Сдал" среди уже начатых модулей (без учёта "Не начал"), % */
  successRate: number;
}

function passRateOf(results: { status: string }[]): number {
  const started = results.filter((r) => r.status === 'passed' || r.status === 'failed');
  if (started.length === 0) return 0;
  const passed = started.filter((r) => r.status === 'passed').length;
  return Math.round((passed / started.length) * 100);
}

export function getOverviewStats(teachers: Teacher[]): OverviewStats {
  const total = teachers.length;
  const entered = teachers.filter((t) => t.platformStatus === 'entered').length;
  const allResults = teachers.flatMap((t) => t.moduleResults);

  return { total, entered, notEntered: total - entered, successRate: passRateOf(allResults) };
}

/** Средний результат учителя по всем модулям его программы (0 — за "не начал"), % */
export function getTeacherAverageScore(teacher: Teacher): number | null {
  if (teacher.moduleResults.length === 0) return null;
  const sum = teacher.moduleResults.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / teacher.moduleResults.length);
}

export interface TeacherOverallStats {
  /** Всего модулей в программе его параллели */
  assigned: number;
  /** Сколько из них сдано успешно */
  passed: number;
  /** Доля сданного от всех назначенных модулей, % (0 — за "не начал"/"не сдал") */
  percent: number;
}

/**
 * Успеваемость учителя от ВСЕХ назначенных модулей программы — без учёта
 * дедлайнов (вкладки с дедлайнами в источнике данных пока нет). Когда
 * дедлайны появятся, здесь и в местах её использования подключится
 * utils/deadlines.ts вместо этой функции.
 */
export function getTeacherOverallStats(teacher: Teacher): TeacherOverallStats {
  const assigned = getApplicableModules(teacher).length;
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

export function getModuleStats(teachers: Teacher[]): ModuleStat[] {
  return MODULES.map((module) => {
    const assigned = teachers.filter((t) => t.gradeGroup === module.group).length;
    const results = teachers.flatMap((t) => t.moduleResults).filter((r) => r.moduleId === module.id);
    const started = results.filter((r) => r.status === 'passed' || r.status === 'failed');
    const passed = started.filter((r) => r.status === 'passed').length;
    return {
      moduleId: module.id,
      shortTitle: module.shortTitle,
      group: module.group,
      assigned,
      started: started.length,
      passed,
      passRate: passRateOf(results),
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
    const results = teachers
      .filter((t) => t.gradeGroup === group)
      .flatMap((t) => t.moduleResults);
    const started = results.filter((r) => r.status === 'passed' || r.status === 'failed');
    const passed = started.filter((r) => r.status === 'passed').length;
    return {
      group,
      assigned: teachers.filter((t) => t.gradeGroup === group).length,
      started: started.length,
      passed,
      passRate: passRateOf(results),
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

/** Модули, применимые к конкретному учителю (по его группе классов) */
export function getApplicableModules(teacher: Teacher) {
  return modulesForGrade(teacher.gradeGroup);
}
