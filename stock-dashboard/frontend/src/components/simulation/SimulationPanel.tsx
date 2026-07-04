'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import {
  fetchSimulation,
  executeBuy,
  executeSell,
  resetSimulation,
  SimulationState,
  SimulationTrade,
} from '@/lib/api';

const fmt = (n: number) => `¥${Math.round(n).toLocaleString('ja-JP')}`;

export default function SimulationPanel() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await fetchSimulation();
      setState(s);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = Number(price) * Number(qty);

  const handleSubmit = async () => {
    if (!code.trim() || !Number(price) || !Number(qty)) {
      setError('銘柄コード・価格・株数をすべて入力してください');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fn = side === 'buy' ? executeBuy : executeSell;
      await fn({ code: code.trim(), price: Number(price), quantity: Number(qty), side });
      setCode(''); setPrice(''); setQty('');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('シミュレーションをリセットしますか？')) return;
    await resetSimulation();
    load();
  };

  const balance = state?.balance ?? 0;
  const initial = state?.initial ?? 10_000_000;
  const pnl = balance - initial;
  const pnlPct = (pnl / initial) * 100;

  return (
    <div className="flex-1 p-5 overflow-auto">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Balance card */}
        <div className="bg-panel border border-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">シミュレーション残高</p>
              <p className="text-3xl font-bold font-mono text-white">{fmt(balance)}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-sm font-mono ${pnl >= 0 ? 'gain' : 'loss'}`}>
                  {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                </span>
                <span className={`text-sm font-mono ${pnlPct >= 0 ? 'gain' : 'loss'}`}>
                  ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">初期資金: {fmt(initial)}</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-red-900/20 border border-red-800/40 text-red-400 text-xs px-3 py-1.5 rounded hover:bg-red-900/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              リセット
            </button>
          </div>
        </div>

        {/* Order form */}
        <div className="bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">注文</h3>

          {/* Buy/Sell toggle */}
          <div className="flex gap-2 mb-4">
            {(['buy', 'sell'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  side === s
                    ? s === 'buy'
                      ? 'bg-gain/20 border border-gain/40 text-gain'
                      : 'bg-loss/20 border border-loss/40 text-loss'
                    : 'bg-surface border border-border text-gray-500 hover:text-gray-300'
                }`}
              >
                {s === 'buy' ? '買い' : '売り'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">銘柄コード</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="7203"
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">価格 (円)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="2800"
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">株数</label>
                <input
                  type="number"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="100"
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>

            {total > 0 && (
              <p className="text-xs text-gray-500">
                取引金額: <span className="text-white font-mono">{fmt(total)}</span>
              </p>
            )}
            {error && <p className="text-xs text-loss">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-2.5 rounded font-semibold text-sm transition-colors disabled:opacity-50 ${
                side === 'buy'
                  ? 'bg-gain/20 border border-gain/40 text-gain hover:bg-gain/30'
                  : 'bg-loss/20 border border-loss/40 text-loss hover:bg-loss/30'
              }`}
            >
              {submitting ? '処理中…' : side === 'buy' ? '買い注文実行' : '売り注文実行'}
            </button>
          </div>
        </div>

        {/* Trade history */}
        {state && state.trades.length > 0 && (
          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">取引履歴</h3>
            </div>
            <ul className="divide-y divide-border">
              {state.trades.map(t => (
                <li key={t.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${t.side === 'buy' ? 'gain' : 'loss'}`}>
                      {t.side === 'buy' ? '買' : '売'}
                    </span>
                    <span className="font-mono text-accent">{t.code}</span>
                    <span className="text-gray-500">
                      {new Date(t.executed_at).toLocaleString('ja-JP', {
                        month: 'numeric', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-gray-400">
                      ¥{t.price.toLocaleString()} × {t.quantity}
                    </span>
                    <span className={`ml-2 ${t.side === 'buy' ? 'loss' : 'gain'}`}>
                      {t.side === 'buy' ? '-' : '+'}{fmt(t.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
