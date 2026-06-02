"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Landing page — redirects to dashboard if authenticated,
 * otherwise shows the Sentienx landing/hero section.
 */
export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has a session
    fetch("/api/auth/deriv/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.push("/dashboard");
        }
      })
      .catch(() => {
        // Not authenticated — stay on landing
      });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-sentienx-border bg-sentienx-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sentienx-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-sentienx-text">
              Sentienx
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-sm text-sentienx-text-muted hover:text-sentienx-text transition-colors"
            >
              Sign In
            </a>
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-sentienx-brand hover:bg-sentienx-brand-dark text-white transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-sentienx-text">Trade </span>
              <span className="text-sentienx-brand">Deriv</span>
              <br />
              <span className="text-sentienx-text">Your Way</span>
            </h1>
            <p className="text-lg md:text-xl text-sentienx-text-muted max-w-2xl mx-auto">
              A powerful trading platform with automated bots, real-time
              analytics, trading academy, and bankroll management — all in one
              place.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/login"
              className="px-8 py-3 text-base font-medium rounded-xl bg-sentienx-brand hover:bg-sentienx-brand-dark text-white transition-all hover:shadow-lg hover:shadow-sentienx-brand/25"
            >
              Start Trading
            </a>
            <a
              href="#features"
              className="px-8 py-3 text-base font-medium rounded-xl border border-sentienx-border hover:border-sentienx-border-hover text-sentienx-text transition-colors"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-lg mx-auto">
            <div>
              <div className="text-2xl font-bold text-sentienx-text tabular-nums">
                24/7
              </div>
              <div className="text-sm text-sentienx-text-muted">
                Market Access
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sentienx-text tabular-nums">
                50+
              </div>
              <div className="text-sm text-sentienx-text-muted">
                Tradeable Markets
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sentienx-text tabular-nums">
                45%
              </div>
              <div className="text-sm text-sentienx-text-muted">
                Commission
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section
        id="features"
        className="border-t border-sentienx-border py-24 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Everything You Need to Trade
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="stat-card space-y-3">
                <div className="text-2xl">{feature.icon}</div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-sentienx-text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sentienx-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sentienx-brand flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-sm text-sentienx-text-muted">
              Sentienx v1.0
            </span>
          </div>
          <p className="text-xs text-sentienx-text-dim">
            Trade responsibly. Deriv trading involves significant risk.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "📊",
    title: "Live Trading Dashboard",
    description:
      "Real-time charts, market data, and one-click trade execution. Everything you need on a single screen.",
  },
  {
    icon: "🤖",
    title: "Automated Trading Bots",
    description:
      "Pre-built strategies for Rise/Fall, Digit Match, Even/Odd, and more. Configure and run bots with a click.",
  },
  {
    icon: "📚",
    title: "Trading Academy",
    description:
      "Learn candlestick patterns, technical indicators, Fibonacci strategies, and risk management.",
  },
  {
    icon: "💰",
    title: "Bankroll Management",
    description:
      "Track your balance, set risk limits, and manage your trading capital with built-in tools.",
  },
  {
    icon: "📈",
    title: "Portfolio Analytics",
    description:
      "Detailed performance reports, win/loss ratios, and trade history with export options.",
  },
  {
    icon: "💸",
    title: "Earn Commissions",
    description:
      "Refer traders to Sentienx and earn up to 45% commission on their trading activity through Deriv.",
  },
];
