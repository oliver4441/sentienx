"use client";

import { useAuth } from "@/contexts/auth-context";

export default function EarningsPage() {
  const { accountInfo } = useAuth();
  const balance = accountInfo?.authorize?.balance || 0;
  const currency = accountInfo?.authorize?.currency || "USD";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-sentienx-text-muted mt-1">
          Track your affiliate commissions and trading revenue
        </p>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">
            Account Balance
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {currency} {balance.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">
            Referral Commission
          </p>
          <p className="text-2xl font-bold tabular-nums text-sentienx-bull">
            {currency} 0.00
          </p>
          <p className="text-xs text-sentienx-text-dim mt-1">
            Paid monthly on the 15th
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">
            Markup Revenue
          </p>
          <p className="text-2xl font-bold tabular-nums text-sentienx-brand">
            {currency} 0.00
          </p>
          <p className="text-xs text-sentienx-text-dim mt-1">
            From trade markups
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">
            Referred Users
          </p>
          <p className="text-2xl font-bold tabular-nums">0</p>
          <p className="text-xs text-sentienx-text-dim mt-1">
            Active traders
          </p>
        </div>
      </div>

      {/* Commission Plans */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">Commission Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <h4 className="font-medium text-sentienx-brand mb-2">
              Revenue Share
            </h4>
            <p className="text-sm text-sentienx-text-muted mb-2">
              Earn up to 45% of Deriv&apos;s net revenue from your referred
              clients&apos; trading activity.
            </p>
            <ul className="text-xs text-sentienx-text-dim space-y-1">
              <li>$0–$20,000 monthly net revenue: 30% commission</li>
              <li>Above $20,000 monthly net revenue: 45% commission</li>
              <li>Monthly payouts around the 15th</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <h4 className="font-medium text-sentienx-brand mb-2">Turnover</h4>
            <p className="text-sm text-sentienx-text-muted mb-2">
              Earn based on your clients&apos; trading volume and contract types.
            </p>
            <ul className="text-xs text-sentienx-text-dim space-y-1">
              <li>Digital Options: up to 1.5% of stake</li>
              <li>Multipliers: 40% of Deriv&apos;s commission</li>
              <li>Accumulators: 40% of Deriv&apos;s commission</li>
              <li>Monthly payouts around the 15th</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">How You Earn</h3>
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Users sign up through Sentienx",
              desc: "Every user who connects their Deriv account through your platform is tagged with your affiliate token.",
            },
            {
              step: "2",
              title: "They trade on Deriv markets",
              desc: "Your referred users trade Options, Multipliers, and other Deriv products through Sentienx.",
            },
            {
              step: "3",
              title: "You earn commission automatically",
              desc: "Deriv tracks all trading activity and calculates your commission. Paid monthly to your Deriv account.",
            },
            {
              step: "4",
              title: "Scale with Master Partner",
              desc: "Refer other partners and earn 20% of their commissions on top of your own.",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sentienx-brand/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-sentienx-brand">
                  {item.step}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-sentienx-text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
