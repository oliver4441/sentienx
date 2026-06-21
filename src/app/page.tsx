import type { Metadata } from "next";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/navbar";
import { LiveTicker } from "@/components/landing/ticker";
import { Testimonials } from "@/components/landing/testimonials";
import { CourseSection } from "@/components/landing/course";
import { LandingStats } from "./stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sentienx — Deriv Trading Platform | Automated Bots & Live Charts",
  description:
    "Trade Deriv markets with a powerful, custom trading interface. Run automated bots, view live charts, and manage your bankroll. Free to get started.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070709]">
      <LiveTicker />
      <LandingNavbar />

      {/* Hero */}
      <main className="flex-1">
        <section className="relative flex items-center justify-center px-6 py-24 md:py-32 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#6366f1_0%,_transparent_50%)] opacity-[0.06]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#6366f1]/[0.03] rounded-full blur-[120px]" />

          <div className="relative max-w-4xl text-center space-y-8 fade-in-up">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#6366f1]/[0.08] border border-[#6366f1]/15">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              <span className="text-sm text-[#818cf8] font-medium">
                Earn up to 45% commission on every trade
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#f4f4f5] leading-[1.1]">
                Trade{" "}
                <span className="text-[#6366f1]">Deriv</span>
                <br />
                <span className="bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#6366f1] bg-clip-text text-transparent">
                  Your Way
                </span>
              </h1>
              <p className="text-lg md:text-xl text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed">
                The all-in-one Deriv trading platform — automated bots, real-time
                analytics, trading academy, and bankroll management.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <a href="/register" className="btn-primary text-base px-8 py-4">
                Start Trading Free
              </a>
              <a href="#course" className="btn-secondary text-base px-8 py-4">
                Explore Academy
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 text-xs text-[#71717a]">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#00e676]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Free to sign up
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#00e676]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Connect Deriv account
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#00e676]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Instant access
              </span>
            </div>
          </div>
        </section>

        <LandingStats />

        {/* How You Earn */}
        <section id="earn" className="border-t border-white/[0.06] py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#6366f1] uppercase tracking-wider mb-3">Revenue</p>
              <h2 className="text-3xl md:text-5xl font-bold text-[#f4f4f5] mb-4 tracking-tight">
                Multiple Ways to Earn
              </h2>
              <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto">
                  Sentienx gives you professional-grade tools to trade Deriv markets — bots, charts, analytics, and bankroll management.
                </p>

              <div className="grid md:grid-cols-3 gap-5">
                {/* Automated Bots */}
                <div className="gradient-border">
                  <div className="rounded-2xl p-8 space-y-5 bg-[#0f0f14]">
                    <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#f4f4f5]">Automated Trading Bots</h3>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">
                      Math-first confluence engine with 7-signal analysis, Kelly Criterion sizing, and regime-adaptive strategies.
                    </p>
                    <div className="space-y-2.5 pt-2">
                      {["7-signal confluence scoring", "Kelly Criterion position sizing", "Circuit breaker protection"].map((item) => (
                        <div key={item} className="flex items-center gap-2.5 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] shrink-0" />
                          <span className="text-[#a1a1aa]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Charts */}
                <div className="stat-card">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                    <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#f4f4f5] mb-3">Live Market Charts</h3>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed mb-5">
                    Real-time candlestick charts with multiple timeframes. Powered by Deriv's WebSocket API for instant data.
                  </p>
                  <div className="space-y-2.5">
                    {["Real-time tick data", "Multiple timeframes (1m to 1d)", "Candlestick + tick charts"].map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-[#a1a1aa]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bankroll Management */}
                <div className="stat-card">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5">
                    <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#f4f4f5] mb-3">Bankroll Management</h3>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed mb-5">
                    Track your balance, set risk limits, and manage your trading capital with built-in tools.
                  </p>
                  <div className="space-y-2.5">
                    {["Real-time balance tracking", "Daily loss limits", "Drawdown protection"].map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-[#a1a1aa]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Testimonials />

        {/* Features */}
        <section id="features" className="border-t border-white/[0.06] py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#6366f1] uppercase tracking-wider mb-3">Platform</p>
              <h2 className="text-3xl md:text-5xl font-bold text-[#f4f4f5] mb-4 tracking-tight">
                Everything You Need to Trade
              </h2>
              <p className="text-lg text-[#a1a1aa] max-w-xl mx-auto">
                A complete Deriv trading workspace — bots, charts, analytics, academy, and bankroll management in one platform.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`stat-card fade-in-up stagger-${i + 1}`}
                  style={{ opacity: 0 }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center mb-4`}>
                    {feature.iconSvg}
                  </div>
                  <h3 className="text-lg font-semibold text-[#f4f4f5] mb-2">
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

        <CourseSection />

        {/* Final CTA */}
        <section className="border-t border-white/[0.06] py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_#6366f1_0%,_transparent_60%)] opacity-[0.06]" />
          <div className="relative max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-[#f4f4f5] tracking-tight">
              Start Earning Today
            </h2>
            <p className="text-lg text-[#a1a1aa] max-w-xl mx-auto">
              Connect your Deriv account in seconds. Start trading, referring, and earning commissions — all from one platform.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="/register" className="btn-primary text-base px-8 py-4">
                Get Started Free
              </a>
              <a href="/login" className="btn-secondary text-base px-8 py-4">
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
                <img src="/logo.jpg" alt="Sentienx" className="w-6 h-6 rounded-md" />
                <span className="text-sm font-bold text-[#f4f4f5]">Sentienx</span>
              </div>
              <p className="text-xs text-[#71717a] leading-relaxed">
                Powered by Deriv. Trade responsibly. Trading involves significant risk.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#f4f4f5] mb-3">Platform</h4>
              <ul className="space-y-2.5 text-xs text-[#71717a]">
                <li><a href="#features" className="hover:text-[#a1a1aa] transition-colors">Features</a></li>
                <li><a href="/register" className="hover:text-[#a1a1aa] transition-colors">Get Started</a></li>
                <li><a href="/login" className="hover:text-[#a1a1aa] transition-colors">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#f4f4f5] mb-3">Support</h4>
              <ul className="space-y-2.5 text-xs text-[#71717a]">
                <li><a href="#" className="hover:text-[#a1a1aa] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#a1a1aa] transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#a1a1aa] transition-colors">Telegram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#71717a]">
              &copy; {new Date().getFullYear()} Sentienx. Powered by Deriv API.
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
    description: "Real-time charts, market data, and one-click trade execution. Everything you need on a single screen.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Automated Trading Bots",
    description: "Pre-built strategies for Rise/Fall, Digit Match, Even/Odd, and more. Configure and run bots with a click.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
  },
  {
    title: "Trading Academy",
    description: "Learn candlestick patterns, technical indicators, Fibonacci strategies, and risk management.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: "Bankroll Management",
    description: "Track your balance, set risk limits, and manage your trading capital with built-in tools.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
  {
    title: "Portfolio Analytics",
    description: "Detailed performance reports, win/loss ratios, and trade history with export options.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    title: "Multi-Strategy Bots",
    description: "Run multiple bot strategies simultaneously — Confluence, Trend, Mean Reversion, and Digit strategies with configurable parameters.",
    iconSvg: (
      <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
  },
];
