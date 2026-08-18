import { useT } from '../../i18n/useLocaleStore';

interface ModuleScoreCellProps {
  /** undefined — модуль вообще не назначен этому учителю (другая параллель), а не просто "0%" */
  result?: { score: number } | undefined;
  /** Название колонки для подсказки, напр. "M6 (5–9)" */
  label: string;
  /** Переопределяет обычную подсказку — например для строки "🔍 На проверку" у аномалий */
  tooltipOverride?: string;
  /** Принудительный цвет плашки (напр. амбер для подозрения на сбой LMS) вместо цвета по порогу 70% */
  colorOverride?: string;
}

/**
 * Единая логика отображения ячейки модуля везде в таблицах:
 * - результата нет вовсе (модуль не относится к параллели учителя) → серая
 *   плашка "N/A" с подсказкой "Параллель не назначена учителю";
 * - результат есть, но балл 0 (не начал/не сдал) → обычный прочерк "—";
 * - есть балл > 0 → цветной бейдж (зелёный ≥70%, красный <70%).
 */
export function ModuleScoreCell({ result, label, tooltipOverride, colorOverride }: ModuleScoreCellProps) {
  const t = useT();

  if (!result) {
    return (
      <span
        title={`${label}: ${t.moduleStatus.notAssignedTooltip}`}
        className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-400"
      >
        {t.moduleStatus.notAssigned}
      </span>
    );
  }

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
