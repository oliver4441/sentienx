"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { DERIV_CONFIG } from "@/lib/constants";

// Affiliate token types
interface AffiliatePlan {
  id: string;
  name: string;
  token: string;
  commission: string;
  description: string;
  rates: { tier: string; rate: string }[];
}

const AFFILIATE_PLANS: AffiliatePlan[] = [
  {
    id: "revenue_share",
    name: "Revenue Share",
    token: "2548C893-FA83-40F4-B2DE-23CA0323E77A",
    commission: "Up to 45%",
    description: "Earn a percentage of Deriv's net revenue from your referred clients' trading activity.",
    rates: [
      { tier: "$0 – $20,000 monthly net revenue", rate: "30%" },
      { tier: "Above $20,000 monthly net revenue", rate: "45%" },
    ],
  },
  {
    id: "turnover",
    name: "Turnover",
    token: "9A0642DD-82D8-4247-B788-BB1E6E1F9392",
    commission: "Up to 1.5%",
    description: "Earn based on your clients' trading volume and contract types.",
    rates: [
      { tier: "Digital Options", rate: "Up to 1.5% of stake" },
      { tier: "Multipliers", rate: "40% of Deriv's commission" },
      { tier: "Accumulators", rate: "40% of Deriv's commission" },
    ],
  },
  {
    id: "master",
    name: "Master Partner",
    token: "8D84947E-BB36-47A7-A09E-2FD6E49F682A",
    commission: "20% of sub-partner commissions",
    description: "Refer other partners and earn 20% of their commissions on top of your own.",
    rates: [
      { tier: "Sub-partner commission share", rate: "20%" },
      { tier: "Stacked with your own commissions", rate: "Yes" },
    ],
  },
];

