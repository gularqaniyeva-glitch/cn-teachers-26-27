import type { GradeGroup, ModuleDefinition, ModuleResult, Teacher, TrainingType } from '../types/teacher';
import { GRADE_GROUPS, LIFECYCLE_STATUSES, TRAINING_TYPES, getModule, modulesForGrade } from '../data/constants';

export interface OverviewStats {
  total: number;
  entered: number;
  notEntered: number;
  /** Доля "Сдал" среди уже начатых модулей (без учёта "Не начал"), % */
  successRate: number;
}

function passRateOf(passed: number, started: number): number {
  return started > 0 ? Math.round((passed / started) * 100) : 0;
}

export function getOverviewStats(teachers: Teacher[]): OverviewStats {
  const total = teachers.length;
  let entered = 0;
  let passed = 0;
  let started = 0;

  for (const t of teachers) {
    if (t.platformStatus === 'entered') entered += 1;
    for (const r of t.moduleResults) {
      if (r.status === 'passed' || r.status === 'failed') {
        started += 1;
        if (r.status === 'passed') passed += 1;
      }
    }
  }

  return { total, entered, notEntered: total - entered, successRate: passRateOf(passed, started) };
}

export interface RawPlatformStats {
  total: number;
  entered: number;
  notEntered: number;
}

/**
 * "Всего учителей"/"Вошли"/"Не вошли" — единая функция для "Главной" и
 * "Статистики", чтобы эти цифры автоматически совпадали на обеих
 * страницах. Прямой подсчёт по ВСЕМ валидным строкам листа "Все учителя
 * 26/27" (2–9 классы): без фильтра по назначенному классу (hasAssignedClass)
 * и без учителей 10–11 классов (отдельный лист "ИТ классы") — gradeGroup
 * у учителей листа "Все учителя 26/27" никогда не '10-11'.
 */
export function getRawPlatformStats(teachers: Teacher[]): RawPlatformStats {
  const mainSheetTeachers = teachers.filter((t) => t.gradeGroup !== '10-11');
  const total = mainSheetTeachers.length;
  const entered = mainSheetTeachers.filter(isUserActive).length;
  return { total, entered, notEntered: total - entered };
}

/**
 * ЕДИНЫЙ флаг «учитель заходил на платформу» для ВСЕХ показателей сайта
 * («Вошли на платформу», посещаемость по параллелям, виджет IT-классов,
 * база «Среднего решения»): либо статус входа в таблице («заходил» /
 * «daxil olub» — уже разобран в teacher.platformStatus), либо есть хоть
 * один модуль с баллом > 0. Решить модуль, не зайдя на платформу,
 * невозможно, поэтому балл > 0 — достаточное доказательство входа, даже
 * если статус в таблице не обновили. (Модуль со статусом «Старый
 * учитель»/«Не прошёл» и баллом 0% входом НЕ считается — это не
 * доказательство.)
 */
export function isUserActive(teacher: Teacher): boolean {
  return teacher.platformStatus === 'entered' || teacher.moduleResults.some((r) => r.score > 0);
}

/** Средний результат учителя по всем модулям его программы (0 — за "не начал"), % */
/**
 * Средний балл СТРОГО по модулям, которые учитель реально проходил
 * (есть попытка — балл passed/failed/old_teacher), а не по всем назначенным.
 * "Не начал" исключаем из знаменателя: иначе их нулевые баллы искусственно
 * тянут средний процент вниз для тех, кто просто ещё не дошёл до модуля.
 */
export function getTeacherAverageScore(teacher: Teacher): number | null {
  const mean = getTeacherMeanScore(teacher);
  return mean === null ? null : Math.round(mean);
}

/** "Средний балл по решённым" учителя до округления: среднее по модулям, где есть попытка (не «Не начал»). */
function getTeacherMeanScore(teacher: Teacher): number | null {
  const attempted = teacher.moduleResults.filter((r) => r.status !== 'not_started');
  if (attempted.length === 0) return null;
  return attempted.reduce((acc, r) => acc + r.score, 0) / attempted.length;
}

export interface AverageScoreStat {
  /** Среднее арифметическое среднего балла по ВСЕМ вошедшим учителям выборки, % (1 знак); null — вошедших нет */
  average: number | null;
  /** Знаменатель: число вошедших (isUserActive) в той же выборке — ровно то число, что на карточке/линии «Вошли» */
  activeTeachers: number;
}

