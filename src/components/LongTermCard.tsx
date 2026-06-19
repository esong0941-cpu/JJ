import type { LongTermStock } from '../types/stock';
import { Star, TrendingUp } from 'lucide-react';

interface Props {
  stock: LongTermStock;
  onClick: () => void;
  isWatched?: boolean;
  onToggleWatch?: (code: string) => void;
}

const consensusConfig = {
  STRONG_BUY: { label: '강력매수', color: 'text-red-400 bg-red-900/30' },
  BUY: { label: '매수', color: 'text-orange-400 bg-orange-900/30' },
  HOLD: { label: '중립', color: 'text-gray-400 bg-gray-700' },
  SELL: { label: '매도', color: 'text-blue-400 bg-blue-900/30' },
};

interface MetricBarProps {
  label: string;
  value: string;
  benchmark?: string;
  positive?: boolean;
}

function MetricBar({ label, value, benchmark, positive = true }: MetricBarProps) {
  return (
    <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-700 last:border-0">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {benchmark && <span className="text-gray-600 text-xs">{benchmark}</span>}
        <span className={`font-medium ${positive ? 'text-green-400' : 'text-white'}`}>{value}</span>
      </div>
    </div>
  );
}

export function LongTermCard({ stock, onClick, isWatched, onToggleWatch }: Props) {
  const cfg = consensusConfig[stock.analystConsensus];
  const watched = isWatched;

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-xl border border-gray-700 p-4 cursor-pointer card-hover hover:border-gray-500"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-500">{stock.sector}</span>
          </div>
          <div className="text-white font-bold text-lg">{stock.name}</div>
          <div className="text-gray-500 text-xs">{stock.code} · {stock.market}</div>
        </div>
        <div className="text-right">
          <button
            onClick={e => { e.stopPropagation(); onToggleWatch?.(stock.code); }}
            className={`mb-1 transition-colors float-right ml-2 ${watched ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
          >
            <Star size={15} fill={watched ? 'currentColor' : 'none'} />
          </button>
          <div className="text-white font-bold">{stock.price.toLocaleString()}원</div>
          <div className={`text-sm ${stock.changeRate > 0 ? 'text-red-400' : 'text-blue-400'}`}>
            {stock.changeRate > 0 ? '▲' : '▼'} {Math.abs(stock.changeRate).toFixed(2)}%
          </div>
          <div className="text-orange-400 text-sm font-bold mt-1">
            <TrendingUp size={12} className="inline mr-1" />
            +{stock.upside.toFixed(1)}% 상승여력
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-3 mb-3">
        <MetricBar label="PER" value={`${stock.per.toFixed(1)}배`} />
        <MetricBar label="PBR" value={`${stock.pbr.toFixed(2)}배`} />
        <MetricBar label="ROE" value={`${stock.roe.toFixed(1)}%`} positive={stock.roe > 10} />
        <MetricBar label="배당수익률" value={`${stock.dividendYield.toFixed(2)}%`} positive={stock.dividendYield > 2} />
        <MetricBar label="매출성장률" value={`+${stock.revenueGrowth.toFixed(1)}%`} positive />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>투자 매력도</span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} className={i < stock.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{stock.reason}</p>

      <div className="flex justify-between items-center pt-3 border-t border-gray-700">
        <div className="text-xs">
          <span className="text-gray-500">목표주가 </span>
          <span className="text-orange-400 font-bold">{stock.targetPrice.toLocaleString()}원</span>
        </div>
        <div className="text-xs text-gray-500">
          애널리스트 {cfg.label} 컨센서스
        </div>
      </div>
    </div>
  );
}
