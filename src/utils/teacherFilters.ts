import type { GradeGroup, Teacher, TeacherLifecycleStatus } from '../types/teacher';
import { getTeacherAverageScore } from './stats';
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
  trainingType: string;
  /** Множественный выбор — 'entered' | 'not_entered' */
  platformStatuses: string[];
  /** '' — все, 'az' | 'ru' */
  sector: string;
  moduleId: string;
  /** '' — любой, 'passed' | 'failed' | 'not_started' | 'on_review' */
  moduleResult: string;
  /** Показывать только учителей, которым ещё не назначили класс/параллель */
  unassignedClassOnly: boolean;
}

export const DEFAULT_FILTERS: TeacherFilters = {
  search: '',
  districts: [],
  startYears: [],
  schools: [],
  classesTaught: [],
  gradeGroups: [],
  lifecycleStatuses: [],
  trainingType: '',
  platformStatuses: [],
  sector: '',
  moduleId: '',
  moduleResult: '',
  unassignedClassOnly: false,
};

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
    if (filters.trainingType && t.trainingType !== filters.trainingType) return false;
    if (filters.platformStatuses.length && !filters.platformStatuses.includes(t.platformStatus)) return false;
    if (filters.sector && t.language !== filters.sector) return false;
    if (filters.unassignedClassOnly && t.hasAssignedClass) return false;

    if (filters.moduleId && filters.moduleResult) {
      if (getEffectiveModuleStatus(t, filters.moduleId) !== filters.moduleResult) return false;
    }

    return true;
  });
}

export type SortKey =
  | 'fullName'
  | 'school'
  | 'district'
  | 'gradeGroup'
  | 'trainingType'
  | 'lifecycleStatus'
  | 'platformStatus'
  | 'averageScore';

export interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}

function getSortValue(t: Teacher, key: SortKey): string | number {
  if (key === 'averageScore') return getTeacherAverageScore(t) ?? -1;
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
