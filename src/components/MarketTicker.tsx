interface TickerItem {
  code: string;
  name: string;
  price: number;
  changeRate: number;
}

interface MarketTickerProps {
  stocks: TickerItem[];
}

export function MarketTicker({ stocks }: MarketTickerProps) {
  const doubled = [...stocks, ...stocks];

  return (
    <div className="bg-gray-900 border-b border-gray-700 overflow-hidden">
      <div className="flex items-center">
        <div className="bg-yellow-500 text-black text-xs font-bold px-3 py-2 shrink-0 z-10">
          실시간
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex ticker-animate whitespace-nowrap">
            {doubled.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 border-r border-gray-700">
                <span className="text-gray-400 text-xs">{s.code}</span>
                <span className="text-white text-sm font-medium">{s.name}</span>
                <span className="text-sm font-bold">{s.price.toLocaleString()}</span>
                <span className={`text-xs ${s.changeRate > 0 ? 'text-red-400' : s.changeRate < 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                  {s.changeRate > 0 ? '▲' : s.changeRate < 0 ? '▼' : '–'}
                  {Math.abs(s.changeRate).toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
