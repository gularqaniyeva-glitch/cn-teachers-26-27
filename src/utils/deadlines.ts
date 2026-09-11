import type { ModuleDefinition, Teacher } from '../types/teacher';
import { modulesForGrade } from '../data/constants';
import { getApplicableModules } from './stats';

// Синтетический календарь — запасной вариант ТОЛЬКО для тестовых данных
// (npm run dev без реального /api/sheets) или для модулей, для которых
// лист "(АЗ) График 26/27" не задал дедлайн. Когда у модуля есть реальная
// дата (Teacher.moduleResults[].deadline, см. services/scheduleMapping.ts),
// используется именно она — см. getModuleDeadlineForTeacher ниже.
function getSyntheticDeadline(module: ModuleDefinition, now: Date): Date {
  const total = modulesForGrade(module.group).length;
  const mid = (total + 1) / 2;
  const offsetDays = Math.round((module.index - mid) * 12);
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + offsetDays);
  return deadline;
}

/** Реальный дедлайн модуля из графика, если он есть у этого учителя, иначе синтетический (демо-режим). */
export function getModuleDeadlineForTeacher(teacher: Teacher, module: ModuleDefinition, now: Date = new Date()): Date {
  const real = teacher.moduleResults.find((r) => r.moduleId === module.id)?.deadline;
  if (real) {
    const parsed = new Date(real);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return getSyntheticDeadline(module, now);
}

function isModuleDueForTeacher(teacher: Teacher, module: ModuleDefinition, now: Date): boolean {
  return getModuleDeadlineForTeacher(teacher, module, now).getTime() <= now.getTime();
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
  const dueModules = applicable.filter((m) => isModuleDueForTeacher(teacher, m, now));
  const dueIds = new Set(dueModules.map((m) => m.id));
  const passedDue = teacher.moduleResults.filter((r) => dueIds.has(r.moduleId) && r.status === 'passed').length;
  return {
    assigned: applicable.length,
    due: dueModules.length,
    passedDue,
    percent: dueModules.length > 0 ? Math.round((passedDue / dueModules.length) * 100) : null,
  };
}
