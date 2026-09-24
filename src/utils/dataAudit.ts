// Система авто-аудита целостности данных — запускается при каждой
// загрузке/обновлении (см. store/useTeacherStore.ts) и НИКОГДА не
// блокирует и не ломает работу сайта: это просто список найденных
// расхождений для значка "⚠️ Аудит данных" в шапке (Layout.tsx).

import type { Teacher } from '../types/teacher';
import type { StatsSummary } from '../services/teacherService';
import type { ScheduleAuditInfo } from '../services/scheduleMapping';

export interface AuditIssue {
  id: string;
  message: string;
}

export function runDataAudit(
  teachers: Teacher[],
  statsSummary: StatsSummary | null,
  scheduleAudit: ScheduleAuditInfo,
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Проверка 1: "Вошли" + "Не вошли" должно совпадать со "Всего" на листе Statistika.
  if (statsSummary && statsSummary.entered != null && statsSummary.notEntered != null && statsSummary.total != null) {
    const sum = statsSummary.entered + statsSummary.notEntered;
    if (sum !== statsSummary.total) {
      issues.push({
        id: 'stats-sum-mismatch',
        message: `Лист "Statistika": "Вошли" (${statsSummary.entered}) + "Не вошли" (${statsSummary.notEntered}) = ${sum}, а указано "Всего" = ${statsSummary.total}.`,
      });
    }
  }

  // Проверка 2: расхождение количества учителей между Statistika и реестром (листы "Все учителя" + "ИТ классы").
  if (statsSummary?.total != null && teachers.length !== statsSummary.total) {
    issues.push({
      id: 'stats-registry-mismatch',
      message: `На листе "Statistika" указано ${statsSummary.total} учителей, а в реестре загружено ${teachers.length}.`,
    });
  }

  // Проверка 3: формат дат в графике "(АЗ) График 26/27" (ожидается DD.MM.YYYY).
  if (scheduleAudit.invalidDateCount > 0) {
    issues.push({
      id: 'schedule-invalid-dates',
      message: `В листе "(АЗ) График 26/27" ${scheduleAudit.invalidDateCount} дат(ы) в нераспознанном формате (ожидается DD.MM.YYYY) — эти модули по умолчанию считаются открытыми.`,
    });
  }

  return issues;
}
