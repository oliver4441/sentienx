"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDerivWS } from "@/hooks/use-deriv-ws";
import { TradingChart } from "@/components/charts/trading-chart";
import type { DerivActiveSymbol, DerivTick } from "@/types/deriv";
import type { CandlestickData, Time } from "lightweight-charts";

const MARKET_GROUPS = [
  { key: "synthetic_index", label: "Synthetic Indices" },
  { key: "forex", label: "Forex" },
  { key: "commodities", label: "Commodities" },
  { key: "cryptocurrency", label: "Crypto" },
];

// Generate mock candlestick data for demo (replace with real WS ticks)
function generateMockCandles(count: number): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  let time = Math.floor(Date.now() / 1000) - count * 60;
  let price = 50 + Math.random() * 50;

  for (let i = 0; i < count; i++) {
    const open = price;
    const change = (Math.random() - 0.48) * 2;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 1;
    const low = Math.min(open, close) - Math.random() * 1;

    data.push({
      time: (time + i * 60) as Time,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
    });

    price = close;
  }

  return data;
}

export default function MarketsPage() {
  const { send, connectionStatus, lastTick } = useDerivWS({ autoConnect: true });
  const [symbols, setSymbols] = useState<DerivActiveSymbol[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("synthetic_index");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickData, setTickData] = useState<CandlestickData<Time>[]>([]);

  useEffect(() => {
    if (connectionStatus === "connected") {
      send({ active_symbols: "brief", product_type: "basic" } as any)
        .then((data: any) => {
          setSymbols(data.active_symbols || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [connectionStatus, send]);

  // Generate initial mock data when symbol is selected
  useEffect(() => {
    if (selectedSymbol && tickData.length === 0) {
      setTickData(generateMockCandles(100));
    }
  }, [selectedSymbol, tickData.length]);

  // Update chart with live tick
  useEffect(() => {
    if (!lastTick?.tick || !selectedSymbol) return;
    const tick = lastTick.tick;
    if (tick.symbol !== selectedSymbol) return;

    setTickData((prev) => {
      if (prev.length === 0) return prev;
      const lastCandle = { ...prev[prev.length - 1] };
      const quote = tick.quote || 0;

      // Update the last candle's close price
      lastCandle.close = Number(quote.toFixed(4));
      if (quote > lastCandle.high) lastCandle.high = lastCandle.close;
      if (quote < lastCandle.low) lastCandle.low = lastCandle.close;

      return [...prev.slice(0, -1), lastCandle];
    });
  }, [lastTick, selectedSymbol]);

  const filtered = useMemo(
    () =>
      symbols.filter(
        (s) => s.market === selectedGroup || s.subgroup === selectedGroup
      ),
    [symbols, selectedGroup]
  );

  const handleSelectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setTickData(generateMockCandles(100));
  }, []);

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
          <TradingChart
            symbol={selectedSymbol}
            data={tickData}
            height={380}
          />
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
