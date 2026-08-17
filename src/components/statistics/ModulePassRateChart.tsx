import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ModuleSegmentRow } from '../../utils/stats';

interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

interface ModulePassRateChartProps {
  rows: ModuleSegmentRow[];
  series: SeriesDef[];
}

/** Столбчатый график "% сдавших (>=70%) по модулям", несколько серий рядом (тип обучения либо OLD/NEW) */
export function ModulePassRateChart({ rows, series }: ModulePassRateChartProps) {
  const data = rows.map((r) => ({ name: r.shortTitle, ...r.values }));

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={40} />
          <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value}%`} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
