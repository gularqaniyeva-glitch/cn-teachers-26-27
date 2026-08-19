// Преобразование "сырой" строки Google Sheets (объект {заголовок: значение})
// в наш внутренний тип Teacher.
//
// Названия колонок ниже — ТОЧНЫЕ заголовки из реальной таблицы (подтверждены
// напрямую через /api/sheets), а не предположения. Сопоставление всё равно
// ищет значение по названию заголовка (через normalizeHeader), а не по
// номеру колонки — это устойчивее к перестановке столбцов в будущем.

import type {
  GradeGroup,
  ModuleResult,
  ModuleStatus,
  PlatformStatus,
  Teacher,
  TeacherLifecycleStatus,
  TeachingLanguage,
  TrainingType,
} from '../types/teacher';

export type RawSheetRow = Record<string, string>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findValue(row: RawSheetRow, candidates: string[]): string {
  const normalizedRow = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    normalizedRow.set(normalizeHeader(key), (value ?? '').toString());
  }
  for (const candidate of candidates) {
    const value = normalizedRow.get(normalizeHeader(candidate));
    if (value !== undefined && value !== '') return value;
  }
  return '';
}

function deriveDistrict(school: string): string {
  const commaIndex = school.indexOf(',');
  return commaIndex > -1 ? school.slice(0, commaIndex).trim() : school.trim();
}

function mapSector(raw: string): TeachingLanguage {
  const v = raw.trim().toLowerCase();
  // "az-ru" (смешанный сектор) относим к азербайджанскому — наша модель
  // пока поддерживает только бинарный сектор az/ru.
  return v === 'ru' ? 'ru' : 'az';
}

function mapFormat(raw: string): TrainingType {
  const v = raw.trim().toLowerCase();
  if (v.startsWith('asinx') || v.includes('асинх')) return 'asinxron';
  if (v.startsWith('onlay') || v.includes('онлайн')) return 'onlayn';
  return 'əyani';
}

/** OLD/NEW в реальной таблице нет — выводим из года начала работы в LMS */
function mapLifecycleFromStartYear(raw: string): TeacherLifecycleStatus {
  const years = raw.match(/20\d{2}/g);
  if (!years) return 'OLD';
  const latestYear = Math.max(...years.map(Number));
  return latestYear >= 2025 ? 'NEW' : 'OLD';
}

function mapPlatformStatus(raw: string): PlatformStatus {
  const v = raw.trim().toLowerCase();
  const positive = ['да', 'заходил', 'вошёл', 'вошел', 'yes', 'bəli', 'entered', '+', 'true', '1'];
  return positive.some((p) => v === p || v.includes(p)) ? 'entered' : 'not_entered';
}

function parseScorePercent(raw: string): number {
  const trimmed = (raw ?? '').trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') return 0;
  const numeric = parseFloat(trimmed.replace(',', '.').replace('%', ''));
  if (Number.isNaN(numeric)) return 0;
  const score = trimmed.includes('%') || numeric > 1 ? Math.round(numeric) : Math.round(numeric * 100);
  return Math.max(0, Math.min(100, score));
}

/**
 * Статус модуля берём из ТЕКСТА ячейки статуса (он в таблице уже посчитан),
 * а не выводим сами из процента. "Нет класса" означает, что этот модуль
 * вообще не назначен учителю — тогда возвращаем null, и модуль просто не
 * попадает в его личную ведомость.
 */
function parseModuleCell(statusRaw: string, scoreRaw: string): { status: ModuleStatus; score: number } | null {
  const statusText = statusRaw.trim().toLowerCase();
  const score = parseScorePercent(scoreRaw);

  if (statusText.includes('нет класса')) return null;
  if (statusText.includes('не начал')) return { status: 'not_started', score: 0 };
  // "Старый учитель" — отдельная категория по бизнес-правилу таблицы, не
  // равна провалу ("Не прошёл"), поэтому статус сохраняем отдельно.
  if (statusText.includes('старый учитель')) return { status: 'old_teacher', score };
  if (statusText.includes('не прошёл') || statusText.includes('не прошел')) return { status: 'failed', score };
  if (statusText.includes('прошёл') || statusText.includes('прошел')) return { status: 'passed', score };

  // Текст статуса пуст или не распознан — считаем по числовому результату,
  // если он есть, иначе модуль просто ещё не начат.
  return score > 0 ? { status: score >= 60 ? 'passed' : 'failed', score } : { status: 'not_started', score: 0 };
}

