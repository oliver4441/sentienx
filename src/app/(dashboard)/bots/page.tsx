"use client";

import { useState } from "react";

const BOT_STRATEGIES = [
  {
    id: "risefall",
    name: "Rise/Fall Predictor",
    description: "Predicts whether the next tick will be higher or lower than the current price.",
    icon: "↑↓",
    status: "ready",
  },
  {
    id: "digitmatch",
    name: "Digit Match",
    description: "Predicts that the last digit of the tick will match your selected digit.",
    icon: "=",
    status: "ready",
  },
  {
    id: "digitdiff",
    name: "Digit Differ",
    description: "Predicts that the last digit will differ from your selected digit.",
    icon: "≠",
    status: "ready",
  },
  {
    id: "evenodd",
    name: "Even/Odd",
    description: "Predicts whether the last digit will be even or odd.",
    icon: "E/O",
    status: "ready",
  },
  {
    id: "overunder",
    name: "Over/Under",
    description: "Predicts whether the last digit will be over or under your selected digit.",
    icon: "O/U",
    status: "ready",
  },
  {
    id: "accumulator",
    name: "Accumulator Bot",
    description: "Accumulates profit at each tick. Higher risk, higher reward.",
    icon: "⚡",
    status: "coming_soon",
  },
];

export default function BotsPage() {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [runningBots, setRunningBots] = useState<Set<string>>(new Set());

  const toggleBot = (botId: string) => {
    setRunningBots((prev) => {
      const next = new Set(prev);
      if (next.has(botId)) {
        next.delete(botId);
      } else {
        next.add(botId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trading Bots</h1>
        <p className="text-sentienx-text-muted mt-1">
          Automated trading strategies powered by Deriv API
        </p>
      </div>

      {/* Running Bots */}
      {runningBots.size > 0 && (
        <div className="stat-card border-sentienx-bull/20 bg-sentienx-bull-bg/30">
          <h3 className="font-semibold text-sentienx-bull mb-2">
            Active Bots ({runningBots.size})
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(runningBots).map((botId) => {
              const bot = BOT_STRATEGIES.find((b) => b.id === botId);
              return (
                <span
                  key={botId}
                  className="px-3 py-1 rounded-full bg-sentienx-bull/20 text-sentienx-bull text-sm"
                >
                  {bot?.name} — Running
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BOT_STRATEGIES.map((bot) => (
          <div
            key={bot.id}
            className={`stat-card cursor-pointer transition-all ${
              selectedBot === bot.id
                ? "border-sentienx-brand/40"
                : "hover:border-sentienx-border-hover"
            } ${bot.status === "coming_soon" ? "opacity-60" : ""}`}
            onClick={() => setSelectedBot(bot.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xl">{bot.icon}</div>
              {bot.status === "coming_soon" ? (
                <span className="text-xs px-2 py-1 rounded bg-sentienx-card text-sentienx-text-dim">
                  Coming Soon
                </span>
              ) : runningBots.has(bot.id) ? (
                <span className="text-xs px-2 py-1 rounded bg-sentienx-bull-bg text-sentienx-bull">
                  Running
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-sentienx-card text-sentienx-text-dim">
                  Ready
                </span>
              )}
            </div>
            <h3 className="font-semibold mb-1">{bot.name}</h3>
            <p className="text-xs text-sentienx-text-muted mb-4">
              {bot.description}
            </p>
            {bot.status !== "coming_soon" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBot(bot.id);
                }}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  runningBots.has(bot.id)
                    ? "bg-sentienx-bear/10 text-sentienx-bear hover:bg-sentienx-bear/20"
                    : "bg-sentienx-brand/10 text-sentienx-brand hover:bg-sentienx-brand/20"
                }`}
              >
                {runningBots.has(bot.id) ? "Stop Bot" : "Configure & Run"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bot Configuration Panel */}
      {selectedBot && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">
            Configure {BOT_STRATEGIES.find((b) => b.id === selectedBot)?.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-sentienx-text-muted block mb-1">
                Stake
              </label>
              <input
                type="number"
                defaultValue={10}
                className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand"
              />
            </div>
            <div>
              <label className="text-sm text-sentienx-text-muted block mb-1">
                Take Profit ($)
              </label>
              <input
                type="number"
                defaultValue={100}
                className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand"
              />
            </div>
            <div>
              <label className="text-sm text-sentienx-text-muted block mb-1">
                Stop Loss ($)
              </label>
              <input
                type="number"
                defaultValue={50}
                className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand"
              />
            </div>
          </div>
          <p className="text-xs text-sentienx-text-dim mt-4">
            Bot configuration is a preview. Full bot engine coming in the next
            update.
          </p>
        </div>
      )}
    </div>
  );
}
