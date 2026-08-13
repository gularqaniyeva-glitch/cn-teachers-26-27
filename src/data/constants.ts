import type {
  GradeGroup,
  ModuleDefinition,
  TeacherLifecycleStatus,
  TrainingType,
} from '../types/teacher';

export const DISTRICTS = [
  'Bakı',
  'Gəncə',
  'Sumqayıt',
  'Şəki',
  'Lənkəran',
  'Naxçıvan',
  'Qəbələ',
  'Masallı',
  'Göyçay',
  'Bərdə',
  'Şirvan',
  'Mingəçevir',
] as const;

export const GRADE_GROUPS: GradeGroup[] = ['2-4', '5-9', '10-11'];

export const TRAINING_TYPES: TrainingType[] = ['asinxron', 'onlayn', 'əyani'];

export const LIFECYCLE_STATUSES: TeacherLifecycleStatus[] = ['OLD', 'NEW'];

// У каждой параллели своя отдельная программа — модули нумеруются с M1
// в рамках своей группы классов, без сквозной нумерации между группами.
const MODULE_COUNTS: Record<GradeGroup, number> = {
  '2-4': 6,
  '5-9': 13,
  '10-11': 8,
};

export const MODULES: ModuleDefinition[] = GRADE_GROUPS.flatMap((group) =>
  Array.from({ length: MODULE_COUNTS[group] }, (_, i) => {
    const index = i + 1;
    return { id: `${group}-M${index}`, shortTitle: `M${index}`, group, index };
  }),
);

export function modulesForGrade(group: GradeGroup): ModuleDefinition[] {
  return MODULES.filter((m) => m.group === group);
}

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}
