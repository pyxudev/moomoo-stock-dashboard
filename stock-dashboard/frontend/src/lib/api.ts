const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

export function wsUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000');
  return `${base}${path}`;
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

export const fetchWatchlist = () => apiFetch<WatchlistItem[]>('/watchlist');
export const addToWatchlist = (code: string, name?: string) =>
  apiFetch('/watchlist', { method: 'POST', body: JSON.stringify({ code, name }) });
export const removeFromWatchlist = (id: number) =>
  apiFetch(`/watchlist/${id}`, { method: 'DELETE' });
export const searchStocks = (q: string) =>
  apiFetch<{ code: string; name: string }[]>(`/watchlist/search?q=${encodeURIComponent(q)}`);

// ─── Quote ───────────────────────────────────────────────────────────────────

export const fetchQuote = (code: string) => apiFetch<Quote>(`/quote/${code}`);
export const fetchChart = (code: string, ktype: KType = 'daily', count = 365) =>
  apiFetch<Candle[]>(`/chart/${code}?ktype=${ktype}&count=${count}`);

// ─── Positions ───────────────────────────────────────────────────────────────

export const fetchPositions = () => apiFetch<PositionsResponse>('/positions');
export const createPosition = (body: CreatePositionBody) =>
  apiFetch('/positions', { method: 'POST', body: JSON.stringify(body) });
export const updatePosition = (id: number, body: Partial<CreatePositionBody>) =>
  apiFetch(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deletePosition = (id: number) =>
  apiFetch(`/positions/${id}`, { method: 'DELETE' });

// ─── Simulation ──────────────────────────────────────────────────────────────

export const fetchSimulation = () => apiFetch<SimulationState>('/simulation');
export const executeBuy = (body: TradeOrder) =>
  apiFetch('/simulation/buy', { method: 'POST', body: JSON.stringify(body) });
export const executeSell = (body: TradeOrder) =>
  apiFetch('/simulation/sell', { method: 'POST', body: JSON.stringify(body) });
export const resetSimulation = () =>
  apiFetch('/simulation/reset', { method: 'POST' });

// ─── Types ───────────────────────────────────────────────────────────────────

export type KType = 'daily' | 'monthly' | '15min';

export interface WatchlistItem {
  id: number;
  code: string;
  name: string;
  price: number;
  change: number;
  change_rate: number;
}

export interface Quote {
  code: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  change: number;
  change_rate: number;
  volume: number;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  cost_price: number;
  quantity: number;
  purchase_date: string | null;
  memo: string | null;
  current_price: number;
  value: number;
  pnl: number;
  pnl_pct: number;
  change: number;
  change_rate: number;
}

export interface PositionsResponse {
  positions: Position[];
  summary: {
    total_value: number;
    total_cost: number;
    total_pnl: number;
    total_pnl_pct: number;
    count: number;
  };
}

export interface CreatePositionBody {
  code: string;
  name?: string;
  cost_price: number;
  quantity: number;
  purchase_date?: string;
  memo?: string;
}

export interface SimulationTrade {
  id: number;
  side: 'buy' | 'sell';
  code: string;
  price: number;
  quantity: number;
  total: number;
  executed_at: string;
}

export interface SimulationState {
  balance: number;
  initial: number;
  trades: SimulationTrade[];
}

export interface TradeOrder {
  code: string;
  price: number;
  quantity: number;
  side: string;
}
