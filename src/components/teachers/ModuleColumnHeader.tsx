import { formatDeadlineShort, isDeadlinePassed } from '../../utils/deadlines';
import type { ModuleColumn } from '../../data/constants';
import { useT } from '../../i18n/useLocaleStore';

interface ModuleColumnHeaderProps {
  column: ModuleColumn;
  /** ISO-дата дедлайна этого модуля, если график её знает (см. utils/deadlines.ts buildModuleDeadlineMap) */
  deadlineIso?: string;
}

/** Заголовок колонки модуля + компактная подпись с датой дедлайна (без года) под ним — общий вид для "Все учителя" и "Отчёт по модулю". */
export function ModuleColumnHeader({ column, deadlineIso }: ModuleColumnHeaderProps) {
  const t = useT();
  const overdue = deadlineIso ? isDeadlinePassed(deadlineIso) : false;

  return (
    <div className="flex flex-col items-center leading-tight">
      <span>{column.label}</span>
      {deadlineIso && (
        <span
          className={`mt-0.5 text-[10px] font-normal normal-case opacity-70 ${
            overdue ? 'text-rose-600' : 'text-slate-400'
          }`}
        >
          {overdue && '⏰ '}
          {t.quickList.deadlinePrefix} {formatDeadlineShort(deadlineIso)}
        </span>
      )}
    </div>
  );
}
