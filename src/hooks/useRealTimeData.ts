import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuotes, type QuoteData } from '../services/api';
import { STOCK_LIST, INDEX_LIST, SHORT_SIGNALS, LONG_RATINGS, COMPANY_META } from '../data/staticData';
import type { ShortTermStock, LongTermStock, MarketSummary, CompanyInfo } from '../types/stock';

function codeFromSymbol(sym: string) {
  return sym.replace('.KS', '').replace('.KQ', '');
}

function rsiFromChangeRate(rate: number): number {
  return Math.min(80, Math.max(20, 50 + rate * 3));
}

function bollingerPos(rate: number): 'UPPER' | 'MIDDLE' | 'LOWER' {
  if (rate > 2) return 'UPPER';
  if (rate < -1) return 'LOWER';
  return 'MIDDLE';
}

function autoShortSignal(q: QuoteData): { signal: 'STRONG_BUY' | 'BUY' | 'WATCH'; strength: number } {
  const rate = q.regularMarketChangePercent ?? 0;
  if (rate > 3) return { signal: 'STRONG_BUY', strength: 5 };
  if (rate > 1.5) return { signal: 'BUY', strength: 4 };
  if (rate > 0) return { signal: 'BUY', strength: 3 };
  return { signal: 'WATCH', strength: 2 };
}

function autoLongRating(q: QuoteData): { consensus: 'STRONG_BUY' | 'BUY' | 'HOLD'; rating: number } {
  const per = q.trailingPE ?? 0;
  const pbr = q.priceToBook ?? 0;
  const hasValue = per > 0 || pbr > 0;
  if (!hasValue) return { consensus: 'BUY', rating: 3 };
  if ((per > 0 && per < 12) || (pbr > 0 && pbr < 0.8)) return { consensus: 'STRONG_BUY', rating: 5 };
  if ((per > 0 && per < 20) || (pbr > 0 && pbr < 1.5)) return { consensus: 'BUY', rating: 4 };
  if (per > 0 && per < 35) return { consensus: 'BUY', rating: 3 };
  return { consensus: 'HOLD', rating: 3 };
}

function mapToShortTerm(q: QuoteData): ShortTermStock | null {
  const code = codeFromSymbol(q.symbol);
  const staticInfo = STOCK_LIST.find((s) => s.code === code);
  if (!staticInfo) return null;
  const signal = SHORT_SIGNALS[code] ?? autoShortSignal(q);
  const meta = COMPANY_META[code];
  const price = q.regularMarketPrice ?? 0;
  if (price === 0) return null;
  const changeRate = q.regularMarketChangePercent ?? 0;
  return {
    code,
    name: meta?.name ?? staticInfo.name,
    price: Math.round(price),
    change: Math.round(q.regularMarketChange ?? 0),
    changeRate: Math.round(changeRate * 100) / 100,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    sector: staticInfo.sector,
    market: staticInfo.market,
    signal: signal.signal,
    rsi: rsiFromChangeRate(changeRate),
    macd: (q.regularMarketChange ?? 0) * 10,
    bollingerPosition: bollingerPos(changeRate),
    momentum: Math.min(100, Math.max(0, 50 + changeRate * 5)),
    targetPrice: Math.round(price * (meta?.targetMultiplier ?? 1.10)),
    stopLoss: Math.round(price * (meta?.stopLossMultiplier ?? 0.96)),
    reason: meta?.shortReason ?? '기술적 분석 기반 단기 추천 종목',
    strength: signal.strength,
  };
}

function mapToLongTerm(q: QuoteData): LongTermStock | null {
  const code = codeFromSymbol(q.symbol);
  const staticInfo = STOCK_LIST.find((s) => s.code === code);
  if (!staticInfo) return null;
  const rating = LONG_RATINGS[code] ?? autoLongRating(q);
  const meta = COMPANY_META[code];
  const price = q.regularMarketPrice ?? 0;
  if (price === 0) return null;
  const targetPrice = Math.round(price * (meta?.analystRatings.upsideTarget ?? 1.15));
  return {
    code,
    name: meta?.name ?? staticInfo.name,
    price: Math.round(price),
    change: Math.round(q.regularMarketChange ?? 0),
    changeRate: Math.round((q.regularMarketChangePercent ?? 0) * 100) / 100,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    sector: staticInfo.sector,
    market: staticInfo.market,
    per: q.trailingPE ?? 0,
    pbr: q.priceToBook ?? 0,
    roe: meta?.roe ?? 0,
    debtRatio: meta?.debtRatio ?? 0,
    dividendYield: (q.trailingAnnualDividendYield ?? (meta?.dividendYield ?? 0) / 100) * 100,
    revenueGrowth: meta?.revenueGrowth ?? 0,
    operatingMargin: meta?.operatingMargin ?? 0,
    targetPrice,
    analystConsensus: rating.consensus,
    upside: Math.round(((targetPrice - price) / price) * 100 * 10) / 10,
    reason: meta?.longReason ?? '펀더멘털 기반 중장기 투자 추천 종목',
    rating: rating.rating,
  };
}

