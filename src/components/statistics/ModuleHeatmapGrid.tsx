import type { CSSProperties } from 'react';
import type { ModuleStat } from '../../utils/stats';

interface ModuleHeatmapGridProps {
  modules: ModuleStat[];
  passedLabel: string;
  ofLabel: string;
  emptyLabel: string;
}

// Явные inline-стили (не классы Tailwind) — конкретные hex-цвета, которые
// html2canvas-pro читает напрямую через style, без обращения к CSS-файлу
// и без риска споткнуться на цветовых функциях/каскаде Tailwind при
// экспорте карточки в PNG кнопкой "Скачать PNG"/"Скопировать как картинку".
const TIER_STYLES: Record<'high' | 'mid' | 'low', CSSProperties> = {
  high: { borderColor: '#a7f3d0', backgroundColor: '#ecfdf5', color: '#065f46' },
  mid: { borderColor: '#fde68a', backgroundColor: '#fffbeb', color: '#92400e' },
  low: { borderColor: '#fecdd3', backgroundColor: '#fff1f2', color: '#9f1239' },
};

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
          <div
            key={m.moduleId}
            style={{ borderRadius: 12, border: '1px solid', padding: 12, ...TIER_STYLES[tier] }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', opacity: 0.7, margin: 0 }}>
              {m.shortTitle}
            </p>
            <p style={{ marginTop: 4, fontSize: 24, fontWeight: 700, margin: '4px 0 0' }}>
              {m.assigned > 0 ? `${m.passRate}%` : '—'}
            </p>
            <p style={{ marginTop: 2, fontSize: 12, opacity: 0.7, margin: '2px 0 0' }}>
              {passedLabel} {m.passed} {ofLabel} {m.assigned}
            </p>
          </div>
        );
      })}
    </div>
  );
}
