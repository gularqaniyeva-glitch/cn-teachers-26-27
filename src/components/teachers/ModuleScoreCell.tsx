import { useT } from '../../i18n/useLocaleStore';

interface ModuleScoreCellProps {
  /** undefined — модуль вообще не назначен этому учителю (другая параллель), а не просто "0%" */
  result?: { score: number; status?: string } | undefined;
  /** Название колонки для подсказки, напр. "M6 (5–9)" */
  label: string;
  /** Переопределяет обычную подсказку — например для строки "🔍 На проверку" у аномалий */
  tooltipOverride?: string;
  /** Принудительный цвет плашки (напр. амбер для подозрения на сбой LMS) вместо цвета по порогу 70% */
  colorOverride?: string;
}

/**
 * Единая логика отображения ячейки модуля везде в таблицах, по бизнес-
 * правилу из исходной таблицы:
 * - результата нет вовсе (модуль не относится к параллели учителя) →
 *   ячейка ПОЛНОСТЬЮ ПУСТАЯ — никаких "N/A", прочерков или плашек;
 * - статус "Старый учитель" (низкий/нулевой балл, но это не провал по
 *   бизнес-правилу) → серая плашка "OLD", а не красный провал;
 * - результат есть, но балл 0 (не начал) → обычный прочерк "—";
 * - есть балл > 0 → цветной бейдж (зелёный ≥70%, красный <70%).
 */
export function ModuleScoreCell({ result, label, tooltipOverride, colorOverride }: ModuleScoreCellProps) {
  const t = useT();

  if (!result) return null;

  if (colorOverride) {
    return (
      <span
        title={tooltipOverride ?? `${label}: ${result.score}%`}
        className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded px-1 text-[10px] font-semibold text-white"
        style={{ backgroundColor: colorOverride }}
      >
        {result.score}
      </span>
    );
  }

  if (result.status === 'old_teacher') {
    return (
      <span
        title={tooltipOverride ?? `${label}: ${t.moduleStatus.oldTeacher} (${result.score}%)`}
        className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded bg-slate-200 px-1 text-[9px] font-semibold text-slate-500"
      >
        {t.moduleStatus.oldTeacherShort}
      </span>
    );
  }

  if (result.score <= 0) {
    return (
      <span title={`${label}: ${t.moduleStatus.notStarted}`} className="text-slate-300">
        —
      </span>
    );
  }

  return (
    <span
      title={tooltipOverride ?? `${label}: ${result.score}%`}
      className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded px-1 text-[10px] font-semibold text-white"
      style={{ backgroundColor: result.score >= 70 ? '#059669' : '#e11d48' }}
    >
      {result.score}
    </span>
  );
}
