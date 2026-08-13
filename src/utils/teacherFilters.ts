import type { GradeGroup, Teacher, TeacherLifecycleStatus } from '../types/teacher';
import { getTeacherAverageScore } from './stats';

export interface TeacherFilters {
  search: string;
  /** Множественный выбор — пустой массив означает "любой" */
  districts: string[];
  schools: string[];
  gradeGroups: GradeGroup[];
  lifecycleStatuses: TeacherLifecycleStatus[];
  trainingType: string;
  platformStatus: string;
  /** '' — все, 'az' | 'ru' */
  sector: string;
  moduleId: string;
  /** '' — любой, 'passed' | 'failed' | 'not_started' */
  moduleResult: string;
}

export const DEFAULT_FILTERS: TeacherFilters = {
  search: '',
  districts: [],
  schools: [],
  gradeGroups: [],
  lifecycleStatuses: [],
  trainingType: '',
  platformStatus: '',
  sector: '',
  moduleId: '',
  moduleResult: '',
};

export function filterTeachers(teachers: Teacher[], filters: TeacherFilters): Teacher[] {
  const search = filters.search.trim().toLowerCase();

  return teachers.filter((t) => {
    if (search) {
      const haystack = `${t.fullName} ${t.school} ${t.fin} ${t.lmsId}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.districts.length && !filters.districts.includes(t.district)) return false;
    if (filters.schools.length && !filters.schools.includes(t.school)) return false;
    if (filters.gradeGroups.length && !filters.gradeGroups.includes(t.gradeGroup)) return false;
    if (filters.lifecycleStatuses.length && !filters.lifecycleStatuses.includes(t.lifecycleStatus)) return false;
    if (filters.trainingType && t.trainingType !== filters.trainingType) return false;
    if (filters.platformStatus && t.platformStatus !== filters.platformStatus) return false;
    if (filters.sector && t.language !== filters.sector) return false;

    if (filters.moduleId) {
      const result = t.moduleResults.find((r) => r.moduleId === filters.moduleId);
      if (filters.moduleResult && result?.status !== filters.moduleResult) return false;
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
