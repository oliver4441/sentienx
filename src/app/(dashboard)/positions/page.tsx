"use client";

import { useDerivWS } from "@/hooks/use-deriv-ws";

export default function PositionsPage() {
  const { portfolio, connectionStatus } = useDerivWS({ autoConnect: true });
  const contracts = portfolio?.portfolio?.contracts || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Open Positions</h1>
        <p className="text-sentienx-text-muted mt-1">
          Monitor your active trades
        </p>
      </div>

      <div className="stat-card overflow-hidden">
        {connectionStatus !== "connected" ? (
          <div className="text-center py-12 text-sentienx-text-dim">
            Connecting to Deriv...
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12 text-sentienx-text-dim">
            <p className="text-sm">No open positions</p>
            <p className="text-xs mt-1">
              Your active trades will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sentienx-border">
            {contracts.map((contract: any) => (
              <div
                key={contract.contract_id}
                className="flex items-center justify-between py-4 px-4"
              >
                <div>
                  <p className="font-medium text-sm">{contract.longcode}</p>
                  <p className="text-xs text-sentienx-text-dim">
                    {contract.symbol} — {contract.contract_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">
                    ${contract.buy_price?.toFixed(2)}
                  </p>
                  <p
                    className={`text-xs tabular-nums ${
                      (contract.bid_price || 0) >= (contract.buy_price || 0)
                        ? "text-sentienx-bull"
                        : "text-sentienx-bear"
                    }`}
                  >
                    {contract.bid_price?.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
