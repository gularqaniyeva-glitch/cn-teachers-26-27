// Разбор листа "(АЗ) График 26/27" — динамический календарь модулей:
// дата открытия (Açılmasını yoxla) определяет, показывать ли модуль
// вообще, дедлайн (Deadline) — с какого момента он считается просроченным.
// Как и везде в проекте, ищем колонки ПО НАЗВАНИЮ заголовка, не по букве —
// см. комментарий в начале sheetMapping.ts.
//
// Сопоставление модуля — с fallback: сперва пробуем готовый комбинированный
// ключ из столбца "Modul Total" (напр. "M3 2-4"), а если его нет — сами
// собираем такой же ключ из "Modul" ("M3") + "Sinif" ("2-4"). Ни разбор
// одной строки, ни отсутствие графика целиком НЕ должны ронять загрузку
// учителей — при любой ошибке строка просто пропускается (isModuleOpen
// затем трактует модуль без записи в графике как открытый).

import type { GradeGroup } from '../types/teacher';
import { findValueFuzzy, type RawSheetRow } from './sheetMapping';
import type { ModuleColumn } from '../data/constants';

export interface ScheduleEntry {
  moduleId: string;
  openDate: Date | null;
  deadline: Date | null;
}

export interface ScheduleIndex {
  /** Точное совпадение по внутреннему id модуля, напр. "5-9-M7" */
  byModuleId: Map<string, ScheduleEntry>;
  /** Запасной поиск по одному лишь номеру модуля ("M7") — для строк графика без явной параллели (M1/M2) */
  byModuleNumber: Map<string, ScheduleEntry[]>;
}

const EMPTY_SCHEDULE: ScheduleIndex = { byModuleId: new Map(), byModuleNumber: new Map() };

// Последний построенный индекс графика — единственный на всё приложение
// (одна Google-таблица, один активный график за раз). Нужен, чтобы
// компоненты таблиц могли полностью УБИРАТЬ ещё не открытые колонки
// модулей из DOM (см. filterOpenModuleColumns), а не только их данные —
// сами колонки в data/constants.ts строятся без сведений о датах и не
// должны об этом знать. Обновляется при каждом buildScheduleIndex (см.
// teacherService.ts — вызывается один раз на загрузку/обновление данных).
let currentScheduleIndex: ScheduleIndex = EMPTY_SCHEDULE;

const SCHEDULE_FIELD_CANDIDATES = {
  // Столбец T — уже готовый ключ "модуль+параллель" (напр. "M3 2-4"), если
  // он есть в таблице — приоритетный источник, экономит нам подбор пары.
  moduleTotal: ['Modul Total', 'Modul total', 'Total modul', 'Modul Cəmi'],
  moduleCode: ['Modul'],
  gradeGroup: ['Sinif'],
  deadline: ['Deadline'],
  openDate: ['Açılmasını yoxla', 'Açılma tarixi', 'Açılış tarixi'],
} as const;

const GRADE_GROUP_PATTERN = /10\s*-?\s*11|x\s*-?\s*xi|5\s*-?\s*9|v\s*-?\s*ix|2\s*-?\s*4|1\s*-?\s*4|ii\s*-?\s*iv|i\s*-?\s*iv/i;

/** Пробел, подчёркивание, точка и дефис — один и тот же разделитель: "M9_2", "M9.2", "M9-2", "M9 2" должны разбираться одинаково. */
function unifySeparators(raw: string): string {
  return (raw ?? '').trim().replace(/[_\s.-]+/g, '-');
}

/** Понимает "2-4", "2–4" (эн-дефис), "2 - 4", "2-4 classes", "2_4", "II-IV" — цифры/римские с любым одним разделителем между ними. */
function normalizeGradeGroupLabel(raw: string): GradeGroup | null {
  const v = (raw ?? '').trim().toLowerCase().replace(/[_\s.]+/g, '');
  if (!v) return null;
  if (/10.?11|x.?xi/.test(v)) return '10-11';
  if (/5.?9|v.?ix/.test(v)) return '5-9';
  if (/2.?4|1.?4|ii.?iv|i.?iv/.test(v)) return '2-4';
  return null;
}

/** "M9-2"/"M9_2"/"M9.2"/"Modul 9 2" → "9-2"; "M3"/"3" → "3" — тот же формат номеров, что в data/constants.ts */
function extractModuleNumber(raw: string): string | null {
  const cleaned = unifySeparators(raw);
  if (!cleaned) return null;
  const match = cleaned.match(/(\d+)(-2)?/);
  if (!match) return null;
  return match[2] ? `${match[1]}-2` : match[1];
}

