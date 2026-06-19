import { useState, useEffect } from 'react';
import { X, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StockChart } from './StockChart';
import { formatNumber } from './PriceTag';
import { fetchStockInfo, fetchHistory } from '../services/api';
import type { StockQuote, HistoryPoint } from '../services/api';

interface Props {
  symbol: string;
  name: string;
  onClose: () => void;
}

function calcRSI(history: HistoryPoint[]): number | null {
  if (history.length < 14) return null;
  const recent = history.slice(-15);
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].price - recent[i - 1].price;
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (gains + losses === 0) return 50;
  const rs = gains / (losses || 0.001);
  return Math.round(100 - 100 / (1 + rs));
}

function fiftyTwoWeekPos(price: number, high: number | null, low: number | null): number | null {
  if (!high || !low || high === low) return null;
  return Math.round(((price - low) / (high - low)) * 100);
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

  const rsi = calcRSI(history);
  const weekPos = quote ? fiftyTwoWeekPos(quote.regularMarketPrice, quote.fiftyTwoWeekHigh, quote.fiftyTwoWeekLow) : null;

  // Simple signal based on RSI + 52w position
  function getSignal(): { label: string; color: string; icon: typeof TrendingUp; desc: string } {
    if (rsi === null || weekPos === null) return { label: '분석중', color: 'text-gray-400', icon: Minus, desc: '데이터 부족' };
    if (rsi < 35 && weekPos < 30) return { label: '강력매수', color: 'text-red-400', icon: TrendingUp, desc: 'RSI 과매도 + 52주 저점 근처' };
    if (rsi < 45 && weekPos < 50) return { label: '매수', color: 'text-orange-400', icon: TrendingUp, desc: 'RSI 저점권, 반등 가능성' };
    if (rsi > 70 && weekPos > 80) return { label: '매도', color: 'text-blue-400', icon: TrendingDown, desc: 'RSI 과매수 + 52주 고점 근처' };
    if (rsi > 60 && weekPos > 70) return { label: '관망', color: 'text-yellow-400', icon: Minus, desc: '단기 조정 가능성' };
    return { label: '중립', color: 'text-gray-300', icon: Minus, desc: '추세 중립 구간' };
  }

  const signal = getSignal();
  const SignalIcon = signal.icon;

  // Price change over history period
  const priceChange1m = history.length >= 20
    ? ((history[history.length - 1].price - history[history.length - 20].price) / history[history.length - 20].price * 100)
    : null;
  const priceChange3m = history.length >= 60
    ? ((history[history.length - 1].price - history[history.length - 60].price) / history[history.length - 60].price * 100)
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl my-4">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 rounded-t-2xl border-b border-gray-700 p-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xl font-bold text-white">{name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{symbol} · {isKorean ? (symbol.endsWith('.KS') ? 'KOSPI' : 'KOSDAQ') : '해외'}</div>
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {quote.regularMarketPrice.toLocaleString()}{cur}
                  </div>
                  <div className={`text-base mt-1 ${up ? 'text-red-400' : 'text-blue-400'}`}>
                    {up ? '▲' : '▼'} {Math.abs(quote.regularMarketChange).toLocaleString()}{cur}
                    {' '}({Math.abs(quote.regularMarketChangePercent).toFixed(2)}%)
                  </div>
                </div>
                {/* Signal badge */}
                <div className={`flex flex-col items-center gap-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3`}>
                  <SignalIcon size={18} className={signal.color} />
                  <div className={`font-bold text-sm ${signal.color}`}>{signal.label}</div>
                  <div className="text-gray-500 text-xs text-center max-w-[80px]">{signal.desc}</div>
                </div>
              </div>

              {/* Chart */}
              {history.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="text-sm text-gray-300 mb-3">주가 차트 (6개월)</div>
                  <StockChart data={history} height={200} showAxis />
                </div>
              )}

              {/* Technical indicators */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                  <div className="text-gray-500 text-xs mb-1">RSI(14)</div>
                  <div className={`font-bold text-sm ${
                    rsi === null ? 'text-gray-500'
                    : rsi < 35 ? 'text-blue-400'
                    : rsi > 70 ? 'text-red-400'
                    : 'text-white'
                  }`}>
                    {rsi !== null ? rsi : '-'}
                  </div>
                  <div className="text-gray-600 text-xs mt-0.5">
                    {rsi === null ? '' : rsi < 35 ? '과매도' : rsi > 70 ? '과매수' : '중립'}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                  <div className="text-gray-500 text-xs mb-1">1개월 수익률</div>
                  <div className={`font-bold text-sm ${
                    priceChange1m === null ? 'text-gray-500'
                    : priceChange1m > 0 ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {priceChange1m !== null ? `${priceChange1m > 0 ? '+' : ''}${priceChange1m.toFixed(2)}%` : '-'}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                  <div className="text-gray-500 text-xs mb-1">3개월 수익률</div>
                  <div className={`font-bold text-sm ${
                    priceChange3m === null ? 'text-gray-500'
                    : priceChange3m > 0 ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {priceChange3m !== null ? `${priceChange3m > 0 ? '+' : ''}${priceChange3m.toFixed(2)}%` : '-'}
                  </div>
                </div>
              </div>

              {/* 52-week range bar */}
              {quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekLow && weekPos !== null && (
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="text-sm text-gray-300 mb-3">52주 가격 범위</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="shrink-0">{quote.fiftyTwoWeekLow.toLocaleString()}{cur}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 relative">
                      <div
                        className="absolute top-0 h-2 bg-yellow-500 rounded-full"
                        style={{ left: `${Math.max(0, weekPos - 2)}%`, width: '4px' }}
                      />
                      <div className="h-2 bg-gradient-to-r from-blue-500/40 to-red-500/40 rounded-full" />
                    </div>
                    <span className="shrink-0">{quote.fiftyTwoWeekHigh.toLocaleString()}{cur}</span>
                  </div>
                  <div className="text-center text-xs text-yellow-400 mt-1">현재 {weekPos}% 위치</div>
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
