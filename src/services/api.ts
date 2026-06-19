export interface QuoteData {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  trailingPE?: number;
  priceToBook?: number;
  trailingAnnualDividendYield?: number;
  marketState?: string;
}

export interface QuoteResponse {
  stocks: QuoteData[];
  indices: QuoteData[];
  timestamp: number;
}

export interface HistoryPoint {
  date: string;
  price: number;
  volume: number;
}

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchQuotes(): Promise<QuoteResponse> {
  const res = await fetch(`${BASE}/api/quote`);
  if (!res.ok) throw new Error(`Quote API ${res.status}`);
  return res.json();
}

export async function fetchHistory(symbol: string, range = '6mo'): Promise<HistoryPoint[]> {
  const res = await fetch(`${BASE}/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
  if (!res.ok) throw new Error(`History API ${res.status}`);
  const data = await res.json();
  return data.history ?? [];
}

export interface SearchResult {
  symbol: string;
  shortname: string;
  exchDisp: string;
  sector: string;
  isKorean: boolean;
}

export async function searchStocks(q: string): Promise<SearchResult[]> {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  trailingPE: number | null;
  priceToBook: number | null;
  trailingAnnualDividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  currency: string;
  exchangeName: string;
}

export async function fetchStockInfo(symbol: string): Promise<StockQuote> {
  const res = await fetch(`${BASE}/api/stock?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Stock API ${res.status}`);
  return res.json();
}