export default function AffiliatePage() {
  const { accountInfo } = useAuth();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("revenue_share");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const generateOAuthUrl = (token: string, isRegistration = true) => {
    const baseUrl = window.location.origin;
    const redirectUri = `${baseUrl}/api/auth/deriv/callback`;
    const params = new URLSearchParams({
      app_id: DERIV_CONFIG.appId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "read trade payments admin",
      code_challenge: "PLACEHOLDER", // Generated server-side
      code_challenge_method: "S256",
      state: "PLACEHOLDER",
      t: token,
      utm_campaign: "sentienx",
      utm_medium: "affiliate",
      utm_source: "sentienx_platform",
    });
    if (isRegistration) {
      params.append("prompt", "registration");
    }
    return `https://oauth.deriv.com/oauth2/auth?${params.toString()}`;
  };

  const generateSignupUrl = (token: string) => {
    return `https://hub.deriv.com/tradershub/signup?t=${token}&utm_campaign=sentienx&utm_medium=affiliate&utm_source=sentienx_platform`;
  };

  const currency = accountInfo?.authorize?.currency || "USD";
  const balance = accountInfo?.authorize?.balance || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Affiliate Program</h1>
        <p className="text-sentienx-text-muted mt-1">
          Earn commissions by referring traders to Sentienx via Deriv
        </p>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Account Balance</p>
          <p className="text-2xl font-bold tabular-nums">
            {currency} {balance.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Revenue Share</p>
          <p className="text-2xl font-bold tabular-nums text-sentienx-bull">
            {currency} 0.00
          </p>
          <p className="text-xs text-sentienx-text-dim mt-1">Paid monthly on the 15th</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Markup Revenue</p>
          <p className="text-2xl font-bold tabular-nums text-sentienx-brand">
            {currency} 0.00
          </p>
          <p className="text-xs text-sentienx-text-dim mt-1">
            Current markup: {DERIV_CONFIG.markup}%
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-sentienx-text-muted mb-1">Referred Users</p>
          <p className="text-2xl font-bold tabular-nums">0</p>
          <p className="text-xs text-sentienx-text-dim mt-1">Active traders</p>
        </div>
      </div>

      {/* Commission Plans */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">Commission Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AFFILIATE_PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "bg-sentienx-brand/5 border-sentienx-brand"
                  : "bg-sentienx-bg border-sentienx-border hover:border-sentienx-border-hover"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sentienx-brand">{plan.name}</h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sentienx-brand/10 text-sentienx-brand">
                  {plan.commission}
                </span>
              </div>
              <p className="text-sm text-sentienx-text-muted mb-3">{plan.description}</p>
              <ul className="text-xs text-sentienx-text-dim space-y-1">
                {plan.rates.map((rate, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{rate.tier}</span>
                    <span className="text-sentienx-bull font-medium">{rate.rate}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Links Generator */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">Referral Links</h3>
        <p className="text-sm text-sentienx-text-muted">
          Share these links to refer new users. You&apos;ll earn commission on every trade they make.
        </p>

        {AFFILIATE_PLANS.filter((p) => p.id !== "master").map((plan) => (
          <div key={plan.id} className="space-y-3 p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{plan.name} Token</h4>
              <button
                onClick={() => copyToClipboard(plan.token, `token-${plan.id}`)}
                className="text-xs px-3 py-1 rounded-lg bg-sentienx-brand/10 text-sentienx-brand hover:bg-sentienx-brand/20 transition-colors"
              >
                {copiedToken === `token-${plan.id}` ? "✓ Copied!" : "Copy Token"}
              </button>
            </div>
            <div className="text-xs font-mono text-sentienx-text-dim break-all bg-black/20 p-2 rounded">
              {plan.token}
            </div>

            {/* Signup Link */}
            <div>
              <label className="text-xs text-sentienx-text-dim block mb-1">Direct Signup Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generateSignupUrl(plan.token)}
                  className="flex-1 bg-black/20 border border-sentienx-border rounded-lg px-3 py-2 text-xs font-mono text-sentienx-text-dim focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(generateSignupUrl(plan.token), `signup-${plan.id}`)}
                  className="px-3 py-2 rounded-lg bg-sentienx-brand text-white text-xs font-medium hover:bg-sentienx-brand-dark transition-colors shrink-0"
                >
                  {copiedToken === `signup-${plan.id}` ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* OAuth Link */}
            <div>
              <label className="text-xs text-sentienx-text-dim block mb-1">OAuth Login Link (for your platform)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generateOAuthUrl(plan.token)}
                  className="flex-1 bg-black/20 border border-sentienx-border rounded-lg px-3 py-2 text-xs font-mono text-sentienx-text-dim focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(generateOAuthUrl(plan.token), `oauth-${plan.id}`)}
                  className="px-3 py-2 rounded-lg bg-sentienx-brand text-white text-xs font-medium hover:bg-sentienx-brand-dark transition-colors shrink-0"
                >
                  {copiedToken === `oauth-${plan.id}` ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">How You Earn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              step: "1",
              title: "Share your referral link",
              desc: "Send your signup link to potential traders via social media, email, or your website.",
            },
            {
              step: "2",
              title: "Users sign up through Sentienx",
              desc: "When users connect their Deriv account through your link, they're tagged with your affiliate token.",
            },
            {
              step: "3",
              title: "They trade on Deriv markets",
              desc: "Your referred users trade Options, Multipliers, and other Deriv products through Sentienx.",
            },
            {
              step: "4",
              title: "You earn commission automatically",
              desc: "Deriv tracks all trading activity and calculates your commission. Paid monthly to your Deriv account.",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sentienx-brand/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-sentienx-brand">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-sentienx-text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Markup Info */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">Markup Commission</h3>
        <p className="text-sm text-sentienx-text-muted">
          In addition to affiliate commissions, you earn markup on every trade placed through Sentienx.
          The markup is automatically deducted from the user&apos;s potential payout.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <p className="text-xs text-sentienx-text-muted mb-1">Current Markup</p>
            <p className="text-xl font-bold text-sentienx-brand">{DERIV_CONFIG.markup}%</p>
          </div>
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <p className="text-xs text-sentienx-text-muted mb-1">Max Markup</p>
            <p className="text-xl font-bold">3%</p>
          </div>
          <div className="p-4 rounded-lg bg-sentienx-bg border border-sentienx-border">
            <p className="text-xs text-sentienx-text-muted mb-1">Example (10% markup on $100 payout)</p>
            <p className="text-xl font-bold text-sentienx-bull">+${(100 * DERIV_CONFIG.markup / 100).toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-sentienx-text-dim">
          To adjust markup, set the DERIV_MARKUP environment variable (0-3%).
        </p>
      </div>
    </div>
  );
}
