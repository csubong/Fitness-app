import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatChartDate } from '../dateUtils.js';

export default function TrendChart({ data, dataKey, color, unit, height = 180 }) {
  const chartData = data.map((d) => ({ ...d, label: formatChartDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
        <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text)' }}
          formatter={(value) => [`${Math.round(value)}${unit || ''}`, undefined]}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
