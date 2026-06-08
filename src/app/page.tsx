import type { Metadata } from "next";
import Link from "next/link";
import { LandingStats } from "./stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sentienx — Deriv Trading Platform | Earn Up to 45% Commission",
  description:
    "Trade Deriv markets with a powerful, custom trading interface. Earn up to 45% affiliate commission, run automated bots, and manage your bankroll. Free to get started.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-white/[0.06] bg-[#070709]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-[#f4f4f5]">Sentienx</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-sm text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="flex items-center justify-center px-6 py-20 md:py-28">
          <div className="max-w-4xl text-center space-y-8">
            <div className="space-y-4">
              {/* Social proof badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-[#6366f1] font-medium">
                  Earn up to 45% commission on every trade
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#f4f4f5]">
                Trade{" "}
                <span className="text-[#6366f1]">Deriv</span>
                <br />
                Your Way
              </h1>
              <p className="text-lg md:text-xl text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed">
                A powerful trading platform with automated bots, real-time
                analytics, trading academy, and bankroll management — all in one
                place. Free to start earning.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <a
                href="/register"
                className="px-8 py-3 text-base font-medium rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-all hover:shadow-lg hover:shadow-[#6366f1]/25"
              >
                Start Trading Free
              </a>
              <a
                href="#earn"
                className="px-8 py-3 text-base font-medium rounded-xl border border-white/[0.06] hover:border-white/[0.12] text-[#f4f4f5] transition-colors"
              >
                Learn How to Earn
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 text-xs text-[#71717a]">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Free to sign up
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Connect Deriv account
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Instant access
              </span>
            </div>
          </div>
        </section>

        {/* Live Stats */}
        <LandingStats />

        {/* How You Earn Section */}
        <section id="earn" className="border-t border-white/[0.06] py-24 px-6 bg-gradient-to-b from-transparent to-[#6366f1]/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#f4f4f5] mb-4">
                Multiple Ways to Earn
              </h2>
              <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto">
                Sentienx gives you powerful tools to generate revenue from Deriv markets
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Affiliate Commissions */}
              <div className="rounded-2xl border border-[#6366f1]/20 p-8 bg-gradient-to-b from-[#6366f1]/5 to-transparent space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#f4f4f5]">Affiliate Commissions</h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  Refer traders to Sentienx and earn up to 45% of Deriv&apos;s net revenue
                  from their trading activity. Monthly payouts, no limits.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                    <span className="text-[#a1a1aa]">Revenue Share: up to 45%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                    <span className="text-[#a1a1aa]">Turnover: up to 1.5% of stake</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                    <span className="text-[#a1a1aa]">Master Partner: 20% of sub-partner commissions</span>
                  </div>
                </div>
              </div>

              {/* Markup Revenue */}
              <div className="rounded-2xl border border-white/[0.06] p-8 bg-white/[0.02] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#f4f4f5]">Markup Revenue</h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  Earn up to 3% markup on every trade your users execute.
                  Commission is automatically deducted from payouts — no invoicing needed.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[#a1a1aa]">Up to 3% per trade</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[#a1a1aa]">Fully automatic tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[#a1a1aa]">Set your own rate</span>
                  </div>
                </div>
              </div>

              {/* Master Partner */}
              <div className="rounded-2xl border border-white/[0.06] p-8 bg-white/[0.02] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#f4f4f5]">Master Partner</h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  Build a network of sub-partners and earn 20% of their commissions
                  on top of your own. Scale your earnings without limits.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span className="text-[#a1a1aa]">20% of sub-partner commissions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span className="text-[#a1a1aa]">Stack with your own earnings</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span className="text-[#a1a1aa]">Dedicated account manager</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-white/[0.06] py-24 px-6"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#f4f4f5] mb-16">
              Everything You Need to Trade
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.06] p-6 bg-white/[0.02] backdrop-blur-xl space-y-4 hover:border-white/[0.12] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                    {feature.iconSvg}
                  </div>
                  <h3 className="text-lg font-semibold text-[#f4f4f5]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-white/[0.06] py-24 px-6 bg-gradient-to-b from-[#6366f1]/[0.03] to-transparent">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#f4f4f5]">
              Start Earning Today
            </h2>
            <p className="text-lg text-[#a1a1aa] max-w-xl mx-auto">
              Connect your Deriv account in seconds. Start trading, referring,
              and earning commissions — all from one platform.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="/register"
                className="px-8 py-3 text-base font-medium rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-all hover:shadow-lg hover:shadow-[#6366f1]/25"
              >
                Get Started Free
              </a>
              <a
                href="/login"
                className="px-8 py-3 text-base font-medium rounded-xl border border-white/[0.06] hover:border-white/[0.12] text-[#f4f4f5] transition-colors"
              >
                Sign In
              </a>
            </div>
            <p className="text-xs text-[#71717a]">
              No credit card required. Connect your existing Deriv account or create a new one.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#6366f1] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="text-sm font-bold text-[#f4f4f5]">Sentienx</span>
              </div>
              <p className="text-xs text-[#71717a] leading-relaxed">
                Powered by Deriv. Trade responsibly. Trading involves significant risk.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#f4f4f5] mb-3">Platform</h4>
              <ul className="space-y-2 text-xs text-[#71717a]">
                <li><a href="#features" className="hover:text-[#a1a1aa] transition-colors">Features</a></li>
                <li><a href="/register" className="hover:text-[#a1a1aa] transition-colors">Get Started</a></li>
                <li><a href="/login" className="hover:text-[#a1a1aa] transition-colors">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#f4f4f5] mb-3">Earn</h4>
              <ul className="space-y-2 text-xs text-[#71717a]">
                <li><a href="#earn" className="hover:text-[#a1a1aa] transition-colors">Affiliate Program</a></li>
                <li><a href="#earn" className="hover:text-[#a1a1aa] transition-colors">Revenue Share</a></li>
                <li><a href="#earn" className="hover:text-[#a1a1aa] transition-colors">Markup Revenue</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#f4f4f5] mb-3">Support</h4>
              <ul className="space-y-2 text-xs text-[#71717a]">
                <li><a href="#" className="hover:text-[#a1a1aa] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#a1a1aa] transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#a1a1aa] transition-colors">API Docs</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#71717a]">
              © {new Date().getFullYear()} Sentienx. Powered by Deriv API.
            </p>
            <p className="text-xs text-[#71717a]">
              Trade responsibly. Deriv trading involves significant risk of loss.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Live Trading Dashboard",
    description:
      "Real-time charts, market data, and one-click trade execution. Everything you need on a single screen.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    title: "Automated Trading Bots",
    description:
      "Pre-built strategies for Rise/Fall, Digit Match, Even/Odd, and more. Configure and run bots with a click.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
  },
  {
    title: "Trading Academy",
    description:
      "Learn candlestick patterns, technical indicators, Fibonacci strategies, and risk management.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: "Bankroll Management",
    description:
      "Track your balance, set risk limits, and manage your trading capital with built-in tools.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
  {
    title: "Portfolio Analytics",
    description:
      "Detailed performance reports, win/loss ratios, and trade history with export options.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    title: "Multi-Revenue Model",
    description:
      "Earn from affiliate commissions, markup revenue, and master partner programs — all in one platform.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];
