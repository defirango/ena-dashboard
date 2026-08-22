'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fmtUsd, fmtPct } from '../lib/format';

const COLORS = ['#2a78d6', '#eb6834']; // categorical slots 1 & 2 (validated palette) — fixed order, never cycled

// NOTE: formatter functions can't be passed as props from a Server Component,
// so this client component owns its own formatting — pick by a plain string.
const FORMATTERS = {
  usd: (v) => fmtUsd(v),
  usdPrecise: (v) => fmtUsd(v, { compact: false }),
  pct: (v) => fmtPct(v)
};

export default function TrendChart({ data, series, format = 'usd', height = 220, emptyMessage }) {
  const yFormatter = FORMATTERS[format] || FORMATTERS.usd;

  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-neutral-300 text-center text-sm text-neutral-400 dark:border-neutral-700"
        style={{ height }}
      >
        {emptyMessage || 'History will appear here once the dashboard has collected a few days of data.'}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-neutral-400" tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-neutral-400" tickLine={false} axisLine={false} tickFormatter={yFormatter} width={54} />
        <Tooltip
          formatter={(value, name) => [yFormatter(value), name]}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e5e5' }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
