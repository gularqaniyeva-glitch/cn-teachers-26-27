import type { ModuleResult, ModuleStatus, Teacher } from '../types/teacher';
import { getApplicableModules } from './stats';

/** Назначен ли этому учителю данный модуль (по его группе классов) */
export function moduleAppliesToTeacher(teacher: Teacher, moduleId: string): boolean {
  return getApplicableModules(teacher).some((m) => m.id === moduleId);
}

/** Задаёт статус конкретного модуля у учителя, остальные результаты не трогает */
export function upsertModuleResult(results: ModuleResult[], moduleId: string, status: ModuleStatus): ModuleResult[] {
  const score = status === 'passed' ? 85 : status === 'failed' ? 45 : 0;
  const withoutModule = results.filter((r) => r.moduleId !== moduleId);
  return [...withoutModule, { moduleId, status, score }];
}