/**
 * Разбирает готовый комбинированный ключ из столбца "Modul Total" (напр.
 * "M3 2-4", "M1"). Сначала находим и вырезаем часть с параллелью — так
 * номер модуля не спутается с цифрами класса независимо от порядка слов
 * ("M3 2-4" или "2-4 M3").
 */
function parseModuleTotalKey(raw: string): { moduleNumber: string; gradeGroup: GradeGroup | null } | null {
  const gradeGroup = normalizeGradeGroupLabel(raw);
  const withoutGrade = gradeGroup ? raw.replace(GRADE_GROUP_PATTERN, ' ') : raw;
  const moduleNumber = extractModuleNumber(withoutGrade);
  if (!moduleNumber) return null;
  return { moduleNumber, gradeGroup };
}

/**
 * Строгий ручной разбор даты — НИКОГДА не отдаём строку во встроенный
 * `new Date(строка)`: он неоднозначен для нецифровых ISO-форматов и на
 * практике путает день/месяц местами (напр. декабрьский дедлайн вида
 * "05.12.2026" мог быть прочитан как май вместо декабря и "открыться"
 * на несколько месяцев раньше срока). Основной формат таблицы —
 * DD.MM.YYYY; регулярка не заякорена в конце строки, потому что Google
 * Sheets иногда добавляет к дате время ("05.12.2026 0:00:00") — берём
 * только дату, хвост игнорируем. Любая нераспознанная/невалидная строка
 * (несуществующая дата вроде 31.02) — просто null, без исключений.
 */
function parseSheetDate(raw: string): Date | null {
  const v = (raw ?? '').trim();
  if (!v) return null;

  function buildDate(day: number, month: number, year: number): Date | null {
    const date = new Date(year, month - 1, day);
    // new Date() "перетекает" некорректный день/месяц в соседний период
    // (напр. new Date(2026, 12, 5) молча становится 5 января 2027) —
    // явно проверяем, что дата не поменялась при сборке.
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  try {
    // DD.MM.YYYY (основной формат таблицы) — так же DD/MM/YYYY на случай другого разделителя.
    let m = v.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (m) return buildDate(Number(m[1]), Number(m[2]), Number(m[3]));

    // YYYY-MM-DD (ISO) — на случай, если лист когда-нибудь отдаст даты в этом формате.
    m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return buildDate(Number(m[3]), Number(m[2]), Number(m[1]));

    return null;
  } catch {
    return null;
  }
}

/** Определяет номер модуля и параллель для одной строки графика: приоритет — "Modul Total", запасной вариант — "Modul"+"Sinif" по отдельности. */
function resolveModuleKey(row: RawSheetRow): { moduleNumber: string; gradeGroup: GradeGroup | null } | null {
  const moduleTotalRaw = findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.moduleTotal]);
  if (moduleTotalRaw.trim()) {
    const parsed = parseModuleTotalKey(moduleTotalRaw);
    if (parsed) return parsed;
  }

  const moduleNumber = extractModuleNumber(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.moduleCode]));
  if (!moduleNumber) return null;
  const gradeGroup = normalizeGradeGroupLabel(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.gradeGroup]));
  return { moduleNumber, gradeGroup };
}

/**
 * Строит индекс графика из сырых строк листа. Пустой/отсутствующий лист, а
 * также любая ошибка при разборе (неожиданный формат ячейки и т.п.) — не
 * повод падать: одна плохая строка пропускается, а полный сбой возвращает
 * пустой индекс (все модули считаются открытыми, см. isModuleOpen).
 */
