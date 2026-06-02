"use client";

import { useState, useEffect } from "react";
import { useDerivWS } from "@/hooks/use-deriv-ws";
import type { DerivActiveSymbol } from "@/types/deriv";

const MARKET_GROUPS = [
  { key: "synthetic_index", label: "Synthetic Indices" },
  { key: "forex", label: "Forex" },
  { key: "commodities", label: "Commodities" },
  { key: "cryptocurrency", label: "Cryptocurrency" },
];

export default function MarketsPage() {
  const { send, connectionStatus } = useDerivWS({ autoConnect: true });
  const [symbols, setSymbols] = useState<DerivActiveSymbol[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("synthetic_index");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connectionStatus === "connected") {
      send({ active_symbols: "brief", product_type: "basic" })
        .then((data: any) => {
          setSymbols(data.active_symbols || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [connectionStatus, send]);

  const filtered = symbols.filter(
    (s) => s.market === selectedGroup || s.subgroup === selectedGroup
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-sentienx-text-muted mt-1">
          Browse available trading instruments
        </p>
      </div>

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

      {/* Symbols Table */}
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
                className="flex items-center justify-between py-3 px-4 hover:bg-sentienx-sidebar-hover transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-medium text-sm">{symbol.display_name}</p>
                  <p className="text-xs text-sentienx-text-dim">
                    {symbol.market_display_name} — {symbol.submarket_display_name}
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
