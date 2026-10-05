// Система авто-аудита целостности СЫРЫХ данных — запускается при каждой
// загрузке/обновлении (см. store/useTeacherStore.ts) и НИКОГДА не
// блокирует и не ломает работу сайта: это просто список найденных
// расхождений для значка "⚠️ Аудит данных" в шапке (Layout.tsx).
//
// Лист "Statistika" больше не используется нигде в приложении — все KPI
// считаются напрямую по сырым данным листа "Все учителя 26/27" (см.
// utils/stats.ts), поэтому и проверки здесь идут по тем же сырым данным,
// а не по стороннему агрегату.

import type { Teacher } from '../types/teacher';
import { getCurrentScheduleIndex, isModuleConfirmedOpen, type ScheduleAuditInfo } from '../services/scheduleMapping';
import { findGroupAnomalies } from './anomalies';
import { isUserActive, recalculateAllMetrics } from './stats';

export interface AuditIssue {
  id: string;
  message: string;
}

/** Находит поле с повторяющимся непустым значением у нескольких учителей (FIN, LMS ID и т.п.) — одно сводное сообщение на поле, а не по записи на каждый дубликат. */
function findDuplicateIssue(
  teachers: Teacher[],
  keyFn: (t: Teacher) => string,
  fieldLabel: string,
  id: string,
): AuditIssue | null {
  const groups = new Map<string, Teacher[]>();
  for (const teacher of teachers) {
    const key = keyFn(teacher).trim();
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(teacher);
    groups.set(key, list);
  }

  const duplicates = [...groups.entries()].filter(([, list]) => list.length > 1);
  if (duplicates.length === 0) return null;

  const affectedTeachers = duplicates.reduce((sum, [, list]) => sum + list.length, 0);
  const [exampleKey, exampleTeachers] = duplicates[0];
  const exampleNames = exampleTeachers.map((t) => t.fullName).join(', ');

  return {
    id,
    message: `Обнаружено ${duplicates.length} повторяющихся значений ${fieldLabel} (всего ${affectedTeachers} учителей). Например, "${exampleKey}": ${exampleNames}.`,
  };
}

