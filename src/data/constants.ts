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

// Нумерация модулей взята из реальной структуры Google Sheets (не выдумана):
// - 2–4 классы: M1, M2 (общие для всех) + M3–M6 (свои для параллели) = 6
// - 5–9 классы: M1, M2 (общие) + M3–M13 плюс отдельный дополнительный
//   модуль "M9-2" = 14 модулей
// - 10–11 классы (отдельный лист таблицы): M3–M15, БЕЗ общих M1/M2 —
//   в этом листе таких колонок просто нет
function buildModules(group: GradeGroup, numbers: (number | string)[]): ModuleDefinition[] {
  return numbers.map((n, i) => ({
    id: `${group}-M${n}`,
    shortTitle: `M${n}`,
    group,
    index: i + 1,
  }));
}

export const MODULES: ModuleDefinition[] = [
  ...buildModules('2-4', [1, 2, 3, 4, 5, 6]),
  ...buildModules('5-9', [1, 2, 3, 4, 5, 6, 7, 8, 9, '9-2', 10, 11, 12, 13]),
  ...buildModules('10-11', [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
];

export function modulesForGrade(group: GradeGroup): ModuleDefinition[] {
  return MODULES.filter((m) => m.group === group);
}

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}

/** Сортировка "M9" перед "M9-2" перед "M10" — обычная сортировка строк тут не годится */
export function moduleSortKey(shortTitle: string): number {
  return parseFloat(shortTitle.replace('M', '').replace('-2', '.5'));
}

/** Уникальные короткие коды модулей (M1, M2, ..., M9-2, ...) для заданных параллелей, в правильном порядке */
export function getModuleTitlesForGroups(groups: GradeGroup[]): string[] {
  const titles = new Set<string>();
  for (const m of MODULES) {
    if (groups.includes(m.group)) titles.add(m.shortTitle);
  }
  return Array.from(titles).sort((a, b) => moduleSortKey(a) - moduleSortKey(b));
}
