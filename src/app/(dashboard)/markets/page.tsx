"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDerivWS } from "@/hooks/use-deriv-ws";
import { TradingChart } from "@/components/charts/trading-chart";
import type { DerivActiveSymbol, DerivTick, DerivActiveSymbolsResponse } from "@/types/deriv";
import type { CandlestickData, Time } from "lightweight-charts";

const MARKET_GROUPS = [
  { key: "synthetic_index", label: "Synthetic Indices" },
  { key: "forex", label: "Forex" },
  { key: "commodities", label: "Commodities" },
  { key: "cryptocurrency", label: "Crypto" },
];

const TIMEFRAMES = [
  { label: "1m", granularity: 60, count: 100 },
  { label: "5m", granularity: 300, count: 100 },
  { label: "15m", granularity: 900, count: 100 },
  { label: "1h", granularity: 3600, count: 100 },
  { label: "4h", granularity: 14400, count: 100 },
  { label: "1d", granularity: 86400, count: 100 },
];

export default function MarketsPage() {
  const { send, connectionStatus, lastTick } = useDerivWS({ autoConnect: true });
  const [symbols, setSymbols] = useState<DerivActiveSymbol[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("synthetic_index");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[0]);
  const [candles, setCandles] = useState<CandlestickData<Time>[]>([]);
  const [candlesLoading, setCandlesLoading] = useState(false);
  const [candlesError, setCandlesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch active symbols on connect
  useEffect(() => {
    if (connectionStatus === "connected") {
      send({ active_symbols: "brief", product_type: "basic" } as Record<string, unknown>)
        .then((data) => {
          const response = data as DerivActiveSymbolsResponse;
          const syms = response.active_symbols || [];
          setSymbols(syms);
          setLoading(false);
          // Auto-select first symbol in group
          const firstInGroup = syms.find(
            (s: DerivActiveSymbol) =>
              s.market === selectedGroup || s.subgroup === selectedGroup
          );
          if (firstInGroup && !selectedSymbol) {
            setSelectedSymbol(firstInGroup.symbol);
          }
        })
        .catch(() => setLoading(false));
    }
  }, [connectionStatus, send, selectedGroup, selectedSymbol]);

  // Fetch real candles when symbol or timeframe changes
  const fetchCandles = useCallback(
    async (symbol: string, tf: typeof TIMEFRAMES[0]) => {
      setCandlesLoading(true);
      setCandlesError(null);
      try {
        const params = new URLSearchParams({
          symbol,
          granularity: String(tf.granularity),
          count: String(tf.count),
        });
        const res = await fetch(`/api/markets/candles?${params}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch candles");
        }
        const data = await res.json();
        const formatted: CandlestickData<Time>[] = (data.candles || []).map(
          (c: { epoch: number; open: number; high: number; low: number; close: number }) => ({
            time: c.epoch as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })
        );
        setCandles(formatted);
      } catch (err) {
        setCandlesError(err instanceof Error ? err.message : "Failed to load chart data");
        setCandles([]);
      } finally {
        setCandlesLoading(false);
      }
    },
    []
  );

  // Fetch candles when symbol or timeframe changes
  useEffect(() => {
    if (selectedSymbol) {
      fetchCandles(selectedSymbol, selectedTimeframe);
    }
  }, [selectedSymbol, selectedTimeframe, fetchCandles]);

  // Update last candle with live tick
  useEffect(() => {
    if (!lastTick?.tick || !selectedSymbol || candles.length === 0) return;
    const tick = lastTick.tick;
    if (tick.symbol !== selectedSymbol) return;

    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const lastCandle = { ...prev[prev.length - 1] };
      const quote = tick.quote || 0;

      lastCandle.close = Number(quote.toFixed(4));
      if (quote > lastCandle.high) lastCandle.high = lastCandle.close;
      if (quote < lastCandle.low) lastCandle.low = lastCandle.close;

      return [...prev.slice(0, -1), lastCandle];
    });
  }, [lastTick, selectedSymbol, candles.length]);

  const filtered = useMemo(
    () =>
      symbols.filter(
        (s) => s.market === selectedGroup || s.subgroup === selectedGroup
      ),
    [symbols, selectedGroup]
  );

  const handleSelectSymbol = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      fetchCandles(symbol, selectedTimeframe);
    },
    [fetchCandles, selectedTimeframe]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-sentienx-text-muted mt-1">
          Browse instruments and view live price charts
        </p>
      </div>

      {/* Chart Panel */}
      {selectedSymbol && (
        <div className="stat-card p-4">
          {candlesLoading ? (
            <div className="flex items-center justify-center h-[380px]">
              <div className="w-8 h-8 border-2 border-sentienx-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : candlesError ? (
            <div className="flex items-center justify-center h-[380px] text-sentienx-bear text-sm">
              {candlesError}
            </div>
          ) : (
            <TradingChart
              symbol={selectedSymbol}
              data={candles}
              height={380}
            />
          )}
        </div>
      )}

      {/* Market Group Tabs */}
      <div className="flex gap-2 flex-wrap">
        {MARKET_GROUPS.map((group) => (
          <button
            key={group.key}
            onClick={() => setSelectedGroup(group.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedGroup === group.key
                ? "bg-sentienx-brand text-white"
                : "bg-sentienx-card text-sentienx-text-muted hover:text-sentienx-text border border-sentienx-border"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Symbols List */}
      <div className="stat-card overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-sentienx-text-dim">
            Loading markets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sentienx-text-dim">
            No markets available in this category
          </div>
        ) : (
          <div className="divide-y divide-sentienx-border">
            {filtered.slice(0, 50).map((symbol) => (
              <div
                key={symbol.symbol}
                onClick={() => handleSelectSymbol(symbol.symbol)}
                className={`flex items-center justify-between py-3 px-4 transition-colors cursor-pointer ${
                  selectedSymbol === symbol.symbol
                    ? "bg-sentienx-brand/5 border-l-2 border-sentienx-brand"
                    : "hover:bg-sentienx-sidebar-hover"
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{symbol.display_name}</p>
                  <p className="text-xs text-sentienx-text-dim">
                    {symbol.market_display_name} —{" "}
                    {symbol.submarket_display_name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {symbol.is_trading_suspended ? (
                    <span className="text-xs px-2 py-1 rounded bg-sentienx-bear-bg text-sentienx-bear">
                      Suspended
                    </span>
                  ) : symbol.exchange_is_open ? (
                    <span className="text-xs px-2 py-1 rounded bg-sentienx-bull-bg text-sentienx-bull">
                      Open
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-sentienx-card text-sentienx-text-dim">
                      Closed
                    </span>
                  )}
                  <a
                    href={`/dashboard/trade?symbol=${symbol.symbol}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-sentienx-brand/10 text-sentienx-brand hover:bg-sentienx-brand/20 transition-colors"
                  >
                    Trade
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
