import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Search, Star } from 'lucide-react';
import { formatNumber } from '../components/PriceTag';
import { ALL_STOCKS as STATIC_STOCKS } from '../data/allStocks';

interface StockEntry {
  code: string;
  name: string;
  sector: string;
  market: 'KOSPI' | 'KOSDAQ';
}

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
  isWatched?: (code: string) => boolean;
  onToggleWatch?: (code: string) => void;
}

const PAGE_SIZE = 50;

export function StockBrowserPage({ onStockClick, isWatched, onToggleWatch }: Props) {
  const [allStocks, setAllStocks] = useState<StockEntry[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [activeSector, setActiveSector] = useState<string>('');
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [loadingList, setLoadingList] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [sortBy, setSortBy] = useState<'cap' | 'change' | 'name'>('cap');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const fetchedSectors = useRef<Set<string>>(new Set());

  // Fetch complete stock list from KRX API
  useEffect(() => {
    async function loadStockList() {
      setLoadingList(true);
      try {
        const res = await fetch('/api/stocklist');
        const data = await res.json();
        const stocks: StockEntry[] = (data.stocks && data.stocks.length > 100)
          ? data.stocks
          : STATIC_STOCKS;
        setAllStocks(stocks);
        const sectorCount: Record<string, number> = {};
        for (const s of stocks) {
          sectorCount[s.sector] = (sectorCount[s.sector] ?? 0) + 1;
        }
        const sortedSectors = Object.entries(sectorCount)
          .sort((a, b) => b[1] - a[1])
          .map(([s]) => s);
        setSectors(sortedSectors);
        setActiveSector(sortedSectors[0] ?? '');
      } catch (_) {
        // use static fallback
        setAllStocks(STATIC_STOCKS);
        const sectorCount: Record<string, number> = {};
        for (const s of STATIC_STOCKS) {
          sectorCount[s.sector] = (sectorCount[s.sector] ?? 0) + 1;
        }
        const sortedSectors = Object.entries(sectorCount)
          .sort((a, b) => b[1] - a[1])
          .map(([s]) => s);
        setSectors(sortedSectors);
        setActiveSector(sortedSectors[0] ?? '');
      } finally {
        setLoadingList(false);
      }
    }
    loadStockList();
  }, []);

  const fetchSectorQuotes = useCallback(async (sector: string, stocks: StockEntry[]) => {
    if (fetchedSectors.current.has(sector)) return;
    const sectorStocks = stocks.filter(s => s.sector === sector);
    if (sectorStocks.length === 0) return;
    fetchedSectors.current.add(sector);
    setLoadingQuotes(true);
    // Batch in groups of 50 (API limit)
    const chunks: StockEntry[][] = [];
    for (let i = 0; i < sectorStocks.length; i += 50) {
      chunks.push(sectorStocks.slice(i, i + 50));
    }
    try {
      const results = await Promise.allSettled(
        chunks.map(chunk => {
          const symbols = chunk.map(s => `${s.code}.${s.market === 'KOSPI' ? 'KS' : 'KQ'}`).join(',');
          return fetch(`/api/batch?symbols=${encodeURIComponent(symbols)}`).then(r => r.json());
        })
      );
      const map: Record<string, LiveQuote> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const q of r.value.quotes ?? []) map[q.symbol] = q;
        }
      }
      setQuotes(prev => ({ ...prev, ...map }));
    } catch (_) {
      // silently ignore
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    if (activeSector && allStocks.length > 0) {
      setPage(1);
      fetchSectorQuotes(activeSector, allStocks);
    }
  }, [activeSector, allStocks, fetchSectorQuotes]);

  const sectorStocks = allStocks.filter(s => {
    if (searchQuery) {
      return s.name.includes(searchQuery) || s.code.includes(searchQuery);
    }
    return s.sector === activeSector;
  });

  const sortedStocks = [...sectorStocks].sort((a, b) => {
    const qa = quotes[`${a.code}.${a.market === 'KOSPI' ? 'KS' : 'KQ'}`];
    const qb = quotes[`${b.code}.${b.market === 'KOSPI' ? 'KS' : 'KQ'}`];
    if (sortBy === 'cap') return (qb?.marketCap ?? 0) - (qa?.marketCap ?? 0);
    if (sortBy === 'change') return (qb?.regularMarketChangePercent ?? 0) - (qa?.regularMarketChangePercent ?? 0);
    return a.name.localeCompare(b.name, 'ko');
  });

  const totalPages = Math.ceil(sortedStocks.length / PAGE_SIZE);
  const pagedStocks = sortedStocks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = () => {
    if (!activeSector) return;
    fetchedSectors.current.delete(activeSector);
    fetchSectorQuotes(activeSector, allStocks);
  };

  const sectorCount = (s: string) => allStocks.filter(st => st.sector === s).length;

  if (loadingList) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-3" />
          <div>한국 전체 종목 불러오는 중...</div>
          <div className="text-sm text-gray-500 mt-1">KOSPI + KOSDAQ 약 2,400개 종목</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">전체 종목</h1>
          <p className="text-gray-400 text-sm mt-1">
            KOSPI + KOSDAQ 전 종목 · 총 {allStocks.length.toLocaleString()}개
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loadingQuotes}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-500 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingQuotes ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="종목명 또는 코드로 검색..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
        />
      </div>

      {/* Sector tabs */}
      {!searchQuery && (
        <div className="flex gap-2 flex-wrap">
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => { setActiveSector(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeSector === s
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
              }`}
            >
              {s}
              <span className="ml-1.5 text-xs opacity-70">{sectorCount(s)}</span>
            </button>
          ))}
        </div>
      )}

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
        <span className="ml-auto text-gray-500">
          {sortedStocks.length.toLocaleString()}개 종목
          {totalPages > 1 && ` · ${page}/${totalPages} 페이지`}
        </span>
      </div>

      {/* Stock grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pagedStocks.map(stock => {
          const symbol = `${stock.code}.${stock.market === 'KOSPI' ? 'KS' : 'KQ'}`;
          const q = quotes[symbol];
          const up = (q?.regularMarketChangePercent ?? 0) >= 0;
          const watched = isWatched?.(stock.code);

          return (
            <div
              key={stock.code}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-yellow-500/40 transition-all group relative"
            >
              <button
                className="absolute inset-0 w-full h-full"
                onClick={() => {
                  localStorage.setItem('jj_market_' + stock.code, stock.market);
                  onStockClick(symbol, q?.shortName || stock.name);
                }}
              />
              <div className="relative flex items-start justify-between mb-2">
                <div>
                  <div className="text-white font-medium text-sm group-hover:text-yellow-400 transition-colors">
                    {stock.name}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">{stock.code} · {stock.market}</div>
                </div>
                <div className="flex items-start gap-2">
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
                      {loadingQuotes ? <RefreshCw size={12} className="animate-spin" /> : '-'}
                    </div>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      localStorage.setItem('jj_market_' + stock.code, stock.market);
                      onToggleWatch?.(stock.code);
                    }}
                    className={`transition-colors mt-0.5 z-10 relative ${watched ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                  >
                    <Star size={14} fill={watched ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {q && (
                <div className="relative flex gap-3 text-xs text-gray-500 border-t border-gray-700/50 pt-2 mt-2">
                  <span>시총 {formatNumber(q.marketCap)}원</span>
                  {q.trailingPE && <span>PER {q.trailingPE.toFixed(1)}</span>}
                  {q.priceToBook && <span>PBR {q.priceToBook.toFixed(2)}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-500 disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-gray-400">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-500 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {!loadingList && !loadingQuotes && sectorStocks.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {searchQuery ? '검색 결과가 없습니다.' : '데이터를 불러오지 못했습니다.'}
        </div>
      )}
    </div>
  );
}
