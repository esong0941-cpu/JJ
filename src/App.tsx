import { useState } from 'react';
import { useRealTimeData } from './hooks/useRealTimeData';
import { MarketTicker } from './components/MarketTicker';
import { Dashboard } from './pages/Dashboard';
import { ShortTermPage } from './pages/ShortTermPage';
import { LongTermPage } from './pages/LongTermPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { CompanyDetail } from './components/CompanyDetail';
import { longTermStocks, companies } from './data/mockData';
import { BarChart2, Activity, TrendingUp, LayoutDashboard } from 'lucide-react';

type Tab = 'dashboard' | 'short' | 'long' | 'analysis';

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'short', label: '단타종목', icon: Activity },
  { key: 'long', label: '장타종목', icon: TrendingUp },
  { key: 'analysis', label: '기업분석', icon: BarChart2 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const { market, shorts, ticker, lastUpdate } = useRealTimeData();

  const handleStockClick = (code: string) => {
    const company = companies.find(c => c.code === code);
    if (company) setSelectedCompany(code);
  };

  const selectedCompanyData = selectedCompany ? companies.find(c => c.code === selectedCompany) : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-black" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">StockVision</div>
              <div className="text-gray-500 text-xs">주식분석 투자플랫폼</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            실시간 시세 연동중
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'text-yellow-400 border-yellow-400'
                      : 'text-gray-400 border-transparent hover:text-gray-200'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Ticker */}
      <MarketTicker stocks={ticker} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            market={market}
            lastUpdate={lastUpdate}
            topShorts={shorts}
            onStockClick={handleStockClick}
            onNavigate={(tab) => setActiveTab(tab as Tab)}
          />
        )}
        {activeTab === 'short' && (
          <ShortTermPage stocks={shorts} onStockClick={handleStockClick} />
        )}
        {activeTab === 'long' && (
          <LongTermPage stocks={longTermStocks} onStockClick={handleStockClick} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisPage companies={companies} onCompanyClick={handleStockClick} />
        )}
      </main>

      {/* Company detail modal */}
      {selectedCompanyData && (
        <CompanyDetail
          company={selectedCompanyData}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