/**
 * Среднее по ВСЕМ вошедшим: сумма «среднего балла по решённым» каждого
 * вошедшего учителя / число вошедших. Вошедший, у которого пока нет ни
 * одного решённого модуля (или все решённые — 0%), участвует с 0% —
 * исключать нули нельзя (решение пользователя): иначе знаменатель
 * разойдётся с числом вошедших. Усредняются ОКРУГЛЁННЫЕ значения колонки
 * «Средний балл (по решённым)», чтобы итог перепроверялся по таблице.
 */
function averageOfActiveTeachers(activeTeachers: Teacher[]): AverageScoreStat {
  let sum = 0;
  for (const teacher of activeTeachers) {
    const mean = getTeacherMeanScore(teacher);
    sum += mean === null ? 0 : Math.round(mean);
  }
  return {
    average: activeTeachers.length > 0 ? Math.round((sum / activeTeachers.length) * 10) / 10 : null,
    activeTeachers: activeTeachers.length,
  };
}

/**
 * Общий средний балл: по всем вошедшим учителям листа «Все учителя
 * 26/27» — та же база, что у карточки «Вошли на платформу» (IT-классы
 * 10–11 считаются отдельным виджетом).
 */
export function getOverallAverageScore(teachers: Teacher[]): AverageScoreStat {
  return averageOfActiveTeachers(teachers.filter((te) => te.gradeGroup !== '10-11').filter(isUserActive));
}

export interface TeacherOverallStats {
  /** Всего модулей, реально назначенных этому учителю прямо сейчас (M1/M2 + M3 каждой активной параллели и т.д.) — все открытые модули из его программы, вне зависимости от дедлайна */
  assigned: number;
  /** Сколько из них сдано успешно */
  passed: number;
  /** Доля сданного от всех назначенных модулей, % (0 — за "не начал"/"не сдал") */
  percent: number;
}

/**
 * "Сдано X из Y назначенных модулей" для отображения в таблице/карточке
 * учителя — Y это ВСЕ модули, реально открытые и относящиеся к программе
 * учителя (teacher.moduleResults уже отфильтрован по isModuleOpen при
 * разборе листа, см. sheetMapping.ts), а не только те, что уже входят в
 * дедлайн-знаменатель "Прошли курс" (это отдельная, более строгая метрика —
 * см. isModuleDueForPassRate/hasTeacherPassedCourse). Иначе учитель, у
 * которого назначено 3 модуля, но ни по одному ещё не наступил дедлайн,
 * ошибочно показывался бы как "нет данных" вместо "Сдано 0 из 3".
 */
export function getTeacherOverallStats(teacher: Teacher): TeacherOverallStats {
  const assigned = teacher.moduleResults.length;
  const passed = teacher.moduleResults.filter((r) => r.status === 'passed').length;
  return { assigned, passed, percent: assigned > 0 ? Math.round((passed / assigned) * 100) : 0 };
}

export interface ModuleStat {
  moduleId: string;
  shortTitle: string;
  group: GradeGroup;
  /** Всего учителей ЭТОЙ параллели (вкладки), которым назначен модуль */
  assigned: number;
  /** Сколько из них сдали: балл >=70% либо статус "Старый учитель" */
  passed: number;
  passRate: number;
}

const SHARED_MODULE_SHORT_TITLES = new Set(['M1', 'M2']);

/**
 * Статистика по каждому модулю ОДНОЙ параллели (вкладки) — единый
 * знаменатель для ВСЕХ карточек этой вкладки, включая M1/M2: население —
 * учителя, которым назначена именно эта параллель (включая тех, кто
 * ведёт сразу обе — getAssignedGradeGroups), а НЕ вся система 2–9 разом.
 * M1/M2 общие (единственный результат на учителя, под его "основной"
 * параллелью — 2-4-M1 либо 5-9-M1), поэтому для них по-прежнему
 * проверяются ОБА возможных id — иначе результат "двухпараллельного"
 * учителя, сохранённый под другой параллелью, не найдётся.
 * В числитель ("сдали") попадают СТРОГО те, у кого балл >=70% — статус
 * "Старый учитель" сюда НЕ включается: это бизнес-правило про то, что их
 * низкий/нулевой балл не считается провалом на уровне общего KPI
 * "Прошли курс" (см. hasTeacherPassedCourse), а НЕ про то, что они
 * "сдали" конкретный модуль. Раньше это была одна и та же ветка, и
 * учитель с баллом 0% и статусом "Старый учитель" ошибочно засчитывался
 * в "сдали" для КАЖДОГО модуля отдельно — на реальных данных, например,
 * все 723 "старых учителя" по модулю M3 (5–9) имели балл 0%, но
 * раздували "сдали" с 986 до 1709.
 * Учителя без назначенного класса (hasAssignedClass=false) исключены из
 * любого знаменателя — их отсутствие параллели не портит процент другим.
 */
