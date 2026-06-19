import { useState, useCallback } from 'react';

const KEY = 'jj_watchlist';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function save(set: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(load);

  const toggle = useCallback((code: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      save(next);
      return next;
    });
  }, []);

  const isWatched = useCallback((code: string) => watchlist.has(code), [watchlist]);

  return { watchlist, toggle, isWatched };
}
