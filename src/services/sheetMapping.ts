// Преобразование "сырой" строки Google Sheets (объект {заголовок: значение})
// в наш внутренний тип Teacher.
//
// ВАЖНО: строки приходят из google-spreadsheet как row.toObject() — то есть
// УЖЕ объект {заголовок: значение}, а не позиционный массив. Мы никогда не
// читаем ячейки по индексу колонки (row[24] и т.п.) — только по названию
// заголовка через findValue/findValueFuzzy ниже. Это специально: если в
// таблице добавят новый столбец, порядок колонок сдвинется, но названия
// заголовков останутся прежними — сайт не сломается.

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

function normalizedEntries(row: RawSheetRow | null | undefined): Map<string, string> {
  const normalizedRow = new Map<string, string>();
  if (!row) return normalizedRow;
  for (const [key, value] of Object.entries(row)) {
    normalizedRow.set(normalizeHeader(key), (value ?? '').toString());
  }
  return normalizedRow;
}

/** Точный поиск по названию заголовка (после trim+lowercase) — для модулей, где важна точность (иначе "M1" случайно поймает "M10"-"M13"). */
function findValue(row: RawSheetRow | null | undefined, candidates: string[]): string {
  const normalizedRow = normalizedEntries(row);
  for (const candidate of candidates) {
    const value = normalizedRow.get(normalizeHeader(candidate));
    if (value !== undefined && value !== '') return value;
  }
  return '';
}

/**
 * То же самое, но с запасным вариантом "по вхождению подстроки" — если
 * заголовок в таблице слегка изменился (дописали слово, поменяли регистр),
 * поле всё равно найдётся, а не станет пустым. Используется только для
 * стабильных бизнес-полей (ФИО, школа, стаж и т.д.), НЕ для номеров
 * модулей — там короткие имена вроде "M1" случайно совпали бы с "M10".
 * Никогда не бросает исключение — при отсутствии данных просто "".
 */
