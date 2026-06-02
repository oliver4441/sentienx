import type { Metadata } from "next";
import Link from "next/link";
import { LandingStats } from "./stats";

export const metadata: Metadata = {
  title: "Sentienx — Deriv Trading Platform",
  description:
    "Trade Deriv markets with a powerful, custom trading interface. Automated bots, trading academy, and bankroll management.",
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
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#f4f4f5]">
              Trade{" "}
              <span className="text-[#6366f1]">Deriv</span>
              <br />
              Your Way
            </h1>
            <p className="text-lg md:text-xl text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed">
              A powerful trading platform with automated bots, real-time
              analytics, trading academy, and bankroll management — all in one
              place.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/login"
              className="px-8 py-3 text-base font-medium rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-all hover:shadow-lg hover:shadow-[#6366f1]/25"
            >
              Start Trading
            </a>
            <a
              href="#features"
              className="px-8 py-3 text-base font-medium rounded-xl border border-white/[0.06] hover:border-white/[0.12] text-[#f4f4f5] transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </main>

      {/* Live Stats */}
      <LandingStats />

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

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#6366f1] flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-sm text-[#71717a]">Sentienx v1.0</span>
          </div>
          <p className="text-xs text-[#71717a]">
            Trade responsibly. Deriv trading involves significant risk.
          </p>
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
    title: "Earn Commissions",
    description:
      "Refer traders to Sentienx and earn up to 45% commission on their trading activity through Deriv.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];