export function runDataAudit(teachers: Teacher[], scheduleAudit: ScheduleAuditInfo): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Проверка 1: "Вошли" + "Не вошли" должно совпадать со "Всего учителей" —
  // оба показателя считаются прямым подсчётом по одному и тому же массиву
  // учителей (лист "Все учителя 26/27"), поэтому расхождение возможно
  // только при реальном сбое подсчёта.
  const total = teachers.length;
  const entered = teachers.filter((t) => t.platformStatus === 'entered').length;
  const notEntered = teachers.filter((t) => t.platformStatus === 'not_entered').length;
  if (entered + notEntered !== total) {
    issues.push({
      id: 'entered-sum-mismatch',
      message: `Расхождение в подсчёте: "Вошли" (${entered}) + "Не вошли" (${notEntered}) = ${entered + notEntered}, а всего учителей — ${total}.`,
    });
  }

  // Проверка 1б: учитель с баллом > 0 по какому-либо модулю, но со статусом
  // входа, отличным от «заходил»/«daxil olub» — решить модуль, не зайдя на
  // платформу, нельзя, значит статус в таблице не обновлён. Сайт считает
  // такого учителя вошедшим (единый флаг isUserActive), но стоит поправить
  // исходные данные.
  const staleStatus = teachers.filter(
    (t) => t.platformStatus !== 'entered' && t.moduleResults.some((r) => r.score > 0),
  ).length;
  if (staleStatus > 0) {
    issues.push({
      id: 'stale-login-status',
      message: `${staleStatus} учител(ей) имеют балл > 0 по модулям, но статус входа не «заходил» — на сайте они учтены как вошедшие, статус в таблице стоит обновить.`,
    });
  }

  // Проверка 2: формат и наличие дат в графике "(АЗ) График 26/27" —
  // столбцы S (Açılmasını yoxla) и T (Deadline), ожидается DD.MM.YYYY.
  if (scheduleAudit.invalidDateCount > 0 || scheduleAudit.emptyDateCount > 0) {
    const parts: string[] = [];
    if (scheduleAudit.invalidDateCount > 0) {
      parts.push(`${scheduleAudit.invalidDateCount} дат(ы) в нераспознанном формате`);
    }
    if (scheduleAudit.emptyDateCount > 0) {
      parts.push(`${scheduleAudit.emptyDateCount} пустых ячеек даты`);
    }
    issues.push({
      id: 'schedule-invalid-dates',
      message: `В листе "(АЗ) График 26/27" найдены проблемы с датами (столбцы S/T): ${parts.join(', ')} (ожидается DD.MM.YYYY) — модули с пустой датой открытия считаются ЗАКРЫТЫМИ.`,
    });
  }

  // Проверка 3: дубликаты учителей по FIN.
  const finDuplicate = findDuplicateIssue(teachers, (t) => t.fin, 'FIN', 'fin-duplicates');
  if (finDuplicate) issues.push(finDuplicate);

  // Проверка 4: дубликаты учителей по LMS ID.
  const lmsIdDuplicate = findDuplicateIssue(teachers, (t) => t.lmsId, 'LMS ID', 'lmsid-duplicates');
  if (lmsIdDuplicate) issues.push(lmsIdDuplicate);

  // Проверка 5: самопроверка — ни один алерт "Ошибка выгрузки LMS" не
  // должен ссылаться на модуль без подтверждённой наступившей даты
  // открытия по графику (см. isModuleConfirmedOpen в scheduleMapping.ts и
  // findGroupAnomalies в utils/anomalies.ts). Ловит регрессию этого
  // правила, а не полагается только на то, что фильтр где-то применён.
  const schedule = getCurrentScheduleIndex();
  const leakedAnomalies = findGroupAnomalies(teachers).filter((a) => !isModuleConfirmedOpen(schedule, a.module.id));
  if (leakedAnomalies.length > 0) {
    const shortTitles = [...new Set(leakedAnomalies.map((a) => a.module.shortTitle))].join(', ');
    issues.push({
      id: 'anomaly-unopened-module-leak',
      message: `Аудит аномалий ссылается на ещё не открытые по графику модули: ${shortTitles}. Это регрессия фильтрации — такие алерты нужно скрыть.`,
    });
  }

  // Самопроверка (Self-Validation): цепочка «прошли курс <= вошли на
  // платформу <= всего с назначенным классом» в одной и той же выборке
  // (учителя с классом) и согласованность чисел между блоками дашборда.
  const metrics = recalculateAllMetrics(teachers);
  const eligible = teachers.filter((t) => t.hasAssignedClass);
  const eligibleActive = eligible.filter(isUserActive).length;
  if (metrics.overallPass.passedTeachers > eligibleActive || eligibleActive > eligible.length) {
    issues.push({
      id: 'selfcheck-pass-active-total',
      message: `Нарушена цепочка: прошли курс (${metrics.overallPass.passedTeachers}) <= вошли на платформу (${eligibleActive}) <= всего с классом (${eligible.length}).`,
    });
  }
  if (metrics.averageScore.activeTeachers !== metrics.platform.entered) {
    issues.push({
      id: 'selfcheck-average-vs-entered',
      message: `«Среднее решение» посчитано по ${metrics.averageScore.activeTeachers} учителям, а «Вошли на платформу» = ${metrics.platform.entered} — база должна совпадать.`,
    });
  }
  // Категории учителей непересекающиеся: каждый учитель — ровно в одной,
  // поэтому суммы по категориям обязаны совпадать с общим числом.
  const catTotal = metrics.passByCategory.reduce((sum, c) => sum + c.totalTeachers, 0);
  const catPassed = metrics.passByCategory.reduce((sum, c) => sum + c.passedTeachers, 0);
  if (catTotal !== eligible.length || catPassed !== metrics.overallPass.passedTeachers) {
    issues.push({
      id: 'selfcheck-categories-sum',
      message: `Категории учителей пересекаются или теряют учителей: всего ${catTotal} из ${eligible.length}, прошли ${catPassed} из ${metrics.overallPass.passedTeachers}.`,
    });
  }

  return issues;
}
