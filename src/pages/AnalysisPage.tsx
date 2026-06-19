import { useState, useEffect } from 'react';
import type { CompanyInfo } from '../types/stock';
import type { HistoryPoint } from '../services/api';
import { fetchHistory } from '../services/api';
import { StockChart } from '../components/StockChart';
import { BarChart2, TrendingUp, DollarSign, Percent, Users, RefreshCw } from 'lucide-react';
import { formatNumber } from '../components/PriceTag';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  companies: CompanyInfo[];
  onCompanyClick: (code: string) => void;
}

function ScoreRadar({ company }: { company: CompanyInfo }) {
  const data = [
    { subject: '성장성', value: Math.min(100, company.revenueGrowth * 2.5) },
    { subject: '수익성', value: Math.min(100, company.operatingMargin * 3) },
    { subject: '안정성', value: Math.max(0, 100 - company.debtRatio) },
    { subject: '배당', value: Math.min(100, company.dividendYield * 15) },
    { subject: 'ROE', value: Math.min(100, company.roe * 4) },
    { subject: '밸류', value: Math.max(0, 100 - company.per * 2) },
  ];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} dot={{ fill: '#f59e0b', r: 3 }} />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          formatter={(v) => [Number(v).toFixed(0) + '점']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function AnalysisPage({ companies, onCompanyClick }: Props) {
  const [selected, setSelected] = useState<string>(companies[0]?.code || '');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const company = companies.find(c => c.code === selected) || companies[0];

  useEffect(() => {
    if (!company) return;
    setHistLoading(true);
    const suffix = company.market === 'KOSDAQ' ? '.KQ' : '.KS';
    fetchHistory(`${company.code}${suffix}`)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [company?.code, company?.market]);

  if (!company) return null;

  const totalAnalysts = company.analystRatings.strongBuy + company.analystRatings.buy + company.analystRatings.hold + company.analystRatings.sell;
  const bullish = ((company.analystRatings.strongBuy + company.analystRatings.buy) / totalAnalysts * 100).toFixed(0);
  const upside = ((company.analystRatings.targetPrice - company.price) / company.price * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">기업 분석</h1>
        <p className="text-gray-400 text-sm mt-1">주요 종목 심층 기업 분석</p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {companies.map(c => (
          <button
            key={c.code}
            onClick={() => setSelected(c.code)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selected === c.code
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: company info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{company.market} · {company.sector}</span>
                </div>
                <div className="text-2xl font-bold text-white">{company.name}</div>
                <div className="text-gray-400 text-sm">{company.code} · CEO: {company.ceo} · {company.founded} 설립</div>
              </div>
              <button
                onClick={() => onCompanyClick(company.code)}
                className="text-yellow-400 text-sm border border-yellow-400/50 px-3 py-1 rounded-lg hover:bg-yellow-400/10"
              >
                상세보기
              </button>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{company.description}</p>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-300 mb-3">주가 차트 (6개월)</div>
            {histLoading ? (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                <RefreshCw size={18} className="animate-spin mr-2" /> 불러오는 중...
              </div>
            ) : (
              <StockChart data={history} height={200} showAxis />
            )}
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <BarChart2 size={14} /> 연간 실적
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="py-2 text-left">구분</th>
                    {company.financialHistory.map(y => <th key={y.year}>{y.year}년</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {[
                    { label: '매출액', key: 'revenue' as const, color: 'text-white' },
                    { label: '영업이익', key: 'operatingProfit' as const, color: 'text-yellow-400' },
                    { label: '순이익', key: 'netProfit' as const, color: 'text-green-400' },
                    { label: 'EPS', key: 'eps' as const, color: 'text-blue-400' },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="py-2.5 text-left text-gray-400">{row.label}</td>
                      {company.financialHistory.map(y => (
                        <td key={y.year} className={`py-2.5 ${row.color} ${y[row.key] < 0 ? 'text-blue-400' : ''}`}>
                          {row.key === 'eps'
                            ? (y[row.key] as number).toLocaleString() + '원'
                            : (y[row.key] < 0 ? '-' : '') + formatNumber(Math.abs(y[row.key] as number))
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: metrics */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-center mb-2">
              <div className="text-3xl font-bold text-white">{company.price.toLocaleString()}원</div>
              <div className={`text-lg ${company.changeRate > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {company.changeRate > 0 ? '▲' : '▼'} {Math.abs(company.changeRate).toFixed(2)}%
              </div>
            </div>
            <div className="border-t border-gray-700 pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">시가총액</span>
                <span className="text-white">{formatNumber(company.marketCap)}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">거래량</span>
                <span className="text-white">{company.volume.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">임직원수</span>
                <span className="text-white">{company.employees.toLocaleString()}명</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Percent size={14} /> 투자지표 분석
            </div>
            <ScoreRadar company={company} />
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <DollarSign size={14} /> 주요 밸류에이션
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'PER', value: company.per.toFixed(1) + '배' },
                { label: 'PBR', value: company.pbr.toFixed(2) + '배' },
                { label: 'ROE', value: company.roe.toFixed(1) + '%' },
                { label: '부채비율', value: company.debtRatio.toFixed(1) + '%' },
                { label: '배당수익률', value: company.dividendYield.toFixed(2) + '%' },
                { label: '영업이익률', value: company.operatingMargin.toFixed(1) + '%' },
              ].map(m => (
                <div key={m.label} className="flex justify-between border-b border-gray-700 pb-2 last:border-0">
                  <span className="text-gray-400">{m.label}</span>
                  <span className="text-white font-medium">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Users size={14} /> 애널리스트 컨센서스
            </div>
            <div className="text-center mb-3">
              <div className="text-orange-400 font-bold text-lg">{company.analystRatings.targetPrice.toLocaleString()}원</div>
              <div className="text-green-400 text-sm">목표주가 +{upside}%</div>
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                { label: '강력매수', count: company.analystRatings.strongBuy, color: 'bg-red-500' },
                { label: '매수', count: company.analystRatings.buy, color: 'bg-orange-400' },
                { label: '중립', count: company.analystRatings.hold, color: 'bg-gray-500' },
                { label: '매도', count: company.analystRatings.sell, color: 'bg-blue-500' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="w-12 text-gray-400 text-right">{r.label}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div className={`${r.color} h-1.5 rounded-full`} style={{ width: `${(r.count / totalAnalysts) * 100}%` }} />
                  </div>
                  <span className="text-white w-5">{r.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-gray-400">
              매수 의견 <span className="text-green-400 font-bold">{bullish}%</span> ({totalAnalysts}명)
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> 분기 실적
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">매출액</span>
                <span className="text-white">{formatNumber(company.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">영업이익</span>
                <span className="text-yellow-400">{formatNumber(company.operatingProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">순이익</span>
                <span className="text-green-400">{formatNumber(company.netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
