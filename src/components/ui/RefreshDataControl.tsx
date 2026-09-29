import { RefreshCw } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useT } from '../../i18n/useLocaleStore';

/**
 * Кнопка "Обновить данные" + время последнего успешного ответа
 * /api/sheets — общий компонент для ВСЕХ страниц (Главная, Статистика,
 * Учителя, 10–11 классы), чтобы свежесть данных была видна везде
 * одинаково, а не только там, где раньше была кнопка. Источник данных
 * (useTeacherStore) один на всё приложение — обновление здесь обновляет
 * данные сразу для всех страниц, не только для той, где нажали.
 */
export function RefreshDataControl() {
  const { reload, refreshing, lastFetchedAt } = useTeacherStore();
  const t = useT();

  return (
    <div className="flex items-center gap-2">
      {lastFetchedAt && !refreshing && (
        <span className="text-xs text-slate-400">
          {t.common.lastUpdatedAt.replace(
            '{time}',
            new Date(lastFetchedAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          )}
        </span>
      )}
      <button
        onClick={() => reload()}
        disabled={refreshing}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
      >
        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        {refreshing ? t.common.refreshing : t.common.refreshData}
      </button>
    </div>
  );
}
