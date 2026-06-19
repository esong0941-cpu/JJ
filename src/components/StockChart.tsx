import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { PricePoint } from '../types/stock';

interface Props {
  data: PricePoint[];
  color?: string;
  height?: number;
  showAxis?: boolean;
}

export function StockChart({ data, color = '#ef4444', height = 200, showAxis = true }: Props) {
  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;
  const lineColor = isPositive ? '#ef4444' : '#3b82f6';

  const displayData = data.slice(-60).map(d => ({
    date: d.date.slice(5),
    price: d.price,
  }));

  const minPrice = Math.min(...displayData.map(d => d.price));
  const maxPrice = Math.max(...displayData.map(d => d.price));
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: showAxis ? 60 : 5 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        {showAxis && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
        {showAxis && (
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            interval={9}
          />
        )}
        {showAxis && (
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            tickFormatter={v => v.toLocaleString()}
          />
        )}
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af' }}
          itemStyle={{ color: lineColor }}
          formatter={(v) => [Number(v).toLocaleString() + '원', '주가']}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={lineColor}
          strokeWidth={2}
          fill={`url(#grad-${color})`}
          dot={false}
          activeDot={{ r: 4, fill: lineColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
