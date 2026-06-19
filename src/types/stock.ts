export interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: number;
  marketCap: number;
  sector: string;
  market: 'KOSPI' | 'KOSDAQ';
}

export interface ShortTermStock extends Stock {
  signal: 'BUY' | 'STRONG_BUY' | 'SELL' | 'WATCH';
  rsi: number;
  macd: number;
  bollingerPosition: 'UPPER' | 'MIDDLE' | 'LOWER';
  momentum: number;
  targetPrice: number;
  stopLoss: number;
  reason: string;
  strength: number; // 1-5
}

export interface LongTermStock extends Stock {
  per: number;
  pbr: number;
  roe: number;
  debtRatio: number;
  dividendYield: number;
  revenueGrowth: number;
  operatingMargin: number;
  targetPrice: number;
  analystConsensus: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL';
  upside: number;
  reason: string;
  rating: number; // 1-5
}

export interface CompanyInfo extends Stock {
  ceo: string;
  founded: string;
  employees: number;
  description: string;
  per: number;
  pbr: number;
  roe: number;
  debtRatio: number;
  dividendYield: number;
  revenueGrowth: number;
  operatingMargin: number;
  revenue: number;
  operatingProfit: number;
  netProfit: number;
  financialHistory: FinancialYear[];
  priceHistory: PricePoint[];
  analystRatings: AnalystRating;
}

export interface FinancialYear {
  year: string;
  revenue: number;
  operatingProfit: number;
  netProfit: number;
  eps: number;
}

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

export interface AnalystRating {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  targetPrice: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

export interface MarketSummary {
  indices: MarketIndex[];
  advancingStocks: number;
  decliningStocks: number;
  unchangedStocks: number;
  tradingValue: number;
  foreignNetBuy: number;
  institutionNetBuy: number;
}
