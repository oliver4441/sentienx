import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DERIV_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getAccountInfo(accessToken: string) {
  try {
    const res = await fetch(
      `${DERIV_CONFIG.apiBase}/trading/v1/options/authorize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Deriv-App-ID": String(DERIV_CONFIG.appId),
        },
        body: JSON.stringify({ authorize: accessToken }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.authorize || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("deriv_access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const accountInfo = await getAccountInfo(accessToken);
  const fullname = accountInfo?.fullname || "Trader";
  const currency = accountInfo?.currency || "USD";
  const balance = accountInfo?.balance || 0;
  const isVirtual = accountInfo?.is_virtual === 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {fullname.split(" ")[0]}
        </h1>
        <p className="text-sentienx-text-muted mt-1">
          {isVirtual ? "Demo Account" : "Real Account"} —{" "}
          <span className="text-sentienx-bull">Connected to Deriv</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Account Balance</p>
          <p className="text-2xl font-bold tabular-nums">{currency} {Number(balance).toFixed(2)}</p>
          <p className="text-sm mt-1 text-sentienx-text-dim">Live</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Open Positions</p>
          <p className="text-2xl font-bold tabular-nums">0</p>
          <p className="text-sm mt-1 text-sentienx-text-dim">No active trades</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Today&apos;s P&amp;L</p>
          <p className="text-2xl font-bold tabular-nums">{currency} 0.00</p>
          <p className="text-sm mt-1 text-sentienx-text-dim">0.00%</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Win Rate</p>
          <p className="text-2xl font-bold">—</p>
          <p className="text-sm mt-1 text-sentienx-text-dim">Start trading to see stats</p>
        </div>
      </div>

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
              <p className="text-xs text-sentienx-text-muted">Execute a new trade</p>
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
              <p className="text-xs text-sentienx-text-muted">Automated strategies</p>
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
              <p className="text-xs text-sentienx-text-muted">Learn &amp; improve</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
