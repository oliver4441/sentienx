import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DERIV_CONFIG } from "@/lib/constants";
import Link from "next/link";
import { DemoStats } from "@/components/demo-stats";

export const dynamic = "force-dynamic";

async function getAccountInfo(accessToken: string) {
  try {
    const res = await fetch(`${DERIV_CONFIG.apiBase}/trading/v1/options/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Deriv-App-ID": String(DERIV_CONFIG.appId),
      },
      body: JSON.stringify({ authorize: accessToken }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.authorize || null;
    }
  } catch { /* ignore */ }
  return null;
}

async function getPortfolio(accessToken: string) {
  try {
    const res = await fetch(`${DERIV_CONFIG.apiBase}/trading/v1/options/portfolio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Deriv-App-ID": String(DERIV_CONFIG.appId),
      },
      body: JSON.stringify({ portfolio: 1 }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.portfolio || null;
    }
  } catch { /* ignore */ }
  return null;
}

async function getTransactions(accessToken: string) {
  try {
    const res = await fetch(`${DERIV_CONFIG.apiBase}/trading/v1/options/transaction_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Deriv-App-ID": String(DERIV_CONFIG.appId),
      },
      body: JSON.stringify({ transaction_history: 1, count: 50 }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.transactions || [];
    }
  } catch { /* ignore */ }
  return [];
}

const MARKET_SYMBOLS = ["R_100", "R_75", "R_50", "R_25", "R_10"];
const MARKET_LABELS: Record<string, string> = {
  R_100: "Volatility 100",
  R_75: "Volatility 75",
  R_50: "Volatility 50",
  R_25: "Volatility 25",
  R_10: "Volatility 10",
};

async function getMarketData() {
  try {
    const results = await Promise.all(
      MARKET_SYMBOLS.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://api.derivws.com/trading/v1/options/ticks?ticks_history=${symbol}&count=2&end=latest`
          );
          if (!res.ok) return { symbol, label: MARKET_LABELS[symbol], error: true };
          const data = await res.json();
          const ticks = data.history?.prices || [];
          const current = ticks[ticks.length - 1];
          const previous = ticks[ticks.length - 2];
          const change = previous ? ((current - previous) / previous) * 100 : 0;
          return {
            symbol,
            label: MARKET_LABELS[symbol],
            price: current || 0,
            change: change,
            up: change >= 0,
          };
        } catch {
          return { symbol, label: MARKET_LABELS[symbol], error: true };
        }
      })
    );
    return results;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("deriv_access_token")?.value;
  const isDemo = cookieStore.get("sentienx_demo")?.value === "true";

  if (!accessToken) {
    redirect("/login");
  }

  const accountInfo = isDemo ? null : await getAccountInfo(accessToken);
  const fullname = accountInfo?.fullname || "Trader";
  const currency = accountInfo?.currency || "USD";
  const balance = accountInfo?.balance || (isDemo ? 10000 : 0);
  const isVirtual = isDemo || accountInfo?.is_virtual === 1;
  const marketData = await getMarketData();

  // Fetch real portfolio data for non-demo users
  let openPositions = 0;
  let todayPnL = 0;
  let todayWins = 0;
  let todayLosses = 0;
  let recentActivity: Array<{ type: string; amount: number; description: string; time: number }> = [];

  if (!isDemo && accessToken) {
    const portfolio = await getPortfolio(accessToken);
    if (portfolio?.contracts) {
      openPositions = portfolio.contracts.length;
    }

    const transactions = await getTransactions(accessToken);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(todayStart.getTime() / 1000);

    for (const tx of transactions) {
      if (tx.transaction_time >= todayTimestamp) {
        const amount = tx.amount || 0;
        if (amount > 0) {
          todayWins++;
          todayPnL += amount;
        } else if (amount < 0) {
          todayLosses++;
          todayPnL += amount; // amount is negative
        }
      }
      // Build recent activity
      if (recentActivity.length < 5) {
        const txAmount = tx.amount || 0;
        recentActivity.push({
          type: txAmount > 0 ? "win" : txAmount < 0 ? "loss" : "info",
          amount: Math.abs(txAmount),
          description: tx.longcode || tx.action_type || "Transaction",
          time: tx.transaction_time || tx.purchase_time || 0,
        });
      }
    }
  }

  const winRate = (todayWins + todayLosses) > 0
    ? ((todayWins / (todayWins + todayLosses)) * 100).toFixed(1)
    : null;

  const quickActions = [
    {
      href: "/dashboard/trade",
      title: "Start Trading",
      description: "Execute a new trade",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      color: "from-[#6366f1] to-[#818cf8]",
      iconBg: "bg-[#6366f1]/10",
      iconColor: "text-[#6366f1]",
    },
    {
      href: "/dashboard/bots",
      title: "Run a Bot",
      description: "Automated strategies",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
        </svg>
      ),
      color: "from-emerald-500 to-emerald-400",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      href: "/dashboard/academy",
      title: "Trading Academy",
      description: "Learn and improve",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      color: "from-amber-500 to-amber-400",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
    {
      href: "/dashboard/affiliate",
      title: "Affiliate Hub",
      description: "Earn commissions",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: "from-pink-500 to-pink-400",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-400",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, <span className="text-[#6366f1]">{fullname.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            {isVirtual ? "Demo Account" : "Real Account"} —{" "}
            <span className="text-[#00e676]">Connected to Deriv</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/trade"
            className="btn-primary text-sm"
          >
            New Trade
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      {isDemo ? (
        <DemoStats isDemo={isDemo} currency={currency} />
      ) : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Balance</p>
            <div className="w-2 h-2 rounded-full bg-[#00e676] pulse-dot" />
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {currency} {Number(balance).toFixed(2)}
          </p>
          <p className="text-xs text-[#71717a] mt-1">Available</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Open Positions</p>
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{openPositions}</p>
          <p className="text-xs text-[#71717a] mt-1">{openPositions > 0 ? "Active trades" : "No active trades"}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Today's P&L</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums tracking-tight ${todayPnL >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
            {todayPnL >= 0 ? "+" : ""}{currency} {todayPnL.toFixed(2)}
          </p>
          <p className="text-xs text-[#71717a] mt-1">
            {todayWins + todayLosses > 0
              ? `${todayWins}W / ${todayLosses}L today`
              : "No trades today"}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Win Rate</p>
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{winRate || "—"}</p>
          <p className="text-xs text-[#71717a] mt-1">{winRate ? "% today" : "Start trading"}</p>
        </div>
      </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="stat-card group hover:border-white/[0.15] transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <span className={action.iconColor}>{action.icon}</span>
              </div>
              <p className="font-semibold text-sm text-[#f4f4f5]">{action.title}</p>
              <p className="text-xs text-[#71717a] mt-0.5">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Market overview + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market overview */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">Market Overview</h2>
            <Link href="/dashboard/markets" className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {marketData.filter(m => !m.error).map((market) => (
              <div key={market.symbol} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    market.up ? "bg-[#00e676]/10 text-[#00e676]" : "bg-[#ff1744]/10 text-[#ff1744]"
                  }`}>
                    {market.symbol.replace("R_", "")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f4f4f5]">{market.label}</p>
                    <p className="text-xs text-[#71717a] tabular-nums">{market.price?.toFixed(2)}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium tabular-nums ${market.up ? "text-[#00e676]" : "text-[#ff1744]"}`}>
                  {(market.change ?? 0) >= 0 ? "+" : ""}{(market.change ?? 0).toFixed(2)}%
                </span>
              </div>
            ))}
            {marketData.length === 0 && (
              <div className="text-center py-6 text-sm text-[#71717a]">Loading market data...</div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">Recent Activity</h2>
            <Link href="/dashboard/history" className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors">
              View all
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activity.type === "win" ? "bg-[#00e676]/10" : activity.type === "loss" ? "bg-[#ff1744]/10" : "bg-[#6366f1]/10"
                    }`}>
                      <span className={`text-xs font-bold ${
                        activity.type === "win" ? "text-[#00e676]" : activity.type === "loss" ? "text-[#ff1744]" : "text-[#818cf8]"
                      }`}>
                        {activity.type === "win" ? "+" : activity.type === "loss" ? "-" : "i"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f4f4f5] truncate max-w-[200px]">{activity.description}</p>
                      <p className="text-xs text-[#71717a]">{new Date(activity.time * 1000).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${
                    activity.type === "win" ? "text-[#00e676]" : activity.type === "loss" ? "text-[#ff1744]" : "text-[#a1a1aa]"
                  }`}>
                    {activity.type === "win" ? "+" : activity.type === "loss" ? "-" : ""}${activity.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-sm text-[#a1a1aa]">No recent activity</p>
              <p className="text-xs text-[#71717a] mt-1">Your trades will appear here</p>
              <Link href="/dashboard/trade" className="mt-4 text-xs font-medium text-[#6366f1] hover:text-[#818cf8] transition-colors">
                Place your first trade
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
