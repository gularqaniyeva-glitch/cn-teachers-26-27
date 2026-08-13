import type { Teacher } from '../types/teacher';
import { MODULES, modulesForGrade } from '../data/constants';

export interface OverviewStats {
  total: number;
  entered: number;
  notEntered: number;
  /** Доля пройденных результатов модулей среди всех имеющихся результатов, % */
  successRate: number;
}

export function getOverviewStats(teachers: Teacher[]): OverviewStats {
  const total = teachers.length;
  const entered = teachers.filter((t) => t.platformStatus === 'entered').length;
  const allResults = teachers.flatMap((t) => t.moduleResults);
  const passed = allResults.filter((r) => r.passed).length;
  const successRate = allResults.length > 0 ? Math.round((passed / allResults.length) * 100) : 0;

  return { total, entered, notEntered: total - entered, successRate };
}

/** Средний результат учителя по всем пройденным/непройденным модулям, % (null — нет данных) */
export function getTeacherAverageScore(teacher: Teacher): number | null {
  if (teacher.moduleResults.length === 0) return null;
  const sum = teacher.moduleResults.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / teacher.moduleResults.length);
}

export interface ModuleStat {
  moduleId: string;
  title: string;
  shortTitle: string;
  /** Сколько учителей должны проходить этот модуль (входит в их программу) */
  assigned: number;
  /** Сколько уже сдавали (есть результат) */
  completed: number;
  passed: number;
  /** Доля прошедших среди сдававших, % */
  passRate: number;
}

export function getModuleStats(teachers: Teacher[]): ModuleStat[] {
  return MODULES.map((module) => {
    const assigned = teachers.filter(
      (t) => module.group === 'common' || t.gradeGroup === module.group,
    ).length;
    const results = teachers.flatMap((t) => t.moduleResults).filter((r) => r.moduleId === module.id);
    const passed = results.filter((r) => r.passed).length;
    return {
      moduleId: module.id,
      title: module.title,
      shortTitle: module.shortTitle,
      assigned,
      completed: results.length,
      passed,
      passRate: results.length > 0 ? Math.round((passed / results.length) * 100) : 0,
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
