import type { ShortTermStock } from '../types/stock';
import { TrendingUp, TrendingDown, Eye, Zap, Star } from 'lucide-react';

interface Props {
  stock: ShortTermStock;
  onClick: () => void;
  isWatched?: boolean;
  onToggleWatch?: (code: string) => void;
}

const signalConfig = {
  STRONG_BUY: { label: '강력매수', color: 'bg-red-500', textColor: 'text-red-400', icon: Zap },
  BUY: { label: '매수', color: 'bg-orange-500', textColor: 'text-orange-400', icon: TrendingUp },
  WATCH: { label: '관망', color: 'bg-yellow-500', textColor: 'text-yellow-400', icon: Eye },
  SELL: { label: '매도', color: 'bg-blue-500', textColor: 'text-blue-400', icon: TrendingDown },
};

const bollingerLabel = { UPPER: '상단', MIDDLE: '중단', LOWER: '하단' };

export function ShortTermCard({ stock, onClick, isWatched, onToggleWatch }: Props) {
  const cfg = signalConfig[stock.signal];
  const Icon = cfg.icon;
  const upside = ((stock.targetPrice - stock.price) / stock.price * 100).toFixed(1);
  const watched = isWatched ?? false;

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-xl border border-gray-700 p-4 cursor-pointer card-hover hover:border-gray-500"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full text-white font-bold ${cfg.color}`}>
              <Icon size={10} className="inline mr-1" />
              {cfg.label}
            </span>
            <span className="text-xs text-gray-500">{stock.market} · {stock.sector}</span>
          </div>
          <div className="text-white font-bold text-lg">{stock.name}</div>
          <div className="text-gray-400 text-xs">{stock.code}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={e => { e.stopPropagation(); onToggleWatch?.(stock.code); }}
            className={`transition-colors ${watched ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
          >
            <Star size={15} fill={watched ? 'currentColor' : 'none'} />
          </button>
          <div className="text-white font-bold text-lg">{stock.price.toLocaleString()}원</div>
          <div className={`text-sm ${stock.changeRate > 0 ? 'text-red-400' : 'text-blue-400'}`}>
            {stock.changeRate > 0 ? '▲' : '▼'} {Math.abs(stock.changeRate).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-gray-900 rounded-lg p-2 text-center">
          <div className="text-gray-500">RSI</div>
          <div className={`font-bold ${stock.rsi < 30 ? 'text-green-400' : stock.rsi > 70 ? 'text-red-400' : 'text-white'}`}>
            {stock.rsi.toFixed(1)}
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-2 text-center">
          <div className="text-gray-500">볼린저</div>
          <div className={`font-bold ${stock.bollingerPosition === 'LOWER' ? 'text-green-400' : stock.bollingerPosition === 'UPPER' ? 'text-red-400' : 'text-white'}`}>
            {bollingerLabel[stock.bollingerPosition]}
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-2 text-center">
          <div className="text-gray-500">목표수익</div>
          <div className="text-orange-400 font-bold">+{upside}%</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>신호 강도</span>
          <span>{stock.strength}/5</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < stock.strength ? 'bg-yellow-400' : 'bg-gray-700'}`}
            />
          ))}
        </div>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{stock.reason}</p>

      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-700 text-xs">
        <div>
          <span className="text-gray-500">목표가 </span>
          <span className="text-red-400 font-medium">{stock.targetPrice.toLocaleString()}원</span>
        </div>
        <div>
          <span className="text-gray-500">손절가 </span>
          <span className="text-blue-400 font-medium">{stock.stopLoss.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );
}
