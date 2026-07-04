'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Search, TrendingUp, TrendingDown } from 'lucide-react';
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  searchStocks,
  WatchlistItem,
} from '@/lib/api';

interface Props {
  onSelectCode: (code: string) => void;
  selectedCode: string | null;
}

export default function Watchlist({ onSelectCode, selectedCode }: Props) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ code: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [now, setNow] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchWatchlist();
      setItems(data);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    setNow(new Date().toLocaleString('ja-JP'));
    const t = setInterval(() => setNow(new Date().toLocaleString('ja-JP')), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = async (val: string) => {
    setInput(val);
    if (val.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await searchStocks(val);
      setSuggestions(res.slice(0, 8));
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (code: string, name?: string) => {
    try {
      await addToWatchlist(code, name);
      setInput('');
      setSuggestions([]);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRemove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFromWatchlist(id);
    load();
  };

  return (
    <aside className="w-60 bg-panel border-r border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="font-bold text-base tracking-tight text-white">
          株式ダッシュボード
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">{now}</p>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">
          ウォッチリスト
        </p>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                value={input}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && input.trim() && handleAdd(input.trim())}
                placeholder="コード / 銘柄名"
                className="w-full bg-surface border border-border rounded pl-7 pr-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={() => input.trim() && handleAdd(input.trim())}
              className="bg-accent/20 hover:bg-accent/30 text-accent rounded px-2 py-1.5 text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-panel border border-border rounded shadow-xl">
              {suggestions.map(s => (
                <button
                  key={s.code}
                  onClick={() => handleAdd(s.code, s.name)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface transition-colors flex justify-between"
                >
                  <span className="text-accent font-mono">{s.code}</span>
                  <span className="text-gray-400 truncate ml-2">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto py-2">
        {items.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-gray-600">
            銘柄を追加してください
          </li>
        )}
        {items.map(item => {
          const isGain = item.change >= 0;
          const isSelected = selectedCode === item.code;
          return (
            <li
              key={item.id}
              onClick={() => onSelectCode(item.code)}
              className={`flex items-center justify-between px-3 py-2 mx-2 rounded cursor-pointer transition-colors group ${
                isSelected
                  ? 'bg-accent/10 border border-accent/30'
                  : 'hover:bg-surface'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-accent">{item.code}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{item.name}</p>
                <p className="text-xs font-mono text-white">
                  {item.price > 0 ? `¥${item.price.toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <span className={`text-xs font-mono ${isGain ? 'text-gain' : 'text-loss'}`}>
                  {item.price > 0
                    ? `${isGain ? '+' : ''}${item.change_rate.toFixed(2)}%`
                    : ''}
                </span>
                <button
                  onClick={e => handleRemove(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-loss transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