const FIELD_CANDIDATES = {
  fullName: ['S.A.A'],
  school: ['Məktəb'],
  fin: ['FIN', 'FİN'],
  phone: ['Müəllimin əlaqə nömrəsi'],
  email: ['Müəllimin E-maili'],
  lmsId: ['ID LMS'],
  sector: ['Bölmə AZ/RU/AZ-RU'],
  format: ['Təlim tipi Təlim şöbəsi', 'Təlim tipi'],
  startYear: ['Başlama ili - yeni məlumat lms'],
  platformStatus: ['Статус входа на платформу'],
  classesTaught: ['Классы учителя (BOŞ OLAN HELE SİNİF TƏYİN OLUNMAYIB)'],
} as const;

/**
 * Определяем, какие параллели реально ведёт учитель (по статусу модуля
 * M3 в каждом наборе) — один и тот же человек может вести и 1–4, и 5–9
 * классы одновременно, это НЕ взаимоисключающие варианты в реальных данных.
 */
function detectActiveBands(row: RawSheetRow): { active1to4: boolean; active5to9: boolean } {
  const status1to4 = findValue(row, ['M3 1-4 Статус']).trim().toLowerCase();
  const status5to9 = findValue(row, ['M3 5-9 Статус']).trim().toLowerCase();
  return {
    active1to4: status1to4 !== '' && !status1to4.includes('нет класса'),
    active5to9: status5to9 !== '' && !status5to9.includes('нет класса'),
  };
}

const BAND_5TO9_MODULE_NUMBERS = ['3', '4', '5', '6', '7', '8', '9', '9-2', '10', '11', '12', '13'];
const BAND_1TO4_MODULE_NUMBERS = ['3', '4', '5', '6'];

/**
 * Возвращает РОВНО 6 модулей для чистой "начальной" (2-4), 14 — для чистой
 * "средней" (5-9, с учётом M9/M9-2 как двух отдельных модулей), 18 — если
 * активны обе параллели сразу (2 общих M1/M2 + 4 из 2-4 + 12 из 5-9).
 * Это прямое следствие active1to4/active5to9 из detectActiveBands — сама
 * функция ничего не досчитывает и не убирает по отдельным ячейкам.
 */
function buildTeacherModuleResults(row: RawSheetRow, primary: GradeGroup, active1to4: boolean, active5to9: boolean): ModuleResult[] {
  const results: ModuleResult[] = [];

  // M1/M2 общие для обеих параллелей — заносим один раз, под основной
  // группой учителя, чтобы не показывать их дважды у "двухпараллельных".
  for (const n of [1, 2]) {
    const cell = parseModuleCell(findValue(row, [`М${n} Статус`]), findValue(row, [`M${n}`]));
    if (cell) results.push({ moduleId: `${primary}-M${n}`, ...cell });
  }

  if (active1to4) {
    for (const n of BAND_1TO4_MODULE_NUMBERS) {
      const cell = parseModuleCell(findValue(row, [`M${n} 1-4 Статус`]), findValue(row, [`M${n} 1-4`]));
      if (cell) results.push({ moduleId: `2-4-M${n}`, ...cell });
    }
  }

  if (active5to9) {
    for (const n of BAND_5TO9_MODULE_NUMBERS) {
      const cell = parseModuleCell(findValue(row, [`M${n} 5-9 Статус`]), findValue(row, [`M${n} 5-9`]));
      if (cell) results.push({ moduleId: `5-9-M${n}`, ...cell });
    }
  }

  return results;
}

/**
 * Строка листа "Все учителя 26/27" (2–9 классы) → Teacher, либо null, если
 * строка "пустая" (нет ФИО) — это мусорные/фантомные строки в исходной
 * таблице, их нужно полностью исключать, а не показывать заглушкой.
 */
