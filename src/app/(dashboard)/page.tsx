"use client";

import { useAuth } from "@/contexts/auth-context";
import { useDerivWS } from "@/hooks/use-deriv-ws";

function StatCard({
  label,
  value,
  change,
  changeType,
}: {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="stat-card">
      <p className="text-sm text-sentienx-text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {change && (
        <p
          className={`text-sm mt-1 ${
            changeType === "positive"
              ? "text-sentienx-bull"
              : changeType === "negative"
              ? "text-sentienx-bear"
              : "text-sentienx-text-dim"
          }`}
        >
          {change}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { accountInfo } = useAuth();
  const { connectionStatus, lastTick } = useDerivWS({ autoConnect: true });

  const balance = accountInfo?.authorize?.balance || 0;
  const currency = accountInfo?.authorize?.currency || "USD";
  const fullname = accountInfo?.authorize?.fullname || "Trader";
  const isVirtual = accountInfo?.authorize?.is_virtual === 1;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {fullname.split(" ")[0]}
        </h1>
        <p className="text-sentienx-text-muted mt-1">
          {isVirtual ? "Demo Account" : "Real Account"} —{" "}
          {connectionStatus === "connected" ? (
            <span className="text-sentienx-bull">Connected to Deriv</span>
          ) : (
            <span className="text-sentienx-text-dim">Connecting...</span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Account Balance"
          value={`${currency} ${balance.toFixed(2)}`}
          change="Live"
          changeType="neutral"
        />
        <StatCard
          label="Open Positions"
          value="0"
          change="No active trades"
          changeType="neutral"
        />
        <StatCard
          label="Today's P&L"
          value={`${currency} 0.00`}
          change="0.00%"
          changeType="neutral"
        />
        <StatCard
          label="Win Rate"
          value="—"
          change="Start trading to see stats"
          changeType="neutral"
        />
      </div>

      {/* Live Ticker */}
      {lastTick && (
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sentienx-text-muted">Live Tick</p>
              <p className="text-lg font-semibold tabular-nums">
                {lastTick.tick?.symbol}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">
                {lastTick.tick?.quote?.toFixed(lastTick.tick?.pip_size || 2)}
              </p>
              <p className="text-xs text-sentienx-text-dim">
                Bid: {lastTick.tick?.bid?.toFixed(2)} | Ask:{" "}
                {lastTick.tick?.ask?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/dashboard/trade"
          className="stat-card hover:border-sentienx-brand/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sentienx-brand/10 flex items-center justify-center group-hover:bg-sentienx-brand/20 transition-colors">
              <svg className="w-5 h-5 text-sentienx-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Start Trading</p>
              <p className="text-xs text-sentienx-text-muted">
                Execute a new trade
              </p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/bots"
          className="stat-card hover:border-sentienx-brand/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sentienx-brand/10 flex items-center justify-center group-hover:bg-sentienx-brand/20 transition-colors">
              <svg className="w-5 h-5 text-sentienx-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Run a Bot</p>
              <p className="text-xs text-sentienx-text-muted">
                Automated strategies
              </p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/academy"
          className="stat-card hover:border-sentienx-brand/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sentienx-brand/10 flex items-center justify-center group-hover:bg-sentienx-brand/20 transition-colors">
              <svg className="w-5 h-5 text-sentienx-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Trading Academy</p>
              <p className="text-xs text-sentienx-text-muted">
                Learn & improve
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="stat-card">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-12 text-sentienx-text-dim">
          <p className="text-sm">No recent activity</p>
          <p className="text-xs mt-1">
            Your trades and bot runs will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
