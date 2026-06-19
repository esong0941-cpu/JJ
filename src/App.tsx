import { useState } from 'react';
import { useRealTimeData } from './hooks/useRealTimeData';
import { useWatchlist } from './hooks/useWatchlist';
import { MarketTicker } from './components/MarketTicker';
import { Dashboard } from './pages/Dashboard';
import { ShortTermPage } from './pages/ShortTermPage';
import { LongTermPage } from './pages/LongTermPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { StockBrowserPage } from './pages/StockBrowserPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { CompanyDetail } from './components/CompanyDetail';
import { SearchBar } from './components/SearchBar';
import { SearchedStockDetail } from './components/SearchedStockDetail';
import { BarChart2, Activity, TrendingUp, LayoutDashboard, List, Star, RefreshCw, AlertTriangle } from 'lucide-react';

type Tab = 'dashboard' | 'short' | 'long' | 'analysis' | 'browse' | 'watchlist';

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'short', label: '단타종목', icon: Activity },
  { key: 'long', label: '장타종목', icon: TrendingUp },
  { key: 'analysis', label: '기업분석', icon: BarChart2 },
  { key: 'browse', label: '전체종목', icon: List },
  { key: 'watchlist', label: '관심종목', icon: Star },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [searchedStock, setSearchedStock] = useState<{ symbol: string; name: string } | null>(null);
  const { market, shorts, longTerms, companies, ticker, lastUpdate, loading, error } = useRealTimeData();
  const { watchlist, toggle, isWatched } = useWatchlist();

  const openStock = (code: string, symbol?: string, name?: string) => {
    const company = companies.find(c => c.code === code);
    if (company) {
      setSelectedCompany(code);
    } else if (symbol) {
      setSearchedStock({ symbol, name: name ?? code });
    }
  };

  const handleStockClick = (code: string) => openStock(code);

  const handleSearchSelect = (symbol: string, name: string) => {
    const code = symbol.replace(/\.(KS|KQ)$/i, '');
    openStock(code, symbol, name);
  };

  const handleBrowseClick = (symbol: string, name: string) => {
    const code = symbol.replace(/\.(KS|KQ)$/i, '');
    openStock(code, symbol, name);
  };

  const selectedCompanyData = selectedCompany ? companies.find(c => c.code === selectedCompany) : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-black" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-lg leading-none">StockVision</div>
              <div className="text-gray-500 text-xs">주식분석 투자플랫폼</div>
            </div>
          </div>

          <div className="flex-1 max-w-sm">
            <SearchBar onSelectStock={handleSearchSelect} />
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            {loading ? (
              <span className="text-gray-400 flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> 로딩 중...
              </span>
            ) : error ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} /> 오류
              </span>
            ) : (
              <span className="text-gray-400 hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
                {lastUpdate?.toLocaleTimeString('ko-KR')}
              </span>
            )}
          </div>
        </div>
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
                  {tab.key === 'watchlist' && watchlist.size > 0 && (
                    <span className="bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                      {watchlist.size}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <MarketTicker stocks={ticker} />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-3" />
            <div>실시간 주가 데이터 불러오는 중...</div>
          </div>
        </div>
      ) : error && activeTab !== 'browse' && activeTab !== 'watchlist' ? (
        <div className="max-w-7xl mx-auto px-4 py-10 text-center text-red-400">
          <AlertTriangle size={32} className="mx-auto mb-3" />
          <div>데이터를 불러오지 못했습니다.</div>
          <div className="text-sm text-gray-500 mt-1">{error}</div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'dashboard' && market && (
            <Dashboard
              market={market}
              lastUpdate={lastUpdate!}
              topShorts={shorts}
              longTerms={longTerms}
              companies={companies}
              onStockClick={handleStockClick}
              onNavigate={(tab) => setActiveTab(tab as Tab)}
            />
          )}
          {activeTab === 'short' && (
            <ShortTermPage stocks={shorts} onStockClick={handleStockClick} isWatched={isWatched} onToggleWatch={toggle} />
          )}
          {activeTab === 'long' && (
            <LongTermPage stocks={longTerms} onStockClick={handleStockClick} isWatched={isWatched} onToggleWatch={toggle} />
          )}
          {activeTab === 'analysis' && <AnalysisPage companies={companies} onCompanyClick={handleStockClick} />}
          {activeTab === 'browse' && (
            <StockBrowserPage onStockClick={handleBrowseClick} isWatched={isWatched} onToggleWatch={toggle} />
          )}
          {activeTab === 'watchlist' && (
            <WatchlistPage
              watchlist={watchlist}
              onStockClick={handleBrowseClick}
              onToggleWatch={toggle}
            />
          )}
        </main>
      )}

      {selectedCompanyData && (
        <CompanyDetail company={selectedCompanyData} onClose={() => setSelectedCompany(null)} />
      )}

      {searchedStock && (
        <SearchedStockDetail
          symbol={searchedStock.symbol}
          name={searchedStock.name}
          onClose={() => setSearchedStock(null)}
        />
      )}
    </div>
  );
}
