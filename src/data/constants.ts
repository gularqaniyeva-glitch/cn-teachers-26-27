import type {
  GradeGroup,
  ModuleDefinition,
  PlatformStatus,
  TeacherLifecycleStatus,
  TeachingLanguage,
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

export const GRADE_GROUP_LABELS: Record<GradeGroup, string> = {
  '2-4': '2–4 классы',
  '5-9': '5–9 классы',
  '10-11': '10–11 классы',
};

export const TRAINING_TYPES: TrainingType[] = ['asinxron', 'onlayn', 'əyani'];

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  asinxron: 'Asinxron',
  onlayn: 'Onlayn',
  əyani: 'Əyani',
};

export const LIFECYCLE_STATUSES: TeacherLifecycleStatus[] = ['OLD', 'NEW'];

export const LANGUAGE_LABELS: Record<TeachingLanguage, string> = {
  az: 'Азербайджанский',
  ru: 'Русский',
};

export const PLATFORM_STATUS_LABELS: Record<PlatformStatus, string> = {
  entered: 'Вошёл',
  not_entered: 'Не вошёл',
};

// M1 и M2 — общие модули для всех учителей.
// Остальные модули относятся к конкретной группе классов.
export const MODULES: ModuleDefinition[] = [
  { id: 'M1', title: 'M1 — Общий модуль 1', shortTitle: 'M1', group: 'common' },
  { id: 'M2', title: 'M2 — Общий модуль 2', shortTitle: 'M2', group: 'common' },
  { id: 'M-24-1', title: 'Модуль для 2–4 классов, часть 1', shortTitle: '2–4 (1)', group: '2-4' },
  { id: 'M-24-2', title: 'Модуль для 2–4 классов, часть 2', shortTitle: '2–4 (2)', group: '2-4' },
  { id: 'M-59-1', title: 'Модуль для 5–9 классов, часть 1', shortTitle: '5–9 (1)', group: '5-9' },
  { id: 'M-59-2', title: 'Модуль для 5–9 классов, часть 2', shortTitle: '5–9 (2)', group: '5-9' },
  { id: 'M-1011-1', title: 'Модуль для 10–11 классов, часть 1', shortTitle: '10–11 (1)', group: '10-11' },
  { id: 'M-1011-2', title: 'Модуль для 10–11 классов, часть 2', shortTitle: '10–11 (2)', group: '10-11' },
];

export function modulesForGrade(group: GradeGroup): ModuleDefinition[] {
  return MODULES.filter((m) => m.group === 'common' || m.group === group);
}

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}
