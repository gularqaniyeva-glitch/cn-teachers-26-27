import type { ModuleDefinition, Teacher } from '../types/teacher';
import { modulesForGrade } from '../data/constants';
import { getApplicableModules } from './stats';

// В тестовом контуре реальных дедлайнов из Google Sheets пока нет.
// Моделируем календарь модулей относительно даты просмотра сайта, чтобы
// демонстрация всегда показывала реалистичную смесь наступивших и
// будущих сроков (модули с меньшим номером — раньше по программе,
// поэтому их дедлайн ближе к прошлому). Когда подключится реальный
// источник дедлайнов, эта функция заменится на чтение настоящей даты.
export function getModuleDeadline(module: ModuleDefinition, now: Date = new Date()): Date {
  const total = modulesForGrade(module.group).length;
  const mid = (total + 1) / 2;
  const offsetDays = Math.round((module.index - mid) * 12);
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + offsetDays);
  return deadline;
}

export function isModuleDue(module: ModuleDefinition, now: Date = new Date()): boolean {
  return getModuleDeadline(module, now).getTime() <= now.getTime();
}

export interface DeadlineStats {
  assigned: number;
  due: number;
  passedDue: number;
  /** null — ни один дедлайн ещё не наступил */
  percent: number | null;
}

export function getTeacherDeadlineStats(teacher: Teacher, now: Date = new Date()): DeadlineStats {
  const applicable = getApplicableModules(teacher);
  const dueModules = applicable.filter((m) => isModuleDue(m, now));
  const dueIds = new Set(dueModules.map((m) => m.id));
  const passedDue = teacher.moduleResults.filter((r) => dueIds.has(r.moduleId) && r.status === 'passed').length;
  return {
    assigned: applicable.length,
    due: dueModules.length,
    passedDue,
    percent: dueModules.length > 0 ? Math.round((passedDue / dueModules.length) * 100) : null,
  };
}
