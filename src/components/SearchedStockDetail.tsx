import { useState, useEffect } from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';
import { StockChart } from './StockChart';
import { formatNumber } from './PriceTag';
import { fetchStockInfo, fetchHistory } from '../services/api';
import type { StockQuote, HistoryPoint } from '../services/api';

interface Props {
  symbol: string;
  name: string;
  onClose: () => void;
}

export function SearchedStockDetail({ symbol, name, onClose }: Props) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchStockInfo(symbol), fetchHistory(symbol)])
      .then(([q, h]) => { setQuote(q); setHistory(h); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  const isKorean = symbol.endsWith('.KS') || symbol.endsWith('.KQ');
  const cur = isKorean ? '원' : (quote?.currency ? ' ' + quote.currency : '');
  const up = quote && quote.regularMarketChange >= 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl my-4">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 rounded-t-2xl border-b border-gray-700 p-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xl font-bold text-white">{name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{symbol}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> 데이터 로딩 중...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-400 gap-2">
              <AlertTriangle size={24} />
              <div className="text-sm">{error}</div>
            </div>
          ) : quote ? (
            <>
              {/* Price block */}
              <div className="text-center py-2">
                <div className="text-3xl font-bold text-white">
                  {quote.regularMarketPrice.toLocaleString()}{cur}
                </div>
                <div className={`text-lg mt-1 ${up ? 'text-red-400' : 'text-blue-400'}`}>
                  {up ? '▲' : '▼'} {Math.abs(quote.regularMarketChange).toLocaleString()}{cur}
                  {' '}({Math.abs(quote.regularMarketChangePercent).toFixed(2)}%)
                </div>
              </div>

              {/* Chart */}
              {history.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="text-sm text-gray-300 mb-3">주가 차트 (6개월)</div>
                  <StockChart data={history} height={200} showAxis />
                </div>
              )}

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '시가총액', value: quote.marketCap ? formatNumber(quote.marketCap) + cur : 'N/A' },
                  { label: '거래량', value: quote.regularMarketVolume ? formatNumber(quote.regularMarketVolume) : 'N/A' },
                  { label: 'PER', value: quote.trailingPE ? quote.trailingPE.toFixed(1) + '배' : 'N/A' },
                  { label: 'PBR', value: quote.priceToBook ? quote.priceToBook.toFixed(2) + '배' : 'N/A' },
                  { label: '배당수익률', value: quote.trailingAnnualDividendYield ? (quote.trailingAnnualDividendYield * 100).toFixed(2) + '%' : 'N/A' },
                  { label: '거래소', value: quote.exchangeName || '-' },
                  { label: '52주 최고', value: quote.fiftyTwoWeekHigh ? quote.fiftyTwoWeekHigh.toLocaleString() + cur : 'N/A' },
                  { label: '52주 최저', value: quote.fiftyTwoWeekLow ? quote.fiftyTwoWeekLow.toLocaleString() + cur : 'N/A' },
                ].map(m => (
                  <div key={m.label} className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                    <div className="text-gray-500 text-xs mb-1">{m.label}</div>
                    <div className="text-white font-bold text-sm">{m.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
