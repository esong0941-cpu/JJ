import { useState, useEffect, useCallback } from 'react';
import { marketSummary as initialMarket, shortTermStocks as initialShort, tickerStocks as initialTicker } from '../data/mockData';
import type { MarketSummary, ShortTermStock } from '../types/stock';

function fluctuate(value: number, maxPct: number = 0.003): number {
  return value * (1 + (Math.random() - 0.5) * 2 * maxPct);
}

export function useRealTimeData() {
  const [market, setMarket] = useState<MarketSummary>(initialMarket);
  const [shorts, setShorts] = useState<ShortTermStock[]>(initialShort);
  const [ticker, setTicker] = useState(initialTicker);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const update = useCallback(() => {
    setMarket(prev => ({
      ...prev,
      indices: prev.indices.map(idx => {
        const newValue = fluctuate(idx.value, 0.002);
        const totalChange = idx.change + (newValue - idx.value);
        return {
          ...idx,
          value: Math.round(newValue * 100) / 100,
          change: Math.round(totalChange * 100) / 100,
          changeRate: Math.round((totalChange / (idx.value - idx.change)) * 10000) / 100,
        };
      }),
      advancingStocks: Math.floor(Math.random() * 50 + 520),
      decliningStocks: Math.floor(Math.random() * 40 + 300),
      foreignNetBuy: initialMarket.foreignNetBuy + (Math.random() - 0.5) * 10_000_000_000,
    }));

    setShorts(prev => prev.map(s => {
      const newPrice = Math.round(fluctuate(s.price, 0.004));
      const basePrice = s.price - s.change;
      const newChange = newPrice - basePrice;
      return {
        ...s,
        price: newPrice,
        change: newChange,
        changeRate: Math.round((newChange / basePrice) * 10000) / 100,
        rsi: Math.min(80, Math.max(20, fluctuate(s.rsi, 0.01))),
        volume: s.volume + Math.floor(Math.random() * 100000),
      };
    }));

    setTicker(prev => prev.map(t => {
      const newPrice = Math.round(fluctuate(t.price, 0.003));
      return { ...t, price: newPrice };
    }));

    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [update]);

  return { market, shorts, ticker, lastUpdate };
}
