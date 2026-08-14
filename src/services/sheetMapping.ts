// Преобразование "сырой" строки Google Sheets (объект {заголовок: значение})
// в наш внутренний тип Teacher.
//
// ВАЖНО: реальные названия колонок в таблице пока не подтверждены (таблица
// закрыта, инспектировать её напрямую не получилось). Сопоставление ниже
// сделано ГИБКИМ — ищет значение по нескольким вероятным вариантам
// названия заголовка (регистр и лишние пробелы не важны), а не по номеру
// колонки. Если в реальной таблице заголовки называются иначе — допишите
// нужный вариант в списки FIELD_CANDIDATES ниже, менять остальной код не
// придётся.

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
import { modulesForGrade } from '../data/constants';

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

const FIELD_CANDIDATES = {
  fullName: ['ФИО', 'Ad, Soyad', 'Ad Soyad', 'Full Name', 'Имя'],
  school: ['Школа', 'Məktəb', 'School'],
  district: ['Район', 'Rayon', 'District'],
  fin: ['FIN', 'FİN'],
  phone: ['Телефон', 'Telefon', 'Phone'],
  lmsId: ['LMS ID', 'LMS', 'LMS-ID', 'LMSID'],
  sector: ['Сектор', 'Bölmə', 'Sector', 'Язык', 'Dil'],
  format: ['Формат', 'Тип обучения', 'Format', 'Təhsil növü'],
  lifecycle: ['OLD/NEW', 'OLD / NEW', 'Статус', 'Status', 'Stajı'],
  gradeGroup: ['Классы', 'Параллель', 'Sinif', 'Sinifllər', 'Sinif qrupu', 'Grade'],
  platformStatus: ['Статус платформы', 'Платформа', 'Platforma', 'Вход', 'Giriş'],
  note: ['Заметка', 'Qeyd', 'Note', 'Примечание'],
} as const;

function mapSector(raw: string): TeachingLanguage {
  const v = raw.trim().toLowerCase();
  if (v.startsWith('ru') || v.includes('рус')) return 'ru';
  return 'az';
}

function mapFormat(raw: string): TrainingType {
  const v = raw.trim().toLowerCase();
  if (v.startsWith('asinx') || v.includes('асинх')) return 'asinxron';
  if (v.startsWith('onlay') || v.includes('онлайн')) return 'onlayn';
  return 'əyani';
}

function mapLifecycle(raw: string): TeacherLifecycleStatus {
  return raw.trim().toUpperCase().startsWith('NEW') ? 'NEW' : 'OLD';
}

function mapPlatformStatus(raw: string): PlatformStatus {
  const v = raw.trim().toLowerCase();
  const positive = ['да', 'вошёл', 'вошел', 'yes', 'bəli', 'entered', '+', 'true', '1'];
  return positive.some((p) => v === p || v.includes(p)) ? 'entered' : 'not_entered';
}

function mapGradeGroupFromText(raw: string): GradeGroup {
  const v = raw.replace(/[–—]/g, '-').trim();
  if (v.includes('2') && v.includes('4')) return '2-4';
  return '5-9';
}

function parseModuleCell(raw: string): { status: ModuleStatus; score: number } {
  const trimmed = (raw ?? '').trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') {
    return { status: 'not_started', score: 0 };
  }
  const numeric = parseFloat(trimmed.replace(',', '.').replace('%', ''));
  if (Number.isNaN(numeric)) return { status: 'not_started', score: 0 };
  // "0.85" считаем долей (=85%), "85" или "85%" — уже процентом.
  const score = trimmed.includes('%') || numeric > 1 ? Math.round(numeric) : Math.round(numeric * 100);
  const clamped = Math.max(0, Math.min(100, score));
  return { status: clamped >= 60 ? 'passed' : 'failed', score: clamped };
}

/**
 * @param row строка листа как {заголовок: значение}
 * @param index порядковый номер строки — используется только для запасного ID
 * @param fixedGradeGroup если задано (для листа 10–11 классов), группа не читается из таблицы
 */
export function mapRowToTeacher(row: RawSheetRow, index: number, fixedGradeGroup?: GradeGroup): Teacher {
  const gradeGroup = fixedGradeGroup ?? mapGradeGroupFromText(findValue(row, [...FIELD_CANDIDATES.gradeGroup]));
  const applicableModules = modulesForGrade(gradeGroup);

  const moduleResults: ModuleResult[] = applicableModules.map((m) => {
    const raw = findValue(row, [m.shortTitle]);
    const { status, score } = parseModuleCell(raw);
    return { moduleId: m.id, status, score };
  });

  const fullName = findValue(row, [...FIELD_CANDIDATES.fullName]);
  const lmsId = findValue(row, [...FIELD_CANDIDATES.lmsId]);

  return {
    id: lmsId || `${gradeGroup}-row-${index}`,
    fullName: fullName || `Без имени (стр. ${index + 2})`,
    school: findValue(row, [...FIELD_CANDIDATES.school]),
    district: findValue(row, [...FIELD_CANDIDATES.district]),
    fin: findValue(row, [...FIELD_CANDIDATES.fin]),
    phone: findValue(row, [...FIELD_CANDIDATES.phone]),
    lmsId,
    language: mapSector(findValue(row, [...FIELD_CANDIDATES.sector])),
    trainingType: mapFormat(findValue(row, [...FIELD_CANDIDATES.format])),
    lifecycleStatus: mapLifecycle(findValue(row, [...FIELD_CANDIDATES.lifecycle])),
    gradeGroup,
    platformStatus: mapPlatformStatus(findValue(row, [...FIELD_CANDIDATES.platformStatus])),
    moduleResults,
    note: findValue(row, [...FIELD_CANDIDATES.note]),
    updatedAt: new Date().toISOString(),
  };
}