function mapToCompany(q: QuoteData): CompanyInfo | null {
  const code = codeFromSymbol(q.symbol);
  const meta = COMPANY_META[code];
  if (!meta) return null;
  const price = q.regularMarketPrice ?? 0;
  const targetPrice = Math.round(price * meta.analystRatings.upsideTarget);
  return {
    code,
    name: meta.name,
    price: Math.round(price),
    change: Math.round(q.regularMarketChange ?? 0),
    changeRate: Math.round((q.regularMarketChangePercent ?? 0) * 100) / 100,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    sector: meta.sector,
    market: meta.market,
    ceo: meta.ceo,
    founded: meta.founded,
    employees: meta.employees,
    description: meta.description,
    per: q.trailingPE ?? 0,
    pbr: q.priceToBook ?? 0,
    roe: meta.roe,
    debtRatio: meta.debtRatio,
    dividendYield: (q.trailingAnnualDividendYield ?? meta.dividendYield / 100) * 100,
    revenueGrowth: meta.revenueGrowth,
    operatingMargin: meta.operatingMargin,
    revenue: meta.revenue,
    operatingProfit: meta.operatingProfit,
    netProfit: meta.netProfit,
    financialHistory: meta.financialHistory,
    priceHistory: [],
    analystRatings: {
      strongBuy: meta.analystRatings.strongBuy,
      buy: meta.analystRatings.buy,
      hold: meta.analystRatings.hold,
      sell: meta.analystRatings.sell,
      targetPrice,
    },
  };
}

export function useRealTimeData() {
  const [market, setMarket] = useState<MarketSummary | null>(null);
  const [shorts, setShorts] = useState<ShortTermStock[]>([]);
  const [longTerms, setLongTerms] = useState<LongTermStock[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [ticker, setTicker] = useState<{ code: string; name: string; price: number; changeRate: number }[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { stocks, indices } = await fetchQuotes();

      // Market indices
      const idxMap = Object.fromEntries(indices.map((q) => [q.symbol, q]));
      const indexData = INDEX_LIST.map((idx) => {
        const q = idxMap[idx.symbol];
        const value = q?.regularMarketPrice ?? 0;
        const change = q?.regularMarketChange ?? 0;
        const baseValue = value - change;
        return {
          name: idx.name,
          value: Math.round(value * 100) / 100,
          change: Math.round(change * 100) / 100,
          changeRate: baseValue ? Math.round((change / baseValue) * 10000) / 100 : 0,
        };
      });
      setMarket({
        indices: indexData,
        advancingStocks: stocks.filter((s) => (s.regularMarketChange ?? 0) > 0).length,
        decliningStocks: stocks.filter((s) => (s.regularMarketChange ?? 0) < 0).length,
        unchangedStocks: stocks.filter((s) => (s.regularMarketChange ?? 0) === 0).length,
        tradingValue: stocks.reduce((a, s) => a + (s.regularMarketVolume ?? 0) * (s.regularMarketPrice ?? 0), 0),
        foreignNetBuy: 0,
        institutionNetBuy: 0,
      });

      // Stocks
      const shortList = stocks.map(mapToShortTerm).filter(Boolean) as ShortTermStock[];
      const longList = stocks.map(mapToLongTerm).filter(Boolean) as LongTermStock[];
      const companyList = stocks.map(mapToCompany).filter(Boolean) as CompanyInfo[];

      setShorts(shortList);
      setLongTerms(longList);
      setCompanies(companyList);

      // Ticker
      const tickerData = STOCK_LIST.map((item) => {
        const q = stocks.find((s) => s.symbol === item.yahooSymbol);
        return {
          code: item.code,
          name: item.name,
          price: Math.round(q?.regularMarketPrice ?? 0),
          changeRate: Math.round((q?.regularMarketChangePercent ?? 0) * 100) / 100,
        };
      });
      setTicker(tickerData);
      setLastUpdate(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'API 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, 15_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refresh]);

  return { market, shorts, longTerms, companies, ticker, lastUpdate, loading, error };
}