export function getModuleStatsForGroup(teachers: Teacher[], group: GradeGroup): ModuleStat[] {
  const eligible = teachers.filter((te) => te.hasAssignedClass);
  const population = eligible.filter((te) => getAssignedGradeGroups(te).includes(group));

  return modulesForGrade(group).map((m) => {
    const shared = SHARED_MODULE_SHORT_TITLES.has(m.shortTitle);
    const moduleIdsToCheck = shared ? [`2-4-${m.shortTitle}`, `5-9-${m.shortTitle}`] : [m.id];

    let assigned = 0;
    let passed = 0;
    for (const teacher of population) {
      const result = teacher.moduleResults.find((r) => moduleIdsToCheck.includes(r.moduleId));
      if (!result) continue;
      assigned += 1;
      if (result.score >= PASS_THRESHOLD) passed += 1;
    }

    return {
      moduleId: m.id,
      shortTitle: m.shortTitle,
      group,
      assigned,
      passed,
      passRate: assigned > 0 ? Math.round((passed / assigned) * 100) : 0,
    };
  });
}

export interface CountEntry<T extends string = string> {
  key: T;
  label: string;
  count: number;
  percent: number;
}

export function countByKey<T extends string>(
  teachers: Teacher[],
  keyFn: (t: Teacher) => T,
  labels: Record<T, string>,
  order: readonly T[],
): CountEntry<T>[] {
  const total = teachers.length || 1;
  const counts = new Map<T, number>();
  for (const t of teachers) {
    const key = keyFn(t);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return order.map((key) => {
    const count = counts.get(key) ?? 0;
    return { key, label: labels[key], count, percent: Math.round((count / total) * 100) };
  });
}

/**
 * Модули, реально назначенные конкретному учителю. Берём напрямую из его
 * moduleResults (а не жёстко по teacher.gradeGroup) — в реальных данных
 * один учитель может одновременно вести, например, и 2–4, и 5–9 классы,
 * и тогда у него есть модули из обеих программ сразу.
 */
export function getApplicableModules(teacher: Teacher): ModuleDefinition[] {
  if (teacher.moduleResults.length === 0) return modulesForGrade(teacher.gradeGroup);
  return teacher.moduleResults
    .map((r) => getModule(r.moduleId))
    .filter((m): m is ModuleDefinition => Boolean(m));
}

/**
 * Какие параллели реально ведёт учитель — определяем напрямую по префиксу
 * id его назначенных модулей (2-4-M.../5-9-M...), а не по единственному
 * teacher.gradeGroup, которое хранит только "основную" параллель и не
 * покажет вторую у двухпараллельных учителей.
 */
export function getAssignedGradeGroups(teacher: Teacher): GradeGroup[] {
  if (teacher.gradeGroup === '10-11') return ['10-11'];
  const groups: GradeGroup[] = [];
  if (teacher.moduleResults.some((r) => r.moduleId.startsWith('2-4-'))) groups.push('2-4');
  if (teacher.moduleResults.some((r) => r.moduleId.startsWith('5-9-'))) groups.push('5-9');
  return groups;
}

/**
 * Текст для колонки "Классы" — вместо сырого (часто пустого) значения из
 * Sheets выводим параллели, реально выведенные из назначенных модулей.
 * Если учителю ещё не назначили класс/параллель вовсе (hasAssignedClass
 * false) — явно говорим об этом, а не подставляем технический gradeGroup
 * по умолчанию как будто это настоящее назначение. "нет данных" в этой
 * колонке принципиально не показываем.
 */
export function formatAssignedClassesLabel(
  teacher: Teacher,
  gradeGroupLabels: Record<GradeGroup, string>,
  notAssignedLabel: string,
): string {
  if (!teacher.hasAssignedClass) return notAssignedLabel;
  const groups = getAssignedGradeGroups(teacher);
  if (groups.length > 0) return groups.map((g) => gradeGroupLabels[g]).join(', ');
  return teacher.classesTaught || '—';
}

/**
 * Общий процент "сдал аттестацию" по всем учителям — доля модулей со
 * статусом "Сдал" среди ВСЕХ назначенных модулей (не только начатых, в
 * отличие от OverviewStats.successRate) — тот же принцип "конец года,
 * считаем от всего назначенного", что и в getTeacherOverallStats.
 */
export function getOverallPassPercent(teachers: Teacher[]): number {
  let assigned = 0;
  let passed = 0;
  for (const teacher of teachers) {
    for (const r of teacher.moduleResults) {
      assigned += 1;
      if (r.status === 'passed') passed += 1;
    }
  }
  return assigned > 0 ? Math.round((passed / assigned) * 100) : 0;
}

/**
 * Входит ли модуль в проверку «Прошёл курс» ПРЯМО СЕЙЧАС (ОТСРОЧКА по
 * дедлайну, столбец "Deadline"). teacher.moduleResults уже содержит
 * только ОТКРЫТЫЕ по графику модули; среди них:
 * - есть реальная попытка (любой статус кроме «Не начал») — входит
 *   всегда: досрочная сдача и провал учитываются сразу;
 * - M1 и M2 — вводные модули, назначены всем сразу: входят всегда, даже
 *   пока их дедлайн не наступил (решение пользователя);
 * - остальной «Не начал» входит ТОЛЬКО если у него есть распознанный
 *   дедлайн И он уже наступил (CurrentDate > Deadline) — до этого
 *   отсутствие сдачи не считается ни просрочкой, ни провалом.
 */
function isModuleDueForPassRate(result: ModuleResult, now: Date): boolean {
  if (result.status !== 'not_started') return true;
  if (result.moduleId.endsWith('-M1') || result.moduleId.endsWith('-M2')) return true;
  if (!result.deadline) return false;
  const deadline = new Date(result.deadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() <= now.getTime();
}

/**
 * «Прошёл курс» — по УЧИТЕЛЮ (человеку, 1 человек = 1 раз независимо от
 * числа параллелей): все его модули, входящие в проверку сейчас
 * (isModuleDueForPassRate), сданы на >=70% по логическому «И»
 * (M1 >= 70% AND M2 >= 70% AND ...) — по ВСЕЙ его матрице модулей (и
 * 2–4, и 5–9, если ведёт обе).
 * Правило «СТАРЫЙ УЧИТЕЛЬ»: модуль со статусом «Старый учитель» и баллом
 * < 70% НЕ считается провалом и не блокирует «Прошёл курс» (плашка
 * «Old»); с баллом >= 70% — обычная успешная сдача. Если после этого в
 * проверке нет ни одного обычного модуля, а «Old»-модули были — учитель
 * засчитывается прошедшим. Если в проверку сейчас не входит НИ ОДНОГО
 * модуля — рано засчитывать.
 */
export function hasTeacherPassedCourse(teacher: Teacher, now: Date = new Date()): boolean {
  const counted = teacher.moduleResults.filter((r) => isModuleDueForPassRate(r, now));
  const relevant = counted.filter((r) => !(r.status === 'old_teacher' && r.score < PASS_THRESHOLD));
  if (relevant.length === 0) return counted.length > 0;
  return relevant.every((r) => r.score >= PASS_THRESHOLD);
}

/**
 * Категории учителей — НЕпересекающиеся: каждый учитель попадает ровно в
 * одну, поэтому суммы по категориям равны общему числу, а двухпараллельный
 * учитель считается ОДНИМ человеком (прошёл/не прошёл — 1 или 0), а не
 * дважды в «2–4» и «5–9».
 */
export type TeacherCategory = 'only24' | 'only59' | 'both' | 'it';
export const TEACHER_CATEGORIES: TeacherCategory[] = ['only24', 'only59', 'both', 'it'];

export function getTeacherCategory(teacher: Teacher): TeacherCategory {
  if (teacher.gradeGroup === '10-11') return 'it';
  const groups = getAssignedGradeGroups(teacher);
  const has24 = groups.includes('2-4');
  const has59 = groups.includes('5-9');
  if (has24 && has59) return 'both';
  if (has24) return 'only24';
  if (has59) return 'only59';
  return teacher.gradeGroup === '5-9' ? 'only59' : 'only24';
}

export interface CategoryStat {
  category: TeacherCategory;
  /** Учителей в категории (с назначенным классом) */
  totalTeachers: number;
  /** Из них прошли курс — каждый учитель считается один раз */
  passedTeachers: number;
  percent: number;
  /** Посещаемость: вошли на платформу (isUserActive) */
  activeTeachers: number;
  activePercent: number;
  /** Среднее решение по вошедшим учителям категории (с нулями) */
  averageScore: AverageScoreStat;
}

export function getTeacherCategoryStats(teachers: Teacher[], now: Date = new Date()): CategoryStat[] {
  const eligible = teachers.filter((te) => te.hasAssignedClass);
  return TEACHER_CATEGORIES.map((category) => {
    const members = eligible.filter((te) => getTeacherCategory(te) === category);
    const passedTeachers = members.filter((te) => hasTeacherPassedCourse(te, now)).length;
    const active = members.filter(isUserActive);
    const pct = (n: number) => (members.length > 0 ? Math.round((n / members.length) * 100) : 0);
    return {
      category,
      totalTeachers: members.length,
      passedTeachers,
      percent: pct(passedTeachers),
      activeTeachers: active.length,
      activePercent: pct(active.length),
      averageScore: averageOfActiveTeachers(active),
    };
  });
}

export interface OverallTeacherPassStat {
  totalTeachers: number;
  passedTeachers: number;
  percent: number;
}

/** То же самое, но по всем учителям сразу (для верхней KPI-карточки) */
export function getOverallTeacherPassStat(teachers: Teacher[]): OverallTeacherPassStat {
  const eligible = teachers.filter((te) => te.hasAssignedClass);
  const passedTeachers = eligible.filter((te) => hasTeacherPassedCourse(te)).length;
  return {
    totalTeachers: eligible.length,
    passedTeachers,
    percent: eligible.length > 0 ? Math.round((passedTeachers / eligible.length) * 100) : 0,
  };
}

/** "46,58%" — 2 знака после запятой, запятая вместо точки (для точной сводки "Вошли/Не вошли") */
export function formatPercentComma(part: number, total: number): string {
  if (!total) return '0,00%';
  return `${((part / total) * 100).toFixed(2).replace('.', ',')}%`;
}

/** Подставляет {passed}/{total}/{percent} в шаблон вида "{passed} из {total} учителей..." */
export function formatTeachersPassed(template: string, passed: number, total: number, percent: number): string {
  return template
    .replace('{passed}', String(passed))
    .replace('{total}', String(total))
    .replace('{percent}', String(percent));
}

export interface TrainingTypeSummary {
  type: TrainingType;
  count: number;
  /** % учителей этого типа обучения, хотя бы раз заходивших на платформу */
  enteredPercent: number;
  /** % "Сдал" среди начатых модулей (см. OverviewStats.successRate) */
  successRate: number;
}

/** Сводка "Кол-во учителей | % заходивших | % успеваемости" по каждому типу обучения */
export function getTrainingTypeSummary(teachers: Teacher[]): TrainingTypeSummary[] {
  return TRAINING_TYPES.map((type) => {
    const subset = teachers.filter((te) => te.trainingType === type);
    const overview = getOverviewStats(subset);
    return {
      type,
      count: subset.length,
      enteredPercent: subset.length > 0 ? Math.round((overview.entered / subset.length) * 100) : 0,
      successRate: overview.successRate,
    };
  });
}

export interface ModuleSegmentRow {
  moduleId: string;
  shortTitle: string;
  /** ключ сегмента (тип обучения либо OLD/NEW) -> % сдавших (score >= 70) среди назначенных этот модуль */
  values: Record<string, number>;
}

const PASS_THRESHOLD = 70;

/** Общий движок разбивки модулей одной параллели по произвольному сегменту (тип обучения, стаж, ...) — один проход по всем результатам */
function getModulePassRateBySegment<K extends string>(
  teachers: Teacher[],
  group: GradeGroup,
  segmentKeys: readonly K[],
  segmentOf: (teacher: Teacher) => K,
): ModuleSegmentRow[] {
  const modules = modulesForGrade(group);
  const acc = new Map<string, Map<K, { assigned: number; passed: number }>>();
  for (const m of modules) {
    const segMap = new Map<K, { assigned: number; passed: number }>();
    for (const key of segmentKeys) segMap.set(key, { assigned: 0, passed: 0 });
    acc.set(m.id, segMap);
  }

  for (const teacher of teachers) {
    const segment = segmentOf(teacher);
    for (const r of teacher.moduleResults) {
      const segMap = acc.get(r.moduleId);
      if (!segMap) continue;
      const entry = segMap.get(segment);
      if (!entry) continue;
      entry.assigned += 1;
      if (r.score >= PASS_THRESHOLD) entry.passed += 1;
    }
  }

  return modules.map((m) => {
    const segMap = acc.get(m.id)!;
    const values: Record<string, number> = {};
    for (const key of segmentKeys) {
      const { assigned, passed } = segMap.get(key)!;
      values[key] = assigned > 0 ? Math.round((passed / assigned) * 100) : 0;
    }
    return { moduleId: m.id, shortTitle: m.shortTitle, values };
  });
}

/** % сдавших (>=70%) каждый модуль параллели `group`, отдельно по типу обучения (asinxron/onlayn/əyani) */
export function getModulePassRateByTrainingType(teachers: Teacher[], group: GradeGroup): ModuleSegmentRow[] {
  return getModulePassRateBySegment(teachers, group, TRAINING_TYPES, (te) => te.trainingType);
}

/** % сдавших (>=70%) каждый модуль параллели `group`, отдельно по стажу (OLD/NEW) */
export function getModulePassRateByLifecycle(teachers: Teacher[], group: GradeGroup): ModuleSegmentRow[] {
  return getModulePassRateBySegment(teachers, group, LIFECYCLE_STATUSES, (te) => te.lifecycleStatus);
}

export interface AllMetricsSnapshot {
  /** "Всего учителей"/"Вошли"/"Не вошли" — прямой подсчёт по листу "Все учителя 26/27" */
  platform: RawPlatformStats;
  /** "Прошли курс" по непересекающимся категориям: только 2–4 / только 5–9 / обе параллели / IT-классы */
  passByCategory: CategoryStat[];
  /** Общий "Прошли курс": каждый учитель с назначенным классом — один раз */
  overallPass: OverallTeacherPassStat;
  /** "Детализация по каждому модулю" — знаменатель/числитель для КАЖДОГО модуля каждой параллели */
  moduleStatsByGroup: Record<GradeGroup, ModuleStat[]>;
  /** Общий средний балл по всем вошедшим — карточка "Среднее решение" на Главной */
  averageScore: AverageScoreStat;
  /** Виджет «IT-классы (10–11)»: посещаемость, среднее решение, прошли аттестацию */
  itClasses: CategoryStat;
}

/**
 * Единая точка пересчёта ВСЕХ показателей дашборда "с нуля" по свежему
 * массиву учителей — вызывается заново при каждом рендере (т.е. после
 * каждой загрузки/«Обновить данные»), никогда не переиспользует старые
 * значения. Оркестрирует чистые функции этого файла, чтобы ВСЕ страницы
 * читали результат ОДНОГО расчёта.
 */
export function recalculateAllMetrics(teachers: Teacher[]): AllMetricsSnapshot {
  const platform = getRawPlatformStats(teachers);
  const passByCategory = getTeacherCategoryStats(teachers);
  const overallPass = getOverallTeacherPassStat(teachers);
  const moduleStatsByGroup = Object.fromEntries(
    GRADE_GROUPS.map((group) => [group, getModuleStatsForGroup(teachers, group)]),
  ) as Record<GradeGroup, ModuleStat[]>;
  const averageScore = getOverallAverageScore(teachers);
  const itClasses = passByCategory.find((c) => c.category === 'it')!;

  return { platform, passByCategory, overallPass, moduleStatsByGroup, averageScore, itClasses };
}
