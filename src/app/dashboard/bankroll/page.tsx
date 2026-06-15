"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function BankrollPage() {
  const { accountInfo } = useAuth();
  const [dailyTarget, setDailyTarget] = useState(100);
  const [maxLoss, setMaxLoss] = useState(50);
  const [riskPerTrade, setRiskPerTrade] = useState(2);

  const balance = accountInfo?.authorize?.balance || 0;
  const currency = accountInfo?.authorize?.currency || "USD";
  const riskAmount = (balance * riskPerTrade) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bankroll Management</h1>
        <p className="text-sentienx-text-muted mt-1">
          Manage your trading capital and risk
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">
            Current Balance
          </p>
          <p className="text-3xl font-bold tabular-nums">
            {currency} {balance.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Daily Target</p>
          <p className="text-3xl font-bold tabular-nums text-sentienx-bull">
            {currency} {dailyTarget.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Max Daily Loss</p>
          <p className="text-3xl font-bold tabular-nums text-sentienx-bear">
            {currency} {maxLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Risk Settings */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">Risk Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-sentienx-text-muted block mb-1">
              Risk Per Trade: {riskPerTrade}%
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(Number(e.target.value))}
              className="w-full accent-sentienx-brand"
            />
            <div className="flex justify-between text-xs text-sentienx-text-dim">
              <span>1% (Conservative)</span>
              <span>10% (Aggressive)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-sentienx-text-muted block mb-1">
                Daily Target ({currency})
              </label>
              <input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand"
              />
            </div>
            <div>
              <label className="text-sm text-sentienx-text-muted block mb-1">
                Max Daily Loss ({currency})
              </label>
              <input
                type="number"
                value={maxLoss}
                onChange={(e) => setMaxLoss(Number(e.target.value))}
                className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Calculator */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">Risk Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <p className="text-xs text-sentienx-text-muted mb-1">
              Risk Amount ({riskPerTrade}% of balance)
            </p>
            <p className="text-xl font-bold tabular-nums">
              {currency} {riskAmount.toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <p className="text-xs text-sentienx-text-muted mb-1">
              Suggested Stake
            </p>
            <p className="text-xl font-bold tabular-nums text-sentienx-brand">
              {currency} {(riskAmount / 2).toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <p className="text-xs text-sentienx-text-muted mb-1">
              Trades Until Target
            </p>
            <p className="text-xl font-bold tabular-nums text-sentienx-bull">
              {riskAmount > 0 ? Math.ceil(dailyTarget / (riskAmount * 0.8)) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Trade Journal Placeholder */}
      <div className="stat-card">
        <h3 className="font-semibold mb-4">Trade Journal</h3>
        <div className="text-center py-8 text-sentienx-text-dim text-sm">
          <p>Track your daily trades and performance</p>
          <p className="text-xs mt-1">
            Journal entries will appear here as you trade
          </p>
        </div>
      </div>
    </div>
  );
}