export function mapTeachersSheetRow(row: RawSheetRow, index: number): Teacher | null {
  const fullName = findValue(row, [...FIELD_CANDIDATES.fullName]).trim();
  if (!fullName) return null;

  const { active1to4, active5to9 } = detectActiveBands(row);
  // По умолчанию основная параллель — 5–9 (модулей там больше и это
  // наиболее частый случай), если активна только 1–4 — используем её.
  const primary: GradeGroup = active5to9 ? '5-9' : '2-4';

  const school = findValue(row, [...FIELD_CANDIDATES.school]);
  const lmsId = findValue(row, [...FIELD_CANDIDATES.lmsId]);
  const startYear = findValue(row, [...FIELD_CANDIDATES.startYear]);

  return {
    id: lmsId || `teacher-row-${index}`,
    fullName,
    school,
    district: deriveDistrict(school),
    fin: findValue(row, [...FIELD_CANDIDATES.fin]),
    phone: findValue(row, [...FIELD_CANDIDATES.phone]),
    email: findValue(row, [...FIELD_CANDIDATES.email]),
    lmsId,
    language: mapSector(findValue(row, [...FIELD_CANDIDATES.sector])),
    trainingType: mapFormat(findValue(row, [...FIELD_CANDIDATES.format])),
    lifecycleStatus: mapLifecycleFromStartYear(startYear),
    startYear,
    gradeGroup: primary,
    platformStatus: mapPlatformStatus(findValue(row, [...FIELD_CANDIDATES.platformStatus])),
    classesTaught: findValue(row, [...FIELD_CANDIDATES.classesTaught]),
    hasAssignedClass: active1to4 || active5to9,
    moduleResults: buildTeacherModuleResults(row, primary, active1to4, active5to9),
    note: '',
    updatedAt: new Date().toISOString(),
  };
}

const SENIOR_MODULE_NUMBERS = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

const SENIOR_FIELD_CANDIDATES = {
  // В реальном листе "ИТ классы 25/26" колонки с ФИО нет вообще (проверено
  // напрямую по заголовкам) — оставляем варианты на случай, если она
  // появится, но полагаться на неё нельзя.
  fullName: ['S.A.A', 'ФИО'],
  school: ['Школа название как LMS', 'Məktəb'],
  fin: ['ФИН КОД', 'FIN', 'FİN'],
  phone: ['Телефон учителя'],
  email: ['E-mail учителя'],
  lmsId: ['ID'],
  sector: ['Sektor'],
  startYear: ['IT-yə başladıqları il', 'Годы преподавания'],
  classesTaught: ['Siniflər'],
} as const;

/**
 * Строка листа "ИТ классы 25/26" (10–11 классы) → Teacher, либо null для
 * полностью пустых/фантомных строк. В этом листе нет колонки ФИО вообще,
 * поэтому "пустой" считаем строку без школы, LMS ID, email и телефона
 * одновременно — по отдельности любое из этих полей уже делает учителя
 * идентифицируемым и реальным.
 */
export function mapSeniorSheetRow(row: RawSheetRow, index: number): Teacher | null {
  const school = findValue(row, [...SENIOR_FIELD_CANDIDATES.school]);
  const lmsId = findValue(row, [...SENIOR_FIELD_CANDIDATES.lmsId]);
  const email = findValue(row, [...SENIOR_FIELD_CANDIDATES.email]);
  const phone = findValue(row, [...SENIOR_FIELD_CANDIDATES.phone]);

  if (!school.trim() && !lmsId.trim() && !email.trim() && !phone.trim()) return null;

  // Имени в этом листе нет — показываем хоть какой-то реальный
  // идентификатор учителя вместо пустой заглушки.
  const fullName = findValue(row, [...SENIOR_FIELD_CANDIDATES.fullName]) || email || phone || `ID ${lmsId || index + 2}`;

  const moduleResults: ModuleResult[] = [];
  for (const n of SENIOR_MODULE_NUMBERS) {
    const cell = parseModuleCell(findValue(row, [`М${n} Статус`]), findValue(row, [`M${n}`]));
    if (cell) moduleResults.push({ moduleId: `10-11-M${n}`, ...cell });
  }

  const seniorStartYear = findValue(row, [...SENIOR_FIELD_CANDIDATES.startYear]);

  return {
    id: lmsId ? `senior-${lmsId}` : `senior-row-${index}`,
    fullName,
    school,
    district: deriveDistrict(school),
    fin: findValue(row, [...SENIOR_FIELD_CANDIDATES.fin]),
    phone,
    email,
    lmsId,
    language: mapSector(findValue(row, [...SENIOR_FIELD_CANDIDATES.sector])),
    trainingType: 'əyani',
    lifecycleStatus: mapLifecycleFromStartYear(seniorStartYear),
    startYear: seniorStartYear,
    gradeGroup: '10-11',
    platformStatus: moduleResults.some((r) => r.status !== 'not_started') ? 'entered' : 'not_entered',
    classesTaught: findValue(row, [...SENIOR_FIELD_CANDIDATES.classesTaught]),
    hasAssignedClass: true,
    moduleResults,
    note: '',
    updatedAt: new Date().toISOString(),
  };
}
