'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchChart, fetchWatchlist, Candle, KType, WatchlistItem } from '@/lib/api';

type KTypeOption = { label: string; value: KType };
const KTYPES: KTypeOption[] = [
  { label: '月足', value: 'monthly' },
  { label: '日足', value: 'daily' },
  { label: '15分', value: '15min' },
];

interface ChartPanelProps {
  code: string;
  name?: string;
  onClose?: () => void;
}

function CandleChart({ code, name, onClose }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [ktype, setKtype] = useState<KType>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      if (!containerRef.current) return;
      const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: '#1e2535' },
          horzLines: { color: '#1e2535' },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#1e2535' },
        timeScale: {
          borderColor: '#1e2535',
          timeVisible: true,
        },
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#00d4aa',
        downColor: '#f04f5e',
        borderVisible: false,
        wickUpColor: '#00d4aa',
        wickDownColor: '#f04f5e',
      });

      chartRef.current = chart;
      seriesRef.current = series;

      const ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.resize(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
          );
        }
      });
      ro.observe(containerRef.current);

      if (destroyed) { chart.remove(); ro.disconnect(); }
    };

    init();
    return () => { destroyed = true; chartRef.current?.remove(); };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    setLoading(true);
    setError('');

    fetchChart(code, ktype)
      .then(candles => {
        if (!seriesRef.current) return;
        const data = candles.map(c => ({
          time: c.time as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        seriesRef.current.setData(data);
        chartRef.current?.timeScale().fitContent();
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [code, ktype]);

  return (
    <div className="bg-panel border border-border rounded-lg flex flex-col h-56 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-accent">{code}</span>
          {name && <span className="text-xs text-gray-500 truncate max-w-[100px]">{name}</span>}
        </div>
        <div className="flex items-center gap-1">
          {KTYPES.map(k => (
            <button
              key={k.value}
              onClick={() => setKtype(k.value)}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                ktype === k.value
                  ? 'bg-accent/20 text-accent'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {k.label}
            </button>
          ))}
          {onClose && (
            <button onClick={onClose} className="text-gray-600 hover:text-loss ml-1 text-xs">✕</button>
          )}
        </div>
      </div>
      {/* Chart area */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
            読み込み中…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-loss">
            {error}
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}

interface Props {
  selectedCode: string | null;
}

export default function ChartPanel({ selectedCode }: Props) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [pinnedCodes, setPinnedCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchWatchlist().then(data => {
      setWatchlist(data);
      // Show up to 4 initially
      setPinnedCodes(prev => {
        const existing = new Set(prev);
        const next = [...prev];
        for (const item of data) {
          if (!existing.has(item.code) && next.length < 4) {
            next.push(item.code);
          }
        }
        return next;
      });
    }).catch(() => {});
  }, []);

  // When a code is selected from sidebar, add/focus it
  useEffect(() => {
    if (!selectedCode) return;
    setPinnedCodes(prev => {
      if (prev.includes(selectedCode)) return prev;
      const next = [...prev, selectedCode];
      return next.slice(-8); // max 8
    });
  }, [selectedCode]);

  const nameMap = Object.fromEntries(watchlist.map(w => [w.code, w.name]));

  const removeChart = (code: string) => {
    setPinnedCodes(prev => prev.filter(c => c !== code));
  };

  if (pinnedCodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-600">
        ウォッチリストに銘柄を追加するとチャートが表示されます
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className={`grid gap-4 ${pinnedCodes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {pinnedCodes.map(code => (
          <CandleChart
            key={code}
            code={code}
            name={nameMap[code]}
            onClose={() => removeChart(code)}
          />
        ))}
      </div>
    </div>
  );
}
