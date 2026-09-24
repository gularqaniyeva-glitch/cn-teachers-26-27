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
import type { ScheduleAuditInfo } from '../services/scheduleMapping';

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
      message: `В листе "(АЗ) График 26/27" найдены проблемы с датами (столбцы S/T): ${parts.join(', ')} (ожидается DD.MM.YYYY) — такие модули по умолчанию считаются открытыми.`,
    });
  }

  // Проверка 3: дубликаты учителей по FIN.
  const finDuplicate = findDuplicateIssue(teachers, (t) => t.fin, 'FIN', 'fin-duplicates');
  if (finDuplicate) issues.push(finDuplicate);

  // Проверка 4: дубликаты учителей по LMS ID.
  const lmsIdDuplicate = findDuplicateIssue(teachers, (t) => t.lmsId, 'LMS ID', 'lmsid-duplicates');
  if (lmsIdDuplicate) issues.push(lmsIdDuplicate);

  return issues;
}