export function buildScheduleIndex(rows: RawSheetRow[] | null | undefined): ScheduleIndex {
  const byModuleId = new Map<string, ScheduleEntry>();
  const byModuleNumber = new Map<string, ScheduleEntry[]>();
  if (!rows) {
    currentScheduleIndex = { byModuleId, byModuleNumber };
    return currentScheduleIndex;
  }

  try {
    for (const row of rows) {
      try {
        const key = resolveModuleKey(row);
        if (!key) continue;

        const entry: ScheduleEntry = {
          moduleId: '',
          openDate: parseSheetDate(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.openDate])),
          deadline: parseSheetDate(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.deadline])),
        };

        // В фолбэк-карту по одному лишь номеру попадают ТОЛЬКО записи БЕЗ
        // явно указанной параллели (настоящие общие M1/M2). Запись с явно
        // указанной параллелью (напр. "M4 5-9") не должна утекать в фолбэк
        // для ДРУГОЙ параллели ("2-4-M4") просто потому, что для той
        // параллели нет отдельной строки в графике — это была бы неверная
        // дата, а не отсутствие данных.
        if (!key.gradeGroup) {
          const numberKey = `M${key.moduleNumber}`;
          const list = byModuleNumber.get(numberKey) ?? [];
          list.push(entry);
          byModuleNumber.set(numberKey, list);
        }

        if (key.gradeGroup) {
          const moduleId = `${key.gradeGroup}-M${key.moduleNumber}`;
          entry.moduleId = moduleId;
          byModuleId.set(moduleId, entry);
        }
      } catch (err) {
        console.warn('scheduleMapping: пропущена строка графика — ошибка разбора:', err);
      }
    }
  } catch (err) {
    console.warn('scheduleMapping: не удалось разобрать лист графика целиком — модули считаются открытыми:', err);
    currentScheduleIndex = { byModuleId: new Map(), byModuleNumber: new Map() };
    return currentScheduleIndex;
  }

  currentScheduleIndex = { byModuleId, byModuleNumber };
  return currentScheduleIndex;
}

export function getEmptySchedule(): ScheduleIndex {
  return EMPTY_SCHEDULE;
}

/** Последний построенный график — для мест, которым нужно фильтровать КОЛОНКИ (не данные конкретного учителя), см. filterOpenModuleColumns. */
export function getCurrentScheduleIndex(): ScheduleIndex {
  return currentScheduleIndex;
}

/**
 * Запись графика для конкретного id модуля учителя ("5-9-M7"). Если точного
 * совпадения по параллели нет (напр. лист графика не пишет параллель для
 * общих M1/M2) и по номеру модуля есть РОВНО одна запись — используем её;
 * при нескольких неоднозначных записях лучше не гадать и считать модуль
 * открытым, чем случайно спрятать реальные данные учителя.
 *
 * 10–11 классы (ИТ) программно начинаются с M3 — модулей "10-11-M1"/
 * "10-11-M2" в приложении не существует и не должно (см. SENIOR_MODULE_
 * NUMBERS в sheetMapping.ts и sharedOwners в data/constants.ts). На всякий
 * случай явно исключаем их и здесь — общая запись M1/M2 из графика (без
 * указанной параллели) не должна по фолбэку "притянуться" к 10-11.
 */
function findScheduleEntry(index: ScheduleIndex, moduleId: string): ScheduleEntry | null {
  if (moduleId === '10-11-M1' || moduleId === '10-11-M2') return null;

  const exact = index.byModuleId.get(moduleId);
  if (exact) return exact;

  const match = moduleId.match(/-(M[\d-]+)$/);
  if (!match) return null;
  const byNumber = index.byModuleNumber.get(match[1]);
  if (byNumber && byNumber.length === 1) return byNumber[0];
  return null;
}

/** Модуль без записи в графике ИЛИ без даты открытия считается открытым — график не должен случайно прятать реальные данные учителей. Никогда не бросает исключение. */
export function isModuleOpen(index: ScheduleIndex, moduleId: string, now: Date = new Date()): boolean {
  try {
    const entry = findScheduleEntry(index, moduleId);
    if (!entry || !entry.openDate) return true;
    return entry.openDate.getTime() <= now.getTime();
  } catch {
    return true;
  }
}

/** ISO-дата дедлайна модуля, если график её знает. Никогда не бросает исключение. */
export function getModuleDeadlineIso(index: ScheduleIndex, moduleId: string): string | undefined {
  try {
    const entry = findScheduleEntry(index, moduleId);
    return entry?.deadline ? entry.deadline.toISOString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Убирает из списка КОЛОНКИ модулей, дата открытия которых ещё не
 * наступила — колонка полностью пропадает из шапки таблицы (не просто
 * показывает пустые ячейки). Колонка "M1"/"M2" (общая на 2–4 и 5–9 сразу)
 * остаётся видимой, если открыта хотя бы для одной из параллелей — иначе
 * учителя той параллели, где модуль уже открыт, не увидели бы свой
 * реальный результат.
 */
export function filterOpenModuleColumns(columns: ModuleColumn[], now: Date = new Date()): ModuleColumn[] {
  const schedule = getCurrentScheduleIndex();
  return columns.filter((col) => col.moduleIds.some((id) => isModuleOpen(schedule, id, now)));
}
