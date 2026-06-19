import { useState, useEffect, useCallback } from 'react';
import { Star, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '../components/PriceTag';

interface LiveQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  trailingPE: number | null;
  priceToBook: number | null;
}

interface Props {
  watchlist: Set<string>;
  onStockClick: (symbol: string, name: string) => void;
  onToggleWatch: (code: string) => void;
}

export function WatchlistPage({ watchlist, onStockClick, onToggleWatch }: Props) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [loading, setLoading] = useState(false);

  const codes = [...watchlist];

  const fetchQuotes = useCallback(async (codelist: string[]) => {
    if (codelist.length === 0) return;
    setLoading(true);
    try {
      // We don't know the market suffix per code; try both — resolved via allStocks or just attempt .KS first
      // Store code→market mapping in localStorage alongside watchlist
      const symbols = codelist.map(code => {
        const raw = localStorage.getItem('jj_market_' + code);
        const mkt = raw === 'KOSDAQ' ? 'KQ' : 'KS';
        return `${code}.${mkt}`;
      }).join(',');
      const res = await fetch(`/api/batch?symbols=${encodeURIComponent(symbols)}`);
      const data = await res.json();
      const map: Record<string, LiveQuote> = {};
      for (const q of data.quotes ?? []) {
        const code = q.symbol.replace(/\.(KS|KQ)$/i, '');
        map[code] = q;
      }
      setQuotes(map);
    } catch (_) {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes(codes);
  }, [watchlist.size]); // re-fetch when watchlist changes

  if (codes.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">관심 종목</h1>
          <p className="text-gray-400 text-sm mt-1">즐겨찾기한 종목을 모아봅니다</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Star size={48} className="opacity-30" />
          <div className="text-lg">관심 종목이 없습니다</div>
          <div className="text-sm text-gray-600">종목 카드의 ★ 버튼을 눌러 추가하세요</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">관심 종목</h1>
          <p className="text-gray-400 text-sm mt-1">총 {codes.length}개 종목</p>
        </div>
        <button
          onClick={() => fetchQuotes(codes)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-500 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {codes.map(code => {
          const q = quotes[code];
          const up = (q?.regularMarketChangePercent ?? 0) >= 0;
          const sym = q?.symbol ?? `${code}.KS`;

          return (
            <div
              key={code}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-yellow-500/40 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <button
                  className="text-left flex-1"
                  onClick={() => onStockClick(sym, q?.shortName ?? code)}
                >
                  <div className="text-white font-medium text-sm hover:text-yellow-400 transition-colors">
                    {q?.shortName ?? code}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">{code}</div>
                </button>
                <div className="flex items-start gap-2">
                  {q ? (
                    <div className={`text-right ${up ? 'text-red-400' : 'text-blue-400'}`}>
                      <div className="text-sm font-bold">{q.regularMarketPrice.toLocaleString()}원</div>
                      <div className="text-xs flex items-center gap-0.5 justify-end">
                        {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {up ? '+' : ''}{q.regularMarketChangePercent.toFixed(2)}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600 text-xs w-16 text-right">
                      {loading ? <RefreshCw size={12} className="animate-spin ml-auto" /> : '-'}
                    </div>
                  )}
                  <button
                    onClick={() => onToggleWatch(code)}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors ml-1 mt-0.5"
                    title="관심종목 해제"
                  >
                    <Star size={16} fill="currentColor" />
                  </button>
                </div>
              </div>

              {q && (
                <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-700/50 pt-2 mt-1">
                  <span>시총 {formatNumber(q.marketCap)}원</span>
                  {q.trailingPE && <span>PER {q.trailingPE.toFixed(1)}</span>}
                  {q.priceToBook && <span>PBR {q.priceToBook.toFixed(2)}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
