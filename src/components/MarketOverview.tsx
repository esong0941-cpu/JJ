import type { MarketSummary } from '../types/stock';
import { formatNumber } from './PriceTag';

interface Props {
  market: MarketSummary;
  lastUpdate: Date;
}

export function MarketOverview({ market, lastUpdate }: Props) {
  const timeStr = lastUpdate.toLocaleTimeString('ko-KR');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">시장 현황</h2>
        <span className="text-xs text-gray-500">업데이트: {timeStr}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {market.indices.map(idx => (
          <div key={idx.name} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">{idx.name}</div>
            <div className="text-white text-xl font-bold">{idx.value.toLocaleString()}</div>
            <div className={`text-sm mt-1 ${idx.changeRate > 0 ? 'text-red-400' : idx.changeRate < 0 ? 'text-blue-400' : 'text-gray-400'}`}>
              {idx.changeRate > 0 ? '▲' : idx.changeRate < 0 ? '▼' : ''}
              {' '}{Math.abs(idx.change).toLocaleString()} ({Math.abs(idx.changeRate).toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="text-gray-400 text-sm mb-3 font-medium">수급 현황</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs">상승종목</div>
            <div className="text-red-400 font-bold">{market.advancingStocks}개</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">하락종목</div>
            <div className="text-blue-400 font-bold">{market.decliningStocks}개</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">외국인 순매수</div>
            <div className={`font-bold ${market.foreignNetBuy > 0 ? 'text-red-400' : 'text-blue-400'}`}>
              {market.foreignNetBuy > 0 ? '+' : ''}{formatNumber(Math.round(market.foreignNetBuy))}원
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">거래대금</div>
            <div className="text-white font-bold">{formatNumber(market.tradingValue)}원</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            <div
              className="bg-red-500 rounded-l-full"
              style={{ width: `${(market.advancingStocks / (market.advancingStocks + market.decliningStocks + market.unchangedStocks)) * 100}%` }}
            />
            <div
              className="bg-gray-600"
              style={{ width: `${(market.unchangedStocks / (market.advancingStocks + market.decliningStocks + market.unchangedStocks)) * 100}%` }}
            />
            <div
              className="bg-blue-500 rounded-r-full flex-1"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>상승 {market.advancingStocks}</span>
            <span>하락 {market.decliningStocks}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
