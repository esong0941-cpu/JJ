import type { CompanyInfo } from '../types/stock';
import { StockChart } from './StockChart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, Users, Calendar, Building2 } from 'lucide-react';
import { formatNumber } from './PriceTag';

interface Props {
  company: CompanyInfo;
  onClose: () => void;
}

export function CompanyDetail({ company, onClose }: Props) {
  const totalAnalysts = company.analystRatings.strongBuy + company.analystRatings.buy + company.analystRatings.hold + company.analystRatings.sell;

  const revenueData = company.financialHistory.map(y => ({
    year: y.year,
    매출: Math.round(y.revenue / 100_000_000_000),
    영업이익: Math.round(y.operatingProfit / 100_000_000_000),
    순이익: Math.round(y.netProfit / 100_000_000_000),
  }));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-3xl my-4">
        <div className="sticky top-0 bg-gray-900 rounded-t-2xl border-b border-gray-700 p-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white">{company.name}</span>
              <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">{company.code}</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{company.market} · {company.sector}</span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-2xl font-bold text-white">{company.price.toLocaleString()}원</span>
              <span className={`text-lg ${company.changeRate > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {company.changeRate > 0 ? '▲' : '▼'} {Math.abs(company.changeRate).toFixed(2)}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Chart */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-sm font-medium text-gray-300 mb-3">주가 차트 (6개월)</div>
            <StockChart data={company.priceHistory} height={220} showAxis={true} />
          </div>

          {/* Company Info */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-sm font-medium text-gray-300 mb-3">기업 정보</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{company.description}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={14} />
                <span>임직원 {company.employees.toLocaleString()}명</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} />
                <span>설립 {company.founded}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Building2 size={14} />
                <span>시가총액 {formatNumber(company.marketCap)}원</span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'PER', value: company.per.toFixed(1) + '배' },
              { label: 'PBR', value: company.pbr.toFixed(2) + '배' },
              { label: 'ROE', value: company.roe.toFixed(1) + '%' },
              { label: '배당수익률', value: company.dividendYield.toFixed(2) + '%' },
              { label: '부채비율', value: company.debtRatio.toFixed(1) + '%' },
              { label: '매출성장률', value: '+' + company.revenueGrowth.toFixed(1) + '%' },
              { label: '영업이익률', value: company.operatingMargin.toFixed(1) + '%' },
              { label: '거래량', value: formatNumber(company.volume) },
            ].map(m => (
              <div key={m.label} className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                <div className="text-gray-500 text-xs mb-1">{m.label}</div>
                <div className="text-white font-bold text-sm">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-sm font-medium text-gray-300 mb-4">실적 현황 (단위: 천억원)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(v) => [Number(v) + '천억원']}
                />
                <Bar dataKey="매출" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {revenueData.map((_, i) => <Cell key={i} fill="#3b82f6" opacity={0.7 + i * 0.1} />)}
                </Bar>
                <Bar dataKey="영업이익" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="순이익" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-center">
                <thead>
                  <tr className="text-gray-500">
                    <th className="py-2 text-left">구분</th>
                    {company.financialHistory.map(y => <th key={y.year}>{y.year}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr>
                    <td className="py-2 text-left text-gray-400">매출액</td>
                    {company.financialHistory.map(y => (
                      <td key={y.year} className="py-2 text-white">{formatNumber(y.revenue)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-left text-gray-400">영업이익</td>
                    {company.financialHistory.map(y => (
                      <td key={y.year} className={`py-2 ${y.operatingProfit > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {y.operatingProfit < 0 ? '-' : ''}{formatNumber(Math.abs(y.operatingProfit))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-left text-gray-400">순이익</td>
                    {company.financialHistory.map(y => (
                      <td key={y.year} className={`py-2 ${y.netProfit > 0 ? 'text-green-400' : 'text-blue-400'}`}>
                        {y.netProfit < 0 ? '-' : ''}{formatNumber(Math.abs(y.netProfit))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-left text-gray-400">EPS</td>
                    {company.financialHistory.map(y => (
                      <td key={y.year} className="py-2 text-white">{y.eps.toLocaleString()}원</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Analyst Ratings */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-300">애널리스트 투자의견</div>
              <div className="text-sm">
                <span className="text-gray-400">목표주가 </span>
                <span className="text-orange-400 font-bold">{company.analystRatings.targetPrice.toLocaleString()}원</span>
                <span className="text-green-400 text-xs ml-2">
                  (+{((company.analystRatings.targetPrice - company.price) / company.price * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: '강력매수', count: company.analystRatings.strongBuy, color: 'bg-red-500' },
                { label: '매수', count: company.analystRatings.buy, color: 'bg-orange-400' },
                { label: '중립', count: company.analystRatings.hold, color: 'bg-gray-500' },
                { label: '매도', count: company.analystRatings.sell, color: 'bg-blue-500' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-gray-400 text-right">{r.label}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className={`${r.color} h-2 rounded-full`}
                      style={{ width: `${(r.count / totalAnalysts) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-white">{r.count}명</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
