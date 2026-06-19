import { ALL_STOCKS } from '../data/allStocks';

export interface KrStock {
  code: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ';
  sector: string;
}

// Module-level singleton — fetched once per page load
let _cache: KrStock[] | null = null;
let _promise: Promise<KrStock[]> | null = null;

export async function getFullStockList(): Promise<KrStock[]> {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = fetch('/api/stocklist')
    .then(r => r.json())
    .then(data => {
      const stocks: KrStock[] = Array.isArray(data.stocks) && data.stocks.length > 200
        ? data.stocks
        : ALL_STOCKS;
      _cache = stocks;
      return stocks;
    })
    .catch(() => {
      _cache = ALL_STOCKS as KrStock[];
      return _cache;
    });

  return _promise;
}

export function searchLocalStocks(query: string, stocks: KrStock[], limit = 30): KrStock[] {
  const q = query.trim();
  if (!q) return [];

  const isCode = /^\d+$/.test(q);

  if (isCode) {
    // Code match: exact first, then starts-with
    const exact = stocks.filter(s => s.code === q);
    const startsWith = stocks.filter(s => s.code.startsWith(q) && s.code !== q);
    return [...exact, ...startsWith].slice(0, limit);
  }

  // Name search (Korean)
  const lower = q.toLowerCase();
  const exact: KrStock[] = [];
  const starts: KrStock[] = [];
  const contains: KrStock[] = [];

  for (const s of stocks) {
    const n = s.name.toLowerCase();
    if (n === lower) exact.push(s);
    else if (n.startsWith(lower)) starts.push(s);
    else if (n.includes(lower)) contains.push(s);
  }

  return [...exact, ...starts, ...contains].slice(0, limit);
}
