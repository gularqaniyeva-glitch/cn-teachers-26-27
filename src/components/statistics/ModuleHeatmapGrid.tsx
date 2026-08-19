import type { ModuleStat } from '../../utils/stats';

interface ModuleHeatmapGridProps {
  modules: ModuleStat[];
  passedLabel: string;
  ofLabel: string;
  emptyLabel: string;
}

const TIER_STYLES = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  mid: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-rose-200 bg-rose-50 text-rose-800',
} as const;

function tierFor(passRate: number, assigned: number): keyof typeof TIER_STYLES {
  if (assigned === 0) return 'low';
  if (passRate >= 90) return 'high';
  if (passRate >= 70) return 'mid';
  return 'low';
}

/**
 * Компактная сетка карточек-модулей вместо бесконечного списка зелёных
 * полосок — по одной карточке на модуль, с heatmap-раскраской по доле
 * сдавших (>=90% — спокойный зелёный, 70–89% — жёлтый/оранжевый, <70% —
 * красный).
 */
export function ModuleHeatmapGrid({ modules, passedLabel, ofLabel, emptyLabel }: ModuleHeatmapGridProps) {
  if (modules.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {modules.map((m) => {
        const tier = tierFor(m.passRate, m.assigned);
        return (
          <div key={m.moduleId} className={`rounded-xl border p-3 ${TIER_STYLES[tier]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{m.shortTitle}</p>
            <p className="mt-1 text-2xl font-bold">{m.assigned > 0 ? `${m.passRate}%` : '—'}</p>
            <p className="mt-0.5 text-xs opacity-70">
              {passedLabel} {m.passed} {ofLabel} {m.assigned}
            </p>
          </div>
        );
      })}
    </div>
  );
}
