"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DemoState {
  balance: number;
  trades: Array<{
    contract_id: number;
    buy_price: number;
    payout: number;
    profit: number;
    balance_after: number;
    symbol: string;
    contractType: string;
    timestamp: number;
  }>;
  totalWins: number;
  totalLosses: number;
  todayWins: number;
  todayLosses: number;
  todayPnL: number;
}

const DEMO_STORAGE_KEY = "sentienx_demo_state";

function loadDemoState(): DemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

interface DemoStatsProps {
  isDemo: boolean;
  currency: string;
}

export function DemoStats({ isDemo, currency }: DemoStatsProps) {
  const [demoState, setDemoState] = useState<DemoState | null>(null);

  useEffect(() => {
    if (!isDemo) return;
    setDemoState(loadDemoState());

    // Listen for storage changes from other tabs/pages
    const handler = () => setDemoState(loadDemoState());
    window.addEventListener("storage", handler);

    // Also poll periodically since same-page changes don't trigger storage events
    const interval = setInterval(handler, 1000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, [isDemo]);

  if (!isDemo || !demoState) return null;

  const totalTrades = demoState.totalWins + demoState.totalLosses;
  const winRate = totalTrades > 0
    ? ((demoState.totalWins / totalTrades) * 100).toFixed(1)
    : null;

  const recentTrades = demoState.trades.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Balance */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Balance</p>
            <div className="w-2 h-2 rounded-full bg-purple-400 pulse-dot" />
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {currency} {demoState.balance.toFixed(2)}
          </p>
          <p className="text-xs text-[#71717a] mt-1">
            {demoState.balance < 10000 ? (
              <span className="text-[#ff1744]">
                -${(10000 - demoState.balance).toFixed(2)} from start
              </span>
            ) : demoState.balance > 10000 ? (
              <span className="text-[#00e676]">
                +${(demoState.balance - 10000).toFixed(2)} from start
              </span>
            ) : (
              "Virtual funds"
            )}
          </p>
        </div>

        {/* Total Trades */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Total Trades</p>
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{totalTrades}</p>
          <p className="text-xs text-[#71717a] mt-1">
            {demoState.totalWins}W / {demoState.totalLosses}L overall
          </p>
        </div>

        {/* Today's P&L */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Today's P&L</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums tracking-tight ${demoState.todayPnL >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
            {demoState.todayPnL >= 0 ? "+" : ""}{currency} {demoState.todayPnL.toFixed(2)}
          </p>
          <p className="text-xs text-[#71717a] mt-1">
            {demoState.todayWins + demoState.todayLosses > 0
              ? `${demoState.todayWins}W / ${demoState.todayLosses}L today`
              : "No trades today"}
          </p>
        </div>

        {/* Win Rate */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Win Rate</p>
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{winRate || "—"}</p>
          <p className="text-xs text-[#71717a] mt-1">{winRate ? "% overall" : "Start trading"}</p>
        </div>
      </div>

      {/* Recent trades activity */}
      {recentTrades.length > 0 && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">Recent Activity</h2>
            <Link href="/dashboard/trade" className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors">
              Trade now
            </Link>
          </div>
          <div className="space-y-2">
            {recentTrades.map((trade, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    trade.profit >= 0 ? "bg-[#00e676]/10" : "bg-[#ff1744]/10"
                  }`}>
                    <span className={`text-xs font-bold ${
                      trade.profit >= 0 ? "text-[#00e676]" : "text-[#ff1744]"
                    }`}>
                      {trade.profit >= 0 ? "+" : "-"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f4f4f5]">
                      {trade.contractType === "CALL" ? "Rise" : trade.contractType === "PUT" ? "Fall" : trade.contractType} on {trade.symbol}
                    </p>
                    <p className="text-xs text-[#71717a]">
                      {new Date(trade.timestamp).toLocaleTimeString()} • Stake: ${trade.buy_price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold tabular-nums ${
                    trade.profit >= 0 ? "text-[#00e676]" : "text-[#ff1744]"
                  }`}>
                    {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-[#71717a] tabular-nums">
                    Bal: ${trade.balance_after.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
