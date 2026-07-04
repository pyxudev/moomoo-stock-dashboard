'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Watchlist from '@/components/watchlist/Watchlist';
import PortfolioPanel from '@/components/portfolio/PortfolioPanel';
import SimulationPanel from '@/components/simulation/SimulationPanel';

// Chart uses browser-only APIs
const ChartPanel = dynamic(() => import('@/components/chart/ChartPanel'), { ssr: false });

type Tab = 'chart' | 'portfolio' | 'simulation';

const TABS: { id: Tab; label: string }[] = [
  { id: 'chart', label: 'チャート' },
  { id: 'portfolio', label: 'ポートフォリオ' },
  { id: 'simulation', label: 'シミュレーション' },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>('chart');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const handleSelectCode = (code: string) => {
    setSelectedCode(code);
    setTab('chart');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <Watchlist onSelectCode={handleSelectCode} selectedCode={selectedCode} />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab bar */}
        <nav className="flex border-b border-border px-5 shrink-0 bg-panel">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Panels */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'chart' && <ChartPanel selectedCode={selectedCode} />}
          {tab === 'portfolio' && <PortfolioPanel />}
          {tab === 'simulation' && <SimulationPanel />}
        </div>
      </main>
    </div>
  );
}
