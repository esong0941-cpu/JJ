import {
  ComposedChart, Area, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { PricePoint } from '../types/stock';

interface Props {
  data: PricePoint[];
  color?: string;
  height?: number;
  showAxis?: boolean;
  showVolume?: boolean;
}

export function StockChart({ data, height = 200, showAxis = true, showVolume = true }: Props) {
  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;
  const lineColor = isPositive ? '#ef4444' : '#3b82f6';

  const displayData = data.slice(-90).map(d => ({
    date: d.date.slice(5),
    price: d.price,
    volume: d.volume ?? 0,
  }));

  const prices = displayData.map(d => d.price).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 1;
  const padding = (maxPrice - minPrice) * 0.1 || 1;

  const maxVol = Math.max(...displayData.map(d => d.volume), 1);

  const priceHeight = showVolume ? Math.round(height * 0.72) : height;
  const volHeight = showVolume ? height - priceHeight - 4 : 0;

  return (
    <div style={{ height }}>
      {/* Price area */}
      <ResponsiveContainer width="100%" height={priceHeight}>
        <ComposedChart data={displayData} margin={{ top: 4, right: 4, bottom: 0, left: showAxis ? 60 : 4 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          {showAxis && (
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              interval={11}
            />
          )}
          {showAxis && (
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              tickFormatter={v => v.toLocaleString()}
              width={56}
            />
          )}
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: lineColor }}
            formatter={(v, name) => {
              const n = Number(v);
              if (name === 'price') return [n.toLocaleString() + '원', '주가'];
              return [n.toLocaleString(), '거래량'];
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume bar */}
      {showVolume && displayData.some(d => d.volume > 0) && (
        <ResponsiveContainer width="100%" height={volHeight}>
          <ComposedChart data={displayData} margin={{ top: 0, right: 4, bottom: 2, left: showAxis ? 60 : 4 }}>
            {showAxis && (
              <YAxis
                domain={[0, maxVol * 1.2]}
                tick={{ fill: '#6b7280', fontSize: 9 }}
                tickLine={false}
                tickFormatter={v => v > 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}K`}
                width={56}
              />
            )}
            <Bar dataKey="volume" fill={lineColor} opacity={0.4} radius={[1, 1, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
