import { MarketOverview } from '../components/MarketOverview';
import type { MarketSummary, ShortTermStock, LongTermStock, CompanyInfo } from '../types/stock';
import { ShortTermCard } from '../components/ShortTermCard';
import { TrendingUp, BarChart2, Activity } from 'lucide-react';

interface Props {
  market: MarketSummary;
  lastUpdate: Date;
  topShorts: ShortTermStock[];
  longTerms: LongTermStock[];
  companies: CompanyInfo[];
  onStockClick: (code: string) => void;
  onNavigate: (tab: string) => void;
}

export function Dashboard({ market, lastUpdate, topShorts, longTerms, companies, onStockClick, onNavigate }: Props) {
  return (
    <div className="space-y-6">
      <MarketOverview market={market} lastUpdate={lastUpdate} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Activity, label: '단타 추천 종목', count: topShorts.length, tab: 'short', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/50' },
          { icon: TrendingUp, label: '장타 추천 종목', count: longTerms.length, tab: 'long', color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/50' },
          { icon: BarChart2, label: '기업분석 대상', count: companies.length, tab: 'analysis', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/50' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => onNavigate(item.tab)}
            className={`${item.bg} border rounded-xl p-4 text-left cursor-pointer card-hover flex items-center gap-4`}
          >
            <item.icon size={28} className={item.color} />
            <div>
              <div className="text-white font-bold text-lg">{item.count}개</div>
              <div className="text-gray-400 text-sm">{item.label}</div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">오늘의 단타 추천 TOP 4</h2>
          <button
            onClick={() => onNavigate('short')}
            className="text-yellow-400 text-sm hover:text-yellow-300"
          >
            전체보기 →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topShorts.slice(0, 4).map(s => (
            <ShortTermCard
              key={s.code}
              stock={s}
              onClick={() => onStockClick(s.code)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
