from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Optional

import moomoo as ft
from config import settings


def _get_quote_ctx():
    """同期コンテキスト取得（thread内で利用）"""
    ctx = ft.OpenQuoteContext(host=settings.moomoo_host, port=settings.moomoo_port)
    return ctx


def _jp_symbol(code: str) -> str:
    """7203 → JP.7203"""
    code = code.strip()
    if "." in code:
        return code
    return f"JP.{code}"


def get_snapshot(codes: list[str]) -> list[dict]:
    """リアルタイムスナップショットを取得"""
    symbols = [_jp_symbol(c) for c in codes]
    ctx = _get_quote_ctx()
    try:
        ret, data = ctx.get_market_snapshot(symbols)
        if ret != ft.RET_OK:
            print(f"[moomoo] get_market_snapshot failed for {symbols}: {data}")
            raise RuntimeError(f"get_market_snapshot failed: {data}")
        results = []
        for _, row in data.iterrows():
            results.append(
                {
                    "code": row["code"].replace("JP.", ""),
                    "name": row.get("name", ""),
                    "price": float(row.get("last_price", 0)),
                    "open": float(row.get("open_price", 0)),
                    "high": float(row.get("high_price", 0)),
                    "low": float(row.get("low_price", 0)),
                    "prev_close": float(row.get("prev_close_price", 0)),
                    "change": float(row.get("change_val", 0)),
                    "change_rate": float(row.get("change_rate", 0)),
                    "volume": int(row.get("volume", 0)),
                    "turnover": float(row.get("turnover", 0)),
                }
            )
        return results
    finally:
        ctx.close()


def get_kline(
    code: str,
    ktype: str = "K_DAY",
    count: int = 365,
) -> list[dict]:
    """
    ローソク足データを取得。
    ktype: K_MON / K_DAY / K_15M
    """
    symbol = _jp_symbol(code)
    ktype_map = {
        "monthly": ft.KLType.K_MON,
        "daily": ft.KLType.K_DAY,
        "15min": ft.KLType.K_15M,
    }
    ft_ktype = ktype_map.get(ktype, ft.KLType.K_DAY)

    ctx = _get_quote_ctx()
    try:
        end = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        start_date = (datetime.now() - timedelta(days=count)).strftime("%Y-%m-%d")
        ret, data, _ = ctx.request_history_kline(
            symbol,
            start=start_date,
            end=end,
            ktype=ft_ktype,
            max_count=1000,
        )
        if ret != ft.RET_OK:
            print(f"[moomoo] request_history_kline failed for {symbol}: {data}")
            raise RuntimeError(f"request_history_kline failed: {data}")
        candles = []
        for _, row in data.iterrows():
            candles.append(
                {
                    "time": str(row["time_key"])[:10],
                    "open": float(row["open"]),
                    "high": float(row["high"]),
                    "low": float(row["low"]),
                    "close": float(row["close"]),
                    "volume": int(row["volume"]),
                }
            )
        return candles
    finally:
        ctx.close()


def search_stock(keyword: str) -> list[dict]:
    """銘柄名 or コードで東証銘柄を検索"""
    ctx = _get_quote_ctx()
    try:
        ret, data = ctx.get_stock_basicinfo(ft.Market.JP, ft.SecurityType.STOCK)
        if ret != ft.RET_OK:
            return []
        results = []
        kw = keyword.lower()
        for _, row in data.iterrows():
            code = row["code"].replace("JP.", "")
            name = str(row.get("name", ""))
            if kw in code.lower() or kw in name.lower():
                results.append({"code": code, "name": name})
                if len(results) >= 20:
                    break
        return results
    finally:
        ctx.close()
