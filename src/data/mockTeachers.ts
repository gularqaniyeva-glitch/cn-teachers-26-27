import type { Teacher, TrainingType, TeacherLifecycleStatus, TeachingLanguage, GradeGroup, ModuleStatus } from '../types/teacher';
import { DISTRICTS, GRADE_GROUPS, TRAINING_TYPES, modulesForGrade } from './constants';

// Полностью вымышленные имена — не имеют отношения к реальным людям.
// Используются только для наглядной демонстрации интерфейса.
const MALE_FIRST_NAMES = [
  'Elvin', 'Rəşad', 'Tural', 'Orxan', 'Kamran', 'Vüqar', 'Namiq', 'Rövşən',
  'Anar', 'Cavid', 'Elşən', 'Fərid', 'Ramin', 'Sənan', 'Toğrul', 'Murad',
];
const FEMALE_FIRST_NAMES = [
  'Aynur', 'Günel', 'Leyla', 'Nərmin', 'Sevinc', 'Aygün', 'Nigar', 'Kəmalə',
  'Zeynəb', 'Elvira', 'Səbinə', 'Türkan', 'Şəbnəm', 'Vüsalə', 'Nazrin', 'Xatirə',
];
const LAST_NAME_BASES = [
  'Məmməd', 'Əli', 'Hüseyn', 'Qulu', 'İbrahim', 'Rəhim', 'Cəfər', 'Nəbi',
  'Vəli', 'Abbas', 'Bayram', 'Kərim', 'Sadıq', 'Yusif', 'Zeynal', 'Orucov',
];

// Простой детерминированный генератор случайных чисел (mulberry32),
// чтобы тестовые данные были одинаковыми при каждом запуске приложения,
// пока их не переопределит localStorage (после редактирования).
function createRng(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function buildFullName(rng: () => number): string {
  const isMale = rng() > 0.5;
  const first = isMale ? pick(rng, MALE_FIRST_NAMES) : pick(rng, FEMALE_FIRST_NAMES);
  const base = pick(rng, LAST_NAME_BASES);
  const last = isMale ? `${base}ov` : `${base}ova`;
  return `${first} ${last}`;
}

function buildFin(rng: () => number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let fin = '';
  for (let i = 0; i < 7; i++) fin += chars[Math.floor(rng() * chars.length)];
  return fin;
}

function buildPhone(rng: () => number): string {
  const codes = ['50', '51', '55', '70', '77', '99'];
  const code = pick(rng, codes);
  const part1 = String(randomInt(rng, 200, 999));
  const part2 = String(randomInt(rng, 10, 99));
  const part3 = String(randomInt(rng, 10, 99));
  return `+994 ${code} ${part1} ${part2} ${part3}`;
}

function buildLmsId(index: number): string {
  return `LMS-${String(10000 + index).padStart(6, '0')}`;
}

export function createMockTeachers(count: number, seed = 42): Teacher[] {
  const rng = createRng(seed);
  const teachers: Teacher[] = [];

  for (let i = 0; i < count; i++) {
    const district = pick(rng, DISTRICTS);
    const schoolNumber = randomInt(rng, 1, 220);
    const gradeGroup = pick<GradeGroup>(rng, GRADE_GROUPS);
    const trainingType = pick<TrainingType>(rng, TRAINING_TYPES);
    const lifecycleStatus: TeacherLifecycleStatus = rng() > 0.45 ? 'OLD' : 'NEW';
    const language: TeachingLanguage = rng() > 0.25 ? 'az' : 'ru';
    const entered = rng() > 0.22;

    const applicableModules = modulesForGrade(gradeGroup);
    const moduleResults = applicableModules.map((m) => {
      // Не вошедшие на платформу ни к одному модулю не приступали.
      if (!entered || rng() < 0.15) {
        const status: ModuleStatus = 'not_started';
        return { moduleId: m.id, status, score: 0 };
      }
      const score = randomInt(rng, 35, 100);
      const status: ModuleStatus = score >= 60 ? 'passed' : 'failed';
      return { moduleId: m.id, status, score };
    });

    teachers.push({
      id: `t-${i + 1}`,
      fullName: buildFullName(rng),
      school: `${district}, школа № ${schoolNumber}`,
      district,
      fin: buildFin(rng),
      phone: buildPhone(rng),
      lmsId: buildLmsId(i),
      language,
      trainingType,
      lifecycleStatus,
      gradeGroup,
      platformStatus: entered ? 'entered' : 'not_entered',
      moduleResults,
      note: '',
      updatedAt: new Date(2026, 7, randomInt(rng, 1, 12)).toISOString(),
    });
  }

  // Гарантируем несколько наглядных "аномалий LMS" в тестовых данных —
  // учитель хорошо сдаёт почти всё, но один модуль посередине программы
  // так и не отметился ("не начал"). Без этого шага такой узор мог бы
  // случайно не появиться совсем, и функцию авто-аудита нечем было бы
  // продемонстрировать.
  const anomalyIndices = [4, 14, 24, 34, 44].filter((idx) => idx < teachers.length);
  for (const idx of anomalyIndices) {
    const teacher = teachers[idx];
    if (teacher.moduleResults.length < 2) continue;
    teacher.platformStatus = 'entered';
    const gapPosition = Math.floor(rng() * teacher.moduleResults.length);
    teacher.moduleResults = teacher.moduleResults.map((r, i) =>
      i === gapPosition
        ? { moduleId: r.moduleId, status: 'not_started' as ModuleStatus, score: 0 }
        : { moduleId: r.moduleId, status: 'passed' as ModuleStatus, score: randomInt(rng, 80, 95) },
    );
  }

  return teachers;
}