function findValueFuzzy(row: RawSheetRow | null | undefined, candidates: string[]): string {
  const exact = findValue(row, candidates);
  if (exact) return exact;

  const normalizedRow = normalizedEntries(row);
  for (const candidate of candidates) {
    const needle = normalizeHeader(candidate);
    if (needle.length < 3) continue;
    for (const [header, value] of normalizedRow) {
      if (!value) continue;
      if (header.includes(needle) || needle.includes(header)) return value;
    }
  }
  return '';
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

const ERROR_VALUE_MARKERS = ['none', 'null', 'undefined', '#n/a'];

/** true для ячейки-ошибки формулы (#N/A, #REF!, #VALUE! и т.п.) или текстовых заглушек None/Null */
function isErrorValue(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (!v) return false;
  return v.startsWith('#') || ERROR_VALUE_MARKERS.includes(v);
}

/** Ячейка-ошибка формулы для второстепенного поля — не повод выкидывать всю строку, но и показывать "#N/A" в интерфейсе не нужно, просто считаем поле пустым. */
function cleanField(raw: string): string {
  return isErrorValue(raw) ? '' : raw;
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

// Первый вариант в каждом списке — ТОЧНОЕ название из реальной таблицы
// (подтверждено напрямую через /api/sheets). Остальные — синонимы/запасные
// варианты на случай, если заголовок в Sheets слегка изменится; ищутся
// через findValueFuzzy (точное совпадение, а если не нашлось — по
// вхождению подстроки), так что новый или переименованный столбец не
// уронит сайт.
const FIELD_CANDIDATES = {
  fullName: ['S.A.A', 'ФИО'],
  school: ['Məktəb', 'Школа'],
  district: ['Tabeçilik', 'Tabeciliyi', 'Tabecilik'],
  fin: ['FIN', 'FİN'],
  phone: ['Müəllimin əlaqə nömrəsi', 'əlaqə nömrəsi', 'Телефон'],
  email: ['Müəllimin E-maili'],
  lmsId: ['ID LMS', 'LMS ID'],
  sector: ['Bölmə AZ/RU/AZ-RU'],
  format: ['Təlim tipi Təlim şöbəsi', 'Təlim tipi', 'Tədris növü', 'Тип обучения'],
  startYear: ['Başlama ili - yeni məlumat lms', 'Başlama ili', 'Год начала'],
  platformStatus: ['Статус входа на платформу', 'Статус входа', 'LMS daxil'],
  classesTaught: ['Классы учителя (BOŞ OLAN HELE SİNİF TƏYİN OLUNMAYIB)', 'Классы учителя', 'sinif'],
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
export function mapTeachersSheetRow(row: RawSheetRow | null | undefined, index: number): Teacher | null {
  if (!row) return null;
  const fullName = findValueFuzzy(row, [...FIELD_CANDIDATES.fullName]).trim();
  if (!fullName) return null;

  const { active1to4, active5to9 } = detectActiveBands(row);
  // По умолчанию основная параллель — 5–9 (модулей там больше и это
  // наиболее частый случай), если активна только 1–4 — используем её.
  const primary: GradeGroup = active5to9 ? '5-9' : '2-4';

  const school = findValueFuzzy(row, [...FIELD_CANDIDATES.school]);
  const lmsId = findValueFuzzy(row, [...FIELD_CANDIDATES.lmsId]);
  const startYear = findValueFuzzy(row, [...FIELD_CANDIDATES.startYear]);

  return {
    id: lmsId || `teacher-row-${index}`,
    fullName,
    school,
    district: cleanField(findValueFuzzy(row, [...FIELD_CANDIDATES.district])),
    fin: findValueFuzzy(row, [...FIELD_CANDIDATES.fin]),
    phone: findValueFuzzy(row, [...FIELD_CANDIDATES.phone]),
    email: findValueFuzzy(row, [...FIELD_CANDIDATES.email]),
    lmsId,
    language: mapSector(findValueFuzzy(row, [...FIELD_CANDIDATES.sector])),
    trainingType: mapFormat(findValueFuzzy(row, [...FIELD_CANDIDATES.format])),
    lifecycleStatus: mapLifecycleFromStartYear(startYear),
    startYear,
    gradeGroup: primary,
    platformStatus: mapPlatformStatus(findValueFuzzy(row, [...FIELD_CANDIDATES.platformStatus])),
    classesTaught: findValueFuzzy(row, [...FIELD_CANDIDATES.classesTaught]),
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
  school: ['Школа название как LMS', 'Məktəb', 'Школа'],
  district: ['Tabeçilik', 'Tabeciliyi', 'Tabecilik'],
  fin: ['ФИН КОД', 'FIN', 'FİN'],
  phone: ['Телефон учителя', 'əlaqə nömrəsi', 'Телефон'],
  email: ['E-mail учителя'],
  lmsId: ['ID'],
  sector: ['Sektor'],
  startYear: ['IT-yə başladıqları il', 'Годы преподавания', 'Başlama ili', 'Год начала'],
  classesTaught: ['Siniflər', 'sinif', 'Классы учителя'],
} as const;

/**
 * Строка листа "ИТ классы 25/26" (10–11 классы) → Teacher, либо null для
 * полностью пустых/фантомных строк. В этом листе нет колонки ФИО вообще,
 * поэтому "пустой" считаем строку без школы, LMS ID, email и телефона
 * одновременно — по отдельности любое из этих полей уже делает учителя
 * идентифицируемым и реальным.
 */
export function mapSeniorSheetRow(row: RawSheetRow | null | undefined, index: number): Teacher | null {
  if (!row) return null;
  const school = findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.school]);
  const lmsId = findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.lmsId]);
  const email = findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.email]);
  const phone = findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.phone]);
  const rawFullName = findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.fullName]);
  const rawFin = findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.fin]);

  // Строка с ошибкой формулы (#N/A и т.п.) в ФИО или FIN — не реальный
  // учитель, а артефакт таблицы; полностью исключаем такую строку.
  if (isErrorValue(rawFullName) || isErrorValue(rawFin)) return null;

  if (!school.trim() && !lmsId.trim() && !email.trim() && !phone.trim()) return null;

  // Имени в этом листе может не быть — показываем хоть какой-то реальный
  // идентификатор учителя вместо пустой заглушки.
  const fullName = rawFullName || email || phone || `ID ${lmsId || index + 2}`;

  const seniorStartYear = findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.startYear]);
  // "Старый учитель" для 10–11: начал IT раньше сезона 2024/2025 (тот же
  // порог, что и в mapLifecycleFromStartYear) — таким учителям низкий/
  // нулевой балл не должен считаться провалом.
  const isOldTeacher = mapLifecycleFromStartYear(seniorStartYear) === 'OLD';

  const moduleResults: ModuleResult[] = [];
  for (const n of SENIOR_MODULE_NUMBERS) {
    const statusRaw = findValue(row, [`М${n} Статус`]);
    const scoreRaw = findValue(row, [`M${n}`]);
    // Ячейка балла полностью пустая (нет ни статуса, ни числа) — модуль не
    // назначен, в таблице это должна быть полностью пустая ячейка, а не "0%".
    if (!statusRaw.trim() && !scoreRaw.trim()) continue;

    const cell = parseModuleCell(statusRaw, scoreRaw);
    if (!cell) continue;

    const finalCell =
      isOldTeacher && cell.status !== 'old_teacher' && cell.score < 70
        ? { status: 'old_teacher' as ModuleStatus, score: cell.score }
        : cell;
    moduleResults.push({ moduleId: `10-11-M${n}`, ...finalCell });
  }

  return {
    id: lmsId ? `senior-${lmsId}` : `senior-row-${index}`,
    fullName,
    school,
    district: cleanField(findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.district])),
    fin: rawFin,
    phone,
    email,
    lmsId,
    language: mapSector(findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.sector])),
    trainingType: 'əyani',
    lifecycleStatus: mapLifecycleFromStartYear(seniorStartYear),
    startYear: seniorStartYear,
    gradeGroup: '10-11',
    platformStatus: moduleResults.some((r) => r.status !== 'not_started') ? 'entered' : 'not_entered',
    classesTaught: findValueFuzzy(row, [...SENIOR_FIELD_CANDIDATES.classesTaught]),
    hasAssignedClass: true,
    moduleResults,
    note: '',
    updatedAt: new Date().toISOString(),
  };
}
