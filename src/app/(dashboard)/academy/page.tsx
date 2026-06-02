"use client";

import { useState } from "react";

const ACADEMY_SECTIONS = [
  {
    id: "candlesticks",
    title: "Candlestick Patterns",
    description: "Master the art of reading candlestick charts for price action analysis.",
    lessons: [
      "Introduction to Candlestick Charts",
      "Single Candle Patterns (Doji, Hammer, Shooting Star)",
      "Double Candle Patterns (Engulfing, Harami)",
      "Triple Candle Patterns (Morning Star, Three White Soldiers)",
      "Candlestick Patterns for Deriv Trading",
    ],
  },
  {
    id: "indicators",
    title: "Technical Indicators",
    description: "Learn the most powerful indicators for timing your trades.",
    lessons: [
      "Moving Averages (SMA, EMA)",
      "RSI — Relative Strength Index",
      "MACD — Moving Average Convergence Divergence",
      "Bollinger Bands",
      "Stochastic Oscillator",
    ],
  },
  {
    id: "fibonacci",
    title: "Fibonacci Trading",
    description: "Use Fibonacci retracement and extension levels for entry and exit points.",
    lessons: [
      "Fibonacci Sequence in Trading",
      "Retracement Levels (23.6%, 38.2%, 50%, 61.8%)",
      "Extension Levels for Take Profit",
      "Fibonacci + Support/Resistance",
      "The Golden Zone Strategy",
    ],
  },
  {
    id: "risk",
    title: "Risk Management",
    description: "Protect your capital with proper risk management techniques.",
    lessons: [
      "Position Sizing Fundamentals",
      "Risk-Reward Ratios",
      "The 2% Rule",
      "Martingale Strategy (and its risks)",
      "Bankroll Management Spreadsheets",
    ],
  },
  {
    id: "chartpatterns",
    title: "Chart Patterns",
    description: "Identify and trade classic chart patterns.",
    lessons: [
      "Support and Resistance",
      "Trend Lines and Channels",
      "Head and Shoulders",
      "Double Tops and Bottoms",
      "Triangles (Ascending, Descending, Symmetrical)",
    ],
  },
  {
    id: "deriv",
    title: "Deriv Platform Guide",
    description: "Everything you need to know about trading on Deriv.",
    lessons: [
      "Getting Started with Deriv",
      "Understanding Contract Types",
      "Digital Options Trading",
      "Multipliers and Accumulators",
      "Using Deriv Bot Platform",
    ],
  },
];

export default function AcademyPage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const section = ACADEMY_SECTIONS.find((s) => s.id === selectedSection);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trading Academy</h1>
        <p className="text-sentienx-text-muted mt-1">
          Learn trading strategies and improve your skills
        </p>
      </div>

      {selectedSection && section ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedSection(null)}
            className="text-sm text-sentienx-brand hover:underline"
          >
            Back to all courses
          </button>
          <div className="stat-card">
            <h2 className="text-xl font-bold mb-2">{section.title}</h2>
            <p className="text-sentienx-text-muted mb-6">
              {section.description}
            </p>
            <div className="space-y-2">
              {section.lessons.map((lesson, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-sentienx-bg border border-sentienx-border hover:border-sentienx-border-hover transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-sentienx-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-sentienx-brand">
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-sm">{lesson}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACADEMY_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="stat-card cursor-pointer hover:border-sentienx-brand/30 transition-colors"
              onClick={() => setSelectedSection(section.id)}
            >
              <h3 className="font-semibold mb-2">{section.title}</h3>
              <p className="text-xs text-sentienx-text-muted mb-3">
                {section.description}
              </p>
              <p className="text-xs text-sentienx-brand">
                {section.lessons.length} lessons
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
