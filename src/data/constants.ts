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

export interface ModuleColumn {
  /** Уникальный ключ колонки — просто shortTitle, либо "M3:5-9" если номер неоднозначен */
  key: string;
  shortTitle: string;
  /** Заголовок для отображения — "M3" либо "M3 (5–9)", если этот номер есть в нескольких параллелях сразу */
  label: string;
  /** Все id модуля из каталога, которые нужно проверить у учителя для этой колонки (обычно один, для M1/M2 — два) */
  moduleIds: string[];
}

const GRADE_RANGE_LABEL: Record<GradeGroup, string> = { '2-4': '2–4', '5-9': '5–9', '10-11': '10–11' };

/**
 * Колонки модулей для заданного набора параллелей — с учётом того, что M1 и
 * M2 действительно ОБЩИЕ (у учителя есть только один из двух вариантов id,
 * см. buildTeacherModuleResults в sheetMapping.ts), а M3–M6 у 2–4 и 5–9 —
 * это РАЗНЫЕ назначения с одинаковым номером: у "двухпараллельного" учителя
 * одновременно существуют и 2-4-M3, и 5-9-M3 с разными баллами. Если это не
 * развести по отдельным колонкам, один из двух результатов на экране просто
 * исчезает (перезаписывается другим) — реальный баг, который здесь и чинится.
 */
export function getModuleColumnsForGroups(groups: GradeGroup[]): ModuleColumn[] {
  const columns: ModuleColumn[] = [];

  // M1/M2 — общие, колонка одна, но проверяем оба возможных id (реально
  // заполнен только один — тот, что относится к основной параллели учителя).
  const sharedOwners = groups.filter((g) => g === '2-4' || g === '5-9');
  for (const n of [1, 2]) {
    if (sharedOwners.length === 0) continue;
    columns.push({
      key: `M${n}`,
      shortTitle: `M${n}`,
      label: `M${n}`,
      moduleIds: sharedOwners.map((g) => `${g}-M${n}`),
    });
  }

  // Остальные номера — считаем, в скольких активных параллелях встречается
  // каждый: если больше чем в одной (это всегда M3–M6 у 2-4+5-9 вместе) —
  // отдельная колонка на каждую параллель с уточнением в заголовке.
  const ownersByShortTitle = new Map<string, GradeGroup[]>();
  for (const group of groups) {
    for (const m of modulesForGrade(group)) {
      if (m.shortTitle === 'M1' || m.shortTitle === 'M2') continue;
      const owners = ownersByShortTitle.get(m.shortTitle) ?? [];
      owners.push(group);
      ownersByShortTitle.set(m.shortTitle, owners);
    }
  }

  const seen = new Set<string>();
  for (const group of groups) {
    for (const m of modulesForGrade(group)) {
      if (m.shortTitle === 'M1' || m.shortTitle === 'M2') continue;
      const owners = ownersByShortTitle.get(m.shortTitle) ?? [];
      const ambiguous = owners.length > 1;
      const key = ambiguous ? `${m.shortTitle}:${group}` : m.shortTitle;
      if (seen.has(key)) continue;
      seen.add(key);
      columns.push({
        key,
        shortTitle: m.shortTitle,
        label: ambiguous ? `${m.shortTitle} (${GRADE_RANGE_LABEL[group]})` : m.shortTitle,
        moduleIds: [m.id],
      });
    }
  }

  return columns.sort((a, b) => moduleSortKey(a.shortTitle) - moduleSortKey(b.shortTitle) || a.label.localeCompare(b.label));
}

/** Ищет у учителя результат, относящийся к одной из колонок getModuleColumnsForGroups */
export function findModuleResultForColumn<T extends { moduleId: string }>(
  results: T[],
  column: ModuleColumn,
): T | undefined {
  return results.find((r) => column.moduleIds.includes(r.moduleId));
}
