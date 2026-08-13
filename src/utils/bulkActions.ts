import type { ModuleResult, Teacher } from '../types/teacher';
import { getApplicableModules } from './stats';

/** Назначен ли этому учителю данный модуль (по его группе классов) */
export function moduleAppliesToTeacher(teacher: Teacher, moduleId: string): boolean {
  return getApplicableModules(teacher).some((m) => m.id === moduleId);
}

/** Добавляет/заменяет результат конкретного модуля у учителя, остальные результаты не трогает */
export function upsertModuleResult(results: ModuleResult[], moduleId: string, passed: boolean): ModuleResult[] {
  const score = passed ? 85 : 45;
  const withoutModule = results.filter((r) => r.moduleId !== moduleId);
  return [...withoutModule, { moduleId, passed, score }];
}
