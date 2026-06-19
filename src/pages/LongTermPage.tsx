import { useState } from 'react';
import type { LongTermStock } from '../types/stock';
import { LongTermCard } from '../components/LongTermCard';

interface Props {
  stocks: LongTermStock[];
  onStockClick: (code: string) => void;
}

type SortOption = 'rating' | 'upside' | 'dividendYield' | 'roe';

export function LongTermPage({ stocks, onStockClick }: Props) {
  const [sort, setSort] = useState<SortOption>('rating');
  const [sector, setSector] = useState('전체');

  const sectors = ['전체', ...Array.from(new Set(stocks.map(s => s.sector)))];

  const filtered = stocks
    .filter(s => sector === '전체' || s.sector === sector)
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'upside') return b.upside - a.upside;
      if (sort === 'dividendYield') return b.dividendYield - a.dividendYield;
      if (sort === 'roe') return b.roe - a.roe;
      return 0;
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">장타 추천 종목</h1>
        <p className="text-gray-400 text-sm mt-1">펀더멘털 분석 기반 중장기 투자 추천 종목 (3개월~1년 이상)</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">섹터</span>
          <div className="flex flex-wrap gap-2">
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`text-xs px-3 py-1 rounded-full transition-all ${
                  sector === s ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {s}
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
            <option value="rating">투자매력도</option>
            <option value="upside">상승여력</option>
            <option value="dividendYield">배당수익률</option>
            <option value="roe">ROE</option>
          </select>
        </div>
      </div>

      <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-3 text-xs text-green-300">
        💡 장기투자는 기업의 펀더멘털을 중심으로 판단하며, 시장 변동성에 흔들리지 않는 것이 중요합니다. 분산투자와 정기 리밸런싱을 권장합니다.
      </div>

      <div className="text-gray-400 text-sm">총 {filtered.length}개 종목</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(s => (
          <LongTermCard key={s.code} stock={s} onClick={() => onStockClick(s.code)} />
        ))}
      </div>
    </div>
  );
}
