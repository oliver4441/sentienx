"use client";

import { useState } from "react";
import { useDerivWS } from "@/hooks/use-deriv-ws";

export default function HistoryPage() {
  const { send, connectionStatus } = useDerivWS({ autoConnect: true });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result: any = await send({
        transaction_history: 1,
        limit: 50,
      });
      setTransactions(result?.transaction_history?.transactions || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trade History</h1>
          <p className="text-sentienx-text-muted mt-1">
            Your past trades and transactions
          </p>
        </div>
        <button
          onClick={loadHistory}
          disabled={loading || connectionStatus !== "connected"}
          className="px-4 py-2 rounded-lg bg-sentienx-brand text-white text-sm font-medium hover:bg-sentienx-brand-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load History"}
        </button>
      </div>

      <div className="stat-card overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-sentienx-text-dim">
            <p className="text-sm">No transaction history</p>
            <p className="text-xs mt-1">
              Click &quot;Load History&quot; to fetch your trades
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sentienx-border">
            {transactions.map((tx: any, i: number) => (
              <div
                key={tx.transaction_id || i}
                className="flex items-center justify-between py-3 px-4"
              >
                <div>
                  <p className="text-sm font-medium">{tx.longcode}</p>
                  <p className="text-xs text-sentienx-text-dim">
                    {new Date(tx.transaction_time * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium tabular-nums ${
                      tx.amount >= 0 ? "text-sentienx-bull" : "text-sentienx-bear"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    ${tx.amount?.toFixed(2)}
                  </p>
                  <p className="text-xs text-sentienx-text-dim">
                    Balance: ${tx.balance_after?.toFixed(2)}
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
