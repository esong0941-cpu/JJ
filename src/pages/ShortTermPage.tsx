import { useState } from 'react';
import type { ShortTermStock } from '../types/stock';
import { ShortTermCard } from '../components/ShortTermCard';
import { Filter } from 'lucide-react';

interface Props {
  stocks: ShortTermStock[];
  onStockClick: (code: string) => void;
}

type SignalFilter = 'ALL' | 'STRONG_BUY' | 'BUY' | 'WATCH';
type SortOption = 'strength' | 'upside' | 'changeRate' | 'volume';

export function ShortTermPage({ stocks, onStockClick }: Props) {
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('ALL');
  const [sort, setSort] = useState<SortOption>('strength');

  const filtered = stocks
    .filter(s => signalFilter === 'ALL' || s.signal === signalFilter)
    .sort((a, b) => {
      if (sort === 'strength') return b.strength - a.strength;
      if (sort === 'upside') return ((b.targetPrice - b.price) / b.price) - ((a.targetPrice - a.price) / a.price);
      if (sort === 'changeRate') return b.changeRate - a.changeRate;
      if (sort === 'volume') return b.volume - a.volume;
      return 0;
    });

  const signalButtons: { key: SignalFilter; label: string; color: string }[] = [
    { key: 'ALL', label: '전체', color: 'bg-gray-700 text-white' },
    { key: 'STRONG_BUY', label: '강력매수', color: 'bg-red-500 text-white' },
    { key: 'BUY', label: '매수', color: 'bg-orange-500 text-white' },
    { key: 'WATCH', label: '관망', color: 'bg-yellow-500 text-black' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">단타 추천 종목</h1>
        <p className="text-gray-400 text-sm mt-1">기술적 분석 기반 단기 트레이딩 추천 종목 (당일~5일 이내)</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <span className="text-gray-400 text-sm">신호</span>
            <div className="flex gap-2">
              {signalButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setSignalFilter(btn.key)}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${
                    signalFilter === btn.key ? btn.color : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-400 text-sm">정렬</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1 border border-gray-600"
            >
              <option value="strength">신호강도</option>
              <option value="upside">목표수익</option>
              <option value="changeRate">등락률</option>
              <option value="volume">거래량</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-3 text-xs text-amber-300">
        ⚠️ 단타 투자는 높은 리스크를 수반합니다. 손절가를 반드시 설정하고 자금의 일부만 투자하세요. 본 분석은 참고용이며 투자 결정의 최종 책임은 투자자에게 있습니다.
      </div>

      <div className="text-gray-400 text-sm">총 {filtered.length}개 종목</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(s => (
          <ShortTermCard key={s.code} stock={s} onClick={() => onStockClick(s.code)} />
        ))}
      </div>
    </div>
  );
}
