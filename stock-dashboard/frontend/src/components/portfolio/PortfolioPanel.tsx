'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import {
  fetchPositions,
  createPosition,
  updatePosition,
  deletePosition,
  Position,
  PositionsResponse,
  CreatePositionBody,
} from '@/lib/api';

const fmt = (n: number) => `¥${Math.round(n).toLocaleString('ja-JP')}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const fmtPnl = (n: number) => `${n >= 0 ? '+' : ''}${fmt(n)}`;

function SummaryCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${className ?? 'text-white'}`}>{value}</p>
    </div>
  );
}

interface AddFormProps {
  onClose: () => void;
  onSaved: () => void;
  initial?: Position;
}

function PositionForm({ onClose, onSaved, initial }: AddFormProps) {
  const [form, setForm] = useState<CreatePositionBody>({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    cost_price: initial?.cost_price ?? 0,
    quantity: initial?.quantity ?? 0,
    purchase_date: initial?.purchase_date ?? '',
    memo: initial?.memo ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof CreatePositionBody) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.code || !form.cost_price || !form.quantity) {
      setError('銘柄コード・取得単価・株数は必須です');
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await updatePosition(initial.id, { ...form, cost_price: Number(form.cost_price), quantity: Number(form.quantity) });
      } else {
        await createPosition({ ...form, cost_price: Number(form.cost_price), quantity: Number(form.quantity) });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-panel border border-border rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">{initial ? 'ポジション編集' : 'ポジション追加'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: '銘柄コード *', key: 'code', type: 'text', placeholder: '7203' },
            { label: '銘柄名', key: 'name', type: 'text', placeholder: 'トヨタ自動車' },
            { label: '取得単価 *', key: 'cost_price', type: 'number', placeholder: '2400' },
            { label: '株数 *', key: 'quantity', type: 'number', placeholder: '100' },
            { label: '購入日', key: 'purchase_date', type: 'date', placeholder: '' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={set(key as keyof CreatePositionBody)}
                placeholder={placeholder}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">メモ</label>
            <textarea
              value={form.memo ?? ''}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              rows={2}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent resize-none"
            />
          </div>
          {error && <p className="text-xs text-loss">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 bg-surface border border-border rounded py-2 text-sm hover:bg-border transition-colors">
            キャンセル
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 bg-accent/20 border border-accent/40 text-accent rounded py-2 text-sm hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPanel() {
  const [data, setData] = useState<PositionsResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchPositions();
      setData(res);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await deletePosition(id);
    load();
  };

  const summary = data?.summary;

  return (
    <div className="flex-1 p-5 overflow-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <SummaryCard label="総評価額" value={summary ? fmt(summary.total_value) : '—'} />
        <SummaryCard
          label="評価損益"
          value={summary ? fmtPnl(summary.total_pnl) : '—'}
          className={summary && summary.total_pnl >= 0 ? 'gain' : 'loss'}
        />
        <SummaryCard
          label="損益率"
          value={summary ? fmtPct(summary.total_pnl_pct) : '—'}
          className={summary && summary.total_pnl_pct >= 0 ? 'gain' : 'loss'}
        />
        <SummaryCard label="保有銘柄数" value={summary ? `${summary.count} 銘柄` : '—'} />
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-accent/20 border border-accent/40 text-accent text-sm px-3 py-1.5 rounded hover:bg-accent/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          ポジション追加
        </button>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-500">
              {['銘柄', '取得単価', '現在値', '株数', '評価額', '評価損益', '損益率', ''].map(h => (
                <th key={h} className={`px-3 py-2.5 text-left ${h === '' ? '' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!data || data.positions.length === 0) && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-600">
                  ポジションがありません
                </td>
              </tr>
            )}
            {data?.positions.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                <td className="px-3 py-2.5">
                  <div>
                    <span className="font-mono text-xs text-accent">{p.code}</span>
                    <p className="text-xs text-gray-500 truncate max-w-[100px]">{p.name}</p>
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">¥{p.cost_price.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {p.current_price > 0 ? `¥${p.current_price.toLocaleString()}` : '—'}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">{p.quantity.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {p.value > 0 ? fmt(p.value) : '—'}
                </td>
                <td className={`px-3 py-2.5 font-mono text-xs ${p.pnl >= 0 ? 'gain' : 'loss'}`}>
                  {p.current_price > 0 ? fmtPnl(p.pnl) : '—'}
                </td>
                <td className={`px-3 py-2.5 font-mono text-xs ${p.pnl_pct >= 0 ? 'gain' : 'loss'}`}>
                  {p.current_price > 0 ? fmtPct(p.pnl_pct) : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="text-gray-600 hover:text-accent transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-gray-600 hover:text-loss transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PositionForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
