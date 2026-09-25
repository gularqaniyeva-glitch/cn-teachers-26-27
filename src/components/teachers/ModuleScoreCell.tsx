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

const BADGE_CLASS = 'inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded px-1 text-[10px] font-semibold';

/**
 * Единая логика отображения ячейки модуля везде в таблицах, по бизнес-
 * правилу из исходной таблицы:
 * - результата нет вовсе (модуль не относится к параллели учителя) →
 *   ячейка ПОЛНОСТЬЮ ПУСТАЯ — никаких "N/A", прочерков или плашек;
 * - статус "Старый учитель": если по факту РЕШИЛ модуль (балл ≥70%) —
 *   показываем сам процент, но ГОЛУБЫМ (не зелёным как у обычных
 *   учителей) — так видно, что это старый учитель, но не прячем его
 *   реальный результат под общей плашкой "OLD"; если НЕ решил — серо-
 *   голубая плашка "OLD" (низкий/нулевой балл не считается провалом по
 *   бизнес-правилу, поэтому НЕ красная);
 * - обычный учитель, балл 0 (не начал) → розовая плашка "Не начал";
 * - обычный учитель, 0% < балл < 70% → красный бейдж "Не прошёл";
 * - обычный учитель, балл ≥70% → зелёный бейдж "Прошёл".
 */
export function ModuleScoreCell({ result, label, tooltipOverride, colorOverride }: ModuleScoreCellProps) {
  const t = useT();

  if (!result) return null;

  if (colorOverride) {
    return (
      <span
        title={tooltipOverride ?? `${label}: ${result.score}%`}
        className={`${BADGE_CLASS} text-white`}
        style={{ backgroundColor: colorOverride }}
      >
        {result.score}
      </span>
    );
  }

  if (result.status === 'old_teacher') {
    if (result.score >= 70) {
      return (
        <span
          title={tooltipOverride ?? `${label}: ${t.moduleStatus.oldTeacher} (${result.score}%)`}
          className={`${BADGE_CLASS} bg-sky-500 text-white`}
        >
          {result.score}
        </span>
      );
    }
    return (
      <span
        title={tooltipOverride ?? `${label}: ${t.moduleStatus.oldTeacher} (${result.score}%)`}
        className={`${BADGE_CLASS} bg-sky-100 text-sky-700`}
      >
        {t.moduleStatus.oldTeacherShort}
      </span>
    );
  }

  if (result.score <= 0) {
    return (
      <span
        title={tooltipOverride ?? `${label}: ${t.moduleStatus.notStarted}`}
        className={`${BADGE_CLASS} bg-pink-100 text-pink-600`}
      >
        —
      </span>
    );
  }

  return (
    <span
      title={tooltipOverride ?? `${label}: ${result.score}%`}
      className={`${BADGE_CLASS} text-white`}
      style={{ backgroundColor: result.score >= 70 ? '#059669' : '#e11d48' }}
    >
      {result.score}
    </span>
  );
}
