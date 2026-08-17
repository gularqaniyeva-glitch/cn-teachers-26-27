import type { ModuleSegmentRow } from '../../utils/stats';

interface ColumnDef {
  key: string;
  label: string;
}

interface ModuleBreakdownTableProps {
  rows: ModuleSegmentRow[];
  columns: ColumnDef[];
  moduleColumnLabel: string;
}

function cellColor(value: number): string {
  if (value >= 70) return 'text-emerald-600';
  if (value >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

/** Таблица "% сдавших (>=70%) по модулям" — модуль в строках, сегменты (тип обучения / стаж) в столбцах */
export function ModuleBreakdownTable({ rows, columns, moduleColumnLabel }: ModuleBreakdownTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/95 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">{moduleColumnLabel}</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-center">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.moduleId}>
              <td className="px-3 py-1.5 font-medium text-slate-700 whitespace-nowrap">{row.shortTitle}</td>
              {columns.map((c) => {
                const value = row.values[c.key] ?? 0;
                return (
                  <td key={c.key} className={`px-3 py-1.5 text-center font-medium ${cellColor(value)}`}>
                    {value}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
