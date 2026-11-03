import type { GradeGroup, Teacher, TeacherLifecycleStatus } from '../types/teacher';
import { PASS_THRESHOLD, getTeacherAverageScore } from './stats';
import { getEffectiveModuleStatus } from './anomalies';

export interface TeacherFilters {
  search: string;
  /** Множественный выбор — пустой массив означает "любой" */
  districts: string[];
  /** Значения года начала берутся из ТЕКУЩЕЙ вкладки (2–9 либо 10–11) — год из другой параллели тут не показывается */
  startYears: string[];
  schools: string[];
  /** Множественный выбор — сырые значения "Назначенные классы" как есть в таблице */
  classesTaught: string[];
  gradeGroups: GradeGroup[];
  lifecycleStatuses: TeacherLifecycleStatus[];
  trainingTypes: string[];
  /** '' — все, 'started' — % по ученикам > 0, 'not_started' — 0%, 'no_data' — в таблице нет данных */
  /** Множественный выбор: 'started' | 'not_started' | 'no_data' (любой из отмеченных) */
  studentsStarted: string[];
  /** Срез «% по ученикам» от–до (0–100); null — без ограничения. Учителя без данных в срез не попадают. */
  studentsMin: number | null;
  studentsMax: number | null;
  /** Множественный выбор — 'entered' | 'not_entered' */
  platformStatuses: string[];
  /** '' — все, 'az' | 'ru' */
  sectors: string[];
  /** Множественный выбор модулей: учитель должен подходить по КАЖДОМУ отмеченному модулю */
  moduleIds: string[];
  /** '' — любой, 'passed' | 'failed' | 'not_started' | 'on_review' */
  moduleResults: string[];
  /** Показывать только учителей, которым ещё не назначили класс/параллель */
  unassignedClassOnly: boolean;
  /** Фильтр по среднему баллу учителя (getTeacherAverageScore) — null означает "без ограничения" */
  scoreMin: number | null;
  scoreMax: number | null;
}

export const DEFAULT_FILTERS: TeacherFilters = {
  search: '',
  districts: [],
  startYears: [],
  schools: [],
  classesTaught: [],
  gradeGroups: [],
  lifecycleStatuses: [],
  trainingTypes: [],
  studentsStarted: [],
  studentsMin: null,
  studentsMax: null,
  platformStatuses: [],
  sectors: [],
  moduleIds: [],
  moduleResults: [],
  unassignedClassOnly: false,
  scoreMin: null,
  scoreMax: null,
};

/**
 * Сдал абсолютно все назначенные модули (по всем назначенным параллелям):
 * у каждого результата балл >= порога либо статус «Сдал». Учитель без
 * назначенных модулей в список не попадает.
 */
export function hasPassedAllAssignedModules(teacher: Teacher): boolean {
  const results = teacher.moduleResults;
  return results.length > 0 && results.every((r) => r.status === 'passed' || r.score >= PASS_THRESHOLD);
}

export function filterTeachers(teachers: Teacher[], filters: TeacherFilters): Teacher[] {
  const search = filters.search.trim().toLowerCase();

  return teachers.filter((t) => {
    if (search) {
      const haystack = `${t.fullName} ${t.school} ${t.fin} ${t.lmsId}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.districts.length && !filters.districts.includes(t.district)) return false;
    if (filters.startYears.length && !filters.startYears.includes(t.startYear)) return false;
    if (filters.schools.length && !filters.schools.includes(t.school)) return false;
    if (filters.classesTaught.length && !filters.classesTaught.includes(t.classesTaught)) return false;
    if (filters.gradeGroups.length && !filters.gradeGroups.includes(t.gradeGroup)) return false;
    if (filters.lifecycleStatuses.length && !filters.lifecycleStatuses.includes(t.lifecycleStatus)) return false;
    if (filters.trainingTypes.length && !filters.trainingTypes.includes(t.trainingType)) return false;
    if (filters.studentsStarted.length) {
      const p = t.studentsPercent ?? null;
      const matches = filters.studentsStarted.some(
        (k) => (k === 'started' && p !== null && p > 0) || (k === 'not_started' && p === 0) || (k === 'no_data' && p === null),
      );
      if (!matches) return false;
    }
    if (filters.studentsMin !== null || filters.studentsMax !== null) {
      const p = t.studentsPercent ?? null;
      if (p === null) return false;
      if (filters.studentsMin !== null && p < filters.studentsMin) return false;
      if (filters.studentsMax !== null && p > filters.studentsMax) return false;
    }
    if (filters.platformStatuses.length && !filters.platformStatuses.includes(t.platformStatus)) return false;
    if (filters.sectors.length && !filters.sectors.includes(t.language)) return false;
    if (filters.unassignedClassOnly && t.hasAssignedClass) return false;

    if (filters.moduleIds.length && filters.moduleResults.length) {
      // По каждому отмеченному модулю статус должен быть одним из отмеченных.
      if (!filters.moduleIds.every((id) => filters.moduleResults.includes(getEffectiveModuleStatus(t, id)))) return false;
    } else if (!filters.moduleIds.length && filters.moduleResults.length) {
      // Без выбора модуля статус смотрим по ВСЕМ назначенным модулям учителя:
      // «Сдал» — сданы все; «Не сдал» / «Не начал» / «На проверку» — есть хотя бы
      // один модуль с таким статусом. Несколько статусов — подходит любой из них.
      const wantsAllPassed = filters.moduleResults.includes('passed') && hasPassedAllAssignedModules(t);
      const otherStatuses = filters.moduleResults.filter((st) => st !== 'passed');
      const hasOtherStatus = otherStatuses.some((st) =>
        t.moduleResults.some((r) => getEffectiveModuleStatus(t, r.moduleId) === st),
      );
      if (!wantsAllPassed && !hasOtherStatus) return false;
    }

    if (filters.scoreMin !== null || filters.scoreMax !== null) {
      const avg = getTeacherAverageScore(t);
      // Нет ни одного решённого модуля — вне любого заданного диапазона.
      if (avg === null) return false;
      if (filters.scoreMin !== null && avg < filters.scoreMin) return false;
      if (filters.scoreMax !== null && avg > filters.scoreMax) return false;
    }

    return true;
  });
}

export type ArrayFilterKey =
  | 'districts'
  | 'schools'
  | 'gradeGroups'
  | 'lifecycleStatuses'
  | 'trainingTypes'
  | 'sectors'
  | 'moduleIds'
  | 'moduleResults'
  | 'studentsStarted';

export type SortKey =
  | 'fullName'
  | 'school'
  | 'district'
  | 'gradeGroup'
  | 'trainingType'
  | 'lifecycleStatus'
  | 'platformStatus'
  | 'averageScore'
  | 'studentsPercent';

export interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}

function getSortValue(t: Teacher, key: SortKey): string | number {
  if (key === 'averageScore') return getTeacherAverageScore(t) ?? -1;
  if (key === 'studentsPercent') return t.studentsPercent ?? -1;
  return t[key];
}

export function sortTeachers(teachers: Teacher[], sort: SortState): Teacher[] {
  const sorted = [...teachers];
  sorted.sort((a, b) => {
    const va = getSortValue(a, sort.key);
    const vb = getSortValue(b, sort.key);
    if (va < vb) return sort.direction === 'asc' ? -1 : 1;
    if (va > vb) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}
