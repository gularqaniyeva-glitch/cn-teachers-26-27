// Разбор листа "(АЗ) График 26/27" — динамический календарь модулей:
// дата открытия (Açılmasını yoxla) определяет, показывать ли модуль
// вообще, дедлайн (Deadline) — с какого момента он считается просроченным.
// Как и везде в проекте, ищем колонки ПО НАЗВАНИЮ заголовка, не по букве —
// см. комментарий в начале sheetMapping.ts.

import type { GradeGroup } from '../types/teacher';
import { findValueFuzzy, type RawSheetRow } from './sheetMapping';

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

const SCHEDULE_FIELD_CANDIDATES = {
  moduleCode: ['Modul'],
  gradeGroup: ['Sinif'],
  deadline: ['Deadline'],
  openDate: ['Açılmasını yoxla', 'Açılma tarixi', 'Açılış tarixi'],
} as const;

function normalizeGradeGroupLabel(raw: string): GradeGroup | null {
  const v = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!v) return null;
  if (/10.?11|x.?xi/.test(v)) return '10-11';
  if (/5.?9|v.?ix/.test(v)) return '5-9';
  if (/2.?4|1.?4|ii.?iv|i.?iv/.test(v)) return '2-4';
  return null;
}

/** "M9-2"/"Modul 9-2"/"9-2" → "9-2"; "M3"/"3" → "3" — тот же формат номеров, что в data/constants.ts */
function extractModuleNumber(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const match = cleaned.match(/(\d+)(-2)?/);
  if (!match) return null;
  return match[2] ? `${match[1]}-2` : match[1];
}

/** Google Sheets отдаёт дату отформатированной строкой — формат зависит от локали таблицы, поэтому пробуем несколько популярных вариантов. */
function parseSheetDate(raw: string): Date | null {
  const v = raw.trim();
  if (!v) return null;

  let m = v.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (m) {
    const date = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(v);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Строит индекс графика из сырых строк листа. Пустой/отсутствующий лист — пустой индекс (все модули считаются открытыми, см. isModuleOpen). */
export function buildScheduleIndex(rows: RawSheetRow[] | null | undefined): ScheduleIndex {
  const byModuleId = new Map<string, ScheduleEntry>();
  const byModuleNumber = new Map<string, ScheduleEntry[]>();
  if (!rows) return { byModuleId, byModuleNumber };

  for (const row of rows) {
    const moduleNumber = extractModuleNumber(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.moduleCode]));
    if (!moduleNumber) continue;

    const entry: ScheduleEntry = {
      moduleId: '',
      openDate: parseSheetDate(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.openDate])),
      deadline: parseSheetDate(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.deadline])),
    };

    const numberKey = `M${moduleNumber}`;
    const list = byModuleNumber.get(numberKey) ?? [];
    list.push(entry);
    byModuleNumber.set(numberKey, list);

    const gradeGroup = normalizeGradeGroupLabel(findValueFuzzy(row, [...SCHEDULE_FIELD_CANDIDATES.gradeGroup]));
    if (gradeGroup) {
      const moduleId = `${gradeGroup}-M${moduleNumber}`;
      entry.moduleId = moduleId;
      byModuleId.set(moduleId, entry);
    }
  }

  return { byModuleId, byModuleNumber };
}

export function getEmptySchedule(): ScheduleIndex {
  return EMPTY_SCHEDULE;
}

/**
 * Запись графика для конкретного id модуля учителя ("5-9-M7"). Если точного
 * совпадения по параллели нет (напр. лист графика не пишет параллель для
 * общих M1/M2) и по номеру модуля есть РОВНО одна запись — используем её;
 * при нескольких неоднозначных записях лучше не гадать и считать модуль
 * открытым, чем случайно спрятать реальные данные учителя.
 */
function findScheduleEntry(index: ScheduleIndex, moduleId: string): ScheduleEntry | null {
  const exact = index.byModuleId.get(moduleId);
  if (exact) return exact;

  const match = moduleId.match(/-(M[\d-]+)$/);
  if (!match) return null;
  const byNumber = index.byModuleNumber.get(match[1]);
  if (byNumber && byNumber.length === 1) return byNumber[0];
  return null;
}

/** Модуль без записи в графике или без даты открытия считается открытым — график не должен случайно прятать реальные данные учителей. */
export function isModuleOpen(index: ScheduleIndex, moduleId: string, now: Date = new Date()): boolean {
  const entry = findScheduleEntry(index, moduleId);
  if (!entry || !entry.openDate) return true;
  return entry.openDate.getTime() <= now.getTime();
}

/** ISO-дата дедлайна модуля, если график её знает */
export function getModuleDeadlineIso(index: ScheduleIndex, moduleId: string): string | undefined {
  const entry = findScheduleEntry(index, moduleId);
  return entry?.deadline ? entry.deadline.toISOString() : undefined;
}
