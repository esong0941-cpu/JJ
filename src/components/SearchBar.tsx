import { useState, useEffect, useRef } from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { searchStocks } from '../services/api';
import type { SearchResult } from '../services/api';

interface Props {
  onSelectStock: (symbol: string, name: string) => void;
}

export function SearchBar({ onSelectStock }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const data = await searchStocks(query);
      setResults(data);
      setLoading(false);
    }, 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const clear = () => { setQuery(''); setResults([]); setOpen(false); };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 focus-within:border-yellow-500/50 transition-colors">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          placeholder="종목명·코드 검색 (삼성, 005930…)"
          className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1 min-w-0"
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {loading && <RefreshCw size={12} className="text-gray-400 animate-spin shrink-0" />}
        {query && !loading && (
          <button onClick={clear}><X size={13} className="text-gray-500 hover:text-gray-300" /></button>
        )}
      </div>

      {open && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-gray-400 text-sm">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-gray-400 text-sm">검색 결과가 없습니다</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-700/50">
              {results.map(r => (
                <li key={r.symbol}>
                  <button
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-700/60 transition-colors"
                    onClick={() => {
                      onSelectStock(r.symbol, r.shortname);
                      clear();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium truncate">{r.shortname}</div>
                        <div className="text-xs text-gray-400">{r.symbol} · {r.exchDisp}</div>
                      </div>
                      {r.isKorean && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded shrink-0">KR</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
