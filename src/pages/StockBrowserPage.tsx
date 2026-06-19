import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { ALL_STOCKS, SECTORS } from '../data/allStocks';
import type { Sector } from '../data/allStocks';
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
  onStockClick: (symbol: string, name: string) => void;
}

export function StockBrowserPage({ onStockClick }: Props) {
  const [activeSector, setActiveSector] = useState<Sector>('반도체');
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'cap' | 'change' | 'name'>('cap');

  const sectorStocks = ALL_STOCKS.filter(s => s.sector === activeSector);

  const fetchSector = useCallback(async (sector: Sector) => {
    const stocks = ALL_STOCKS.filter(s => s.sector === sector);
    const symbols = stocks.map(s => `${s.code}.${s.market === 'KOSPI' ? 'KS' : 'KQ'}`).join(',');
    setLoading(true);
    try {
      const res = await fetch(`/api/batch?symbols=${encodeURIComponent(symbols)}`);
      const data = await res.json();
      const map: Record<string, LiveQuote> = {};
      for (const q of data.quotes ?? []) map[q.symbol] = q;
      setQuotes(prev => ({ ...prev, ...map }));
    } catch (_) {
      // silently ignore, show what we have
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSector(activeSector);
  }, [activeSector, fetchSector]);

  const sortedStocks = [...sectorStocks].sort((a, b) => {
    const qa = quotes[`${a.code}.${a.market === 'KOSPI' ? 'KS' : 'KQ'}`];
    const qb = quotes[`${b.code}.${b.market === 'KOSPI' ? 'KS' : 'KQ'}`];
    if (sortBy === 'cap') return (qb?.marketCap ?? 0) - (qa?.marketCap ?? 0);
    if (sortBy === 'change') return (qb?.regularMarketChangePercent ?? 0) - (qa?.regularMarketChangePercent ?? 0);
    return a.name.localeCompare(b.name, 'ko');
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">전체 종목</h1>
          <p className="text-gray-400 text-sm mt-1">섹터별 전 종목 실시간 시세</p>
        </div>
        <button
          onClick={() => fetchSector(activeSector)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-500 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* Sector tabs */}
      <div className="flex gap-2 flex-wrap">
        {SECTORS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSector(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeSector === s
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            {s}
            <span className="ml-1.5 text-xs opacity-70">
              {ALL_STOCKS.filter(st => st.sector === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>정렬:</span>
        {(['cap', 'change', 'name'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-2.5 py-1 rounded transition-colors ${
              sortBy === s ? 'bg-gray-700 text-white' : 'hover:text-gray-200'
            }`}
          >
            {s === 'cap' ? '시가총액' : s === 'change' ? '등락률' : '종목명'}
          </button>
        ))}
        <span className="ml-auto text-gray-500">{sectorStocks.length}개 종목</span>
      </div>

      {/* Stock grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedStocks.map(stock => {
          const symbol = `${stock.code}.${stock.market === 'KOSPI' ? 'KS' : 'KQ'}`;
          const q = quotes[symbol];
          const up = (q?.regularMarketChangePercent ?? 0) >= 0;

          return (
            <button
              key={stock.code}
              onClick={() => onStockClick(symbol, q?.shortName || stock.name)}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-left hover:border-yellow-500/40 hover:bg-gray-750 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-white font-medium text-sm group-hover:text-yellow-400 transition-colors">
                    {stock.name}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">{stock.code} · {stock.market}</div>
                </div>
                {q ? (
                  <div className={`text-right ${up ? 'text-red-400' : 'text-blue-400'}`}>
                    <div className="text-sm font-bold">{q.regularMarketPrice.toLocaleString()}원</div>
                    <div className="text-xs flex items-center gap-1 justify-end">
                      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {up ? '+' : ''}{q.regularMarketChangePercent.toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600 text-xs">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : '-'}
                  </div>
                )}
              </div>

              {q && (
                <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-700/50 pt-2 mt-2">
                  <span>시총 {formatNumber(q.marketCap)}원</span>
                  {q.trailingPE && <span>PER {q.trailingPE.toFixed(1)}</span>}
                  {q.priceToBook && <span>PBR {q.priceToBook.toFixed(2)}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!loading && sectorStocks.length > 0 && Object.keys(quotes).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          데이터를 불러오지 못했습니다.
        </div>
      )}
    </div>
  );
}
