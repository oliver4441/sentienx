"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useDerivWS } from "@/hooks/use-deriv-ws";
import { TradingChart } from "@/components/charts/trading-chart";
import type { DerivActiveSymbol, DerivTick, DerivActiveSymbolsResponse } from "@/types/deriv";
import type { CandlestickData, Time } from "lightweight-charts";

const MARKET_GROUPS = [
  { key: "synthetic_index", label: "Synthetic", shortLabel: "Synth" },
  { key: "forex", label: "Forex", shortLabel: "FX" },
  { key: "commodities", label: "Commodities", shortLabel: "Cmdt" },
  { key: "cryptocurrency", label: "Crypto", shortLabel: "Crypto" },
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
  const [tickPrices, setTickPrices] = useState<Map<string, number>>(new Map());

  // Fetch active symbols on connect
  useEffect(() => {
    if (connectionStatus === "connected") {
      send({ active_symbols: "brief", product_type: "basic" } as Record<string, unknown>)
        .then((data) => {
          const response = data as DerivActiveSymbolsResponse;
          const syms = response.active_symbols || [];
          setSymbols(syms);
          setLoading(false);
          const firstInGroup = syms.find(
            (s: DerivActiveSymbol) => s.market === selectedGroup || s.subgroup === selectedGroup
          );
          if (firstInGroup && !selectedSymbol) setSelectedSymbol(firstInGroup.symbol);
        })
        .catch(() => setLoading(false));
    }
  }, [connectionStatus, send, selectedGroup, selectedSymbol]);

  // Fetch candles via WebSocket ticks_history
  const fetchCandles = useCallback(
    async (symbol: string, tf: typeof TIMEFRAMES[0]) => {
      if (connectionStatus !== "connected") {
        setCandlesError("Not connected to Deriv. Please wait...");
        return;
      }
      setCandlesLoading(true);
      setCandlesError(null);
      try {
        const now = Math.floor(Date.now() / 1000);
        const from = now - tf.granularity * tf.count;

        const result = await send({
          ticks_history: symbol,
          style: "candles",
          granularity: tf.granularity,
          count: tf.count,
          start: from,
          end: "latest",
        } as Record<string, unknown>) as Record<string, unknown>;

        if (result.error) {
          const errMsg = (result.error as { message?: string }).message || "Failed to fetch candles";
          throw new Error(errMsg);
        }

        const rawCandles = result.candles as Array<{
          epoch: number;
          open: number;
          high: number;
          low: number;
          close: number;
        }> | undefined;

        if (!rawCandles || rawCandles.length === 0) {
          throw new Error("No candle data available for this symbol");
        }

        const formatted: CandlestickData<Time>[] = rawCandles.map((c) => ({
          time: c.epoch as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        setCandles(formatted);
      } catch (err) {
        setCandlesError(err instanceof Error ? err.message : "Failed to load chart data");
        setCandles([]);
      } finally {
        setCandlesLoading(false);
      }
    },
    [connectionStatus, send]
  );

  // Fetch candles when symbol or timeframe changes
  useEffect(() => {
    if (selectedSymbol) fetchCandles(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe, fetchCandles]);

  // Update latest candle with live tick
  useEffect(() => {
    if (!lastTick?.tick || !selectedSymbol || candles.length === 0) return;
    const tick = lastTick.tick;
    if (tick.symbol !== selectedSymbol) return;

    const quote = tick.quote;
    if (!quote) return;

    // Update tick price map for the symbol list
    setTickPrices((prev) => {
      const next = new Map(prev);
      next.set(tick.symbol, quote);
      return next;
    });

    // Update the last candle
    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const lastCandle = { ...prev[prev.length - 1] };
      lastCandle.close = Number(quote.toFixed(4));
      if (quote > lastCandle.high) lastCandle.high = lastCandle.close;
      if (quote < lastCandle.low) lastCandle.low = lastCandle.close;
      return [...prev.slice(0, -1), lastCandle];
    });
  }, [lastTick, selectedSymbol, candles.length]);

  const filtered = useMemo(
    () => symbols.filter((s) => s.market === selectedGroup || s.subgroup === selectedGroup),
    [symbols, selectedGroup]
  );

  const handleSelectSymbol = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      fetchCandles(symbol, selectedTimeframe);
    },
    [fetchCandles, selectedTimeframe]
  );

  const selectedSymbolData = symbols.find((s) => s.symbol === selectedSymbol);
  const currentPrice = selectedSymbol ? tickPrices.get(selectedSymbol) : null;

  return (
    <div className="space-y-3 sm:space-y-6 max-w-6xl">

      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">Markets</h1>
          <p className="text-[10px] sm:text-sm text-[#71717a] mt-0.5">Browse instruments and view live charts</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-[#00e676]" : "bg-[#ff1744]"} pulse-dot`} />
          <span className="text-[10px] sm:text-xs text-[#71717a]">{connectionStatus === "connected" ? "Live" : "Off"}</span>
        </div>
      </div>

      {/* ─── Chart Panel ─────────────────────────────────────────── */}
      {selectedSymbol && (
        <div className="stat-card p-2 sm:p-4">
          {/* Chart header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 px-1 sm:px-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-semibold truncate">{selectedSymbolData?.display_name || selectedSymbol}</p>
                {currentPrice != null && (
                  <span className="text-xs sm:text-sm font-medium tabular-nums text-[#f4f4f5]">
                    {currentPrice.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-[#71717a]">{selectedSymbolData?.market_display_name}</p>
            </div>
            <Link
              href={`/dashboard/trade?symbol=${selectedSymbol}`}
              className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 shrink-0"
            >
              Trade
            </Link>
          </div>

          {candlesLoading ? (
            <div className="flex items-center justify-center h-[250px] sm:h-[380px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#71717a]">Loading chart data...</p>
              </div>
            </div>
          ) : candlesError ? (
            <div className="flex flex-col items-center justify-center h-[250px] sm:h-[380px] text-center px-4">
              <p className="text-[#ff1744] text-xs sm:text-sm mb-2">{candlesError}</p>
              <button
                onClick={() => fetchCandles(selectedSymbol, selectedTimeframe)}
                className="text-xs text-[#6366f1] hover:text-[#818cf8] underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          ) : candles.length > 0 ? (
            <TradingChart symbol={selectedSymbol} data={candles} height={window.innerWidth < 640 ? 250 : 380} />
          ) : (
            <div className="flex items-center justify-center h-[250px] sm:h-[380px] text-xs text-[#71717a]">
              Select a symbol to view chart
            </div>
          )}
        </div>
      )}

      {/* ─── Timeframe Selector — horizontal scroll on mobile ───── */}
      <div className="h-scroll">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.label}
            onClick={() => setSelectedTimeframe(tf)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              selectedTimeframe.label === tf.label
                ? "bg-[#6366f1] text-white"
                : "bg-[#0a0a0f] border border-white/[0.06] text-[#a1a1aa] hover:border-white/[0.12]"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* ─── Market Group Tabs — horizontal scroll on mobile ────── */}
      <div className="h-scroll">
        {MARKET_GROUPS.map((group) => (
          <button
            key={group.key}
            onClick={() => { setSelectedGroup(group.key); setSelectedSymbol(null); setCandles([]); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedGroup === group.key
                ? "bg-[#6366f1] text-white"
                : "bg-white/[0.03] border border-white/[0.06] text-[#a1a1aa] hover:border-white/[0.12]"
            }`}
          >
            <span className="sm:hidden">{group.shortLabel}</span>
            <span className="hidden sm:inline">{group.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Symbols List ───────────────────────────────────────── */}
      <div className="stat-card overflow-hidden">
        {loading ? (
          <div className="text-center py-8 sm:py-12 text-[#71717a] text-xs sm:text-sm">Loading markets...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-[#71717a] text-xs sm:text-sm">
            {connectionStatus !== "connected" ? "Connecting to Deriv..." : "No markets available"}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.slice(0, 50).map((sym) => {
              const price = tickPrices.get(sym.symbol);
              return (
                <div
                  key={sym.symbol}
                  onClick={() => handleSelectSymbol(sym.symbol)}
                  className={`flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 transition-colors cursor-pointer min-h-[44px] ${
                    selectedSymbol === sym.symbol
                      ? "bg-[#6366f1]/5 border-l-2 border-[#6366f1]"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-medium text-xs sm:text-sm truncate">{sym.display_name}</p>
                    <p className="text-[10px] sm:text-xs text-[#71717a] truncate">
                      {sym.market_display_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {price != null && (
                      <span className="text-[10px] sm:text-xs font-medium tabular-nums text-[#a1a1aa]">
                        {price.toFixed(4)}
                      </span>
                    )}
                    {sym.is_trading_suspended ? (
                      <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-[#ff1744]/10 text-[#ff1744]">Suspended</span>
                    ) : sym.exchange_is_open ? (
                      <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-[#00e676]/10 text-[#00e676]">Open</span>
                    ) : (
                      <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/[0.05] text-[#71717a]">Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
