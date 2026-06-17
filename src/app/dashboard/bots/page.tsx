"use client";

import { useState } from "react";
import { useBotEngine, type BotConfig, type BotState } from "@/lib/bot-engine";

const SYMBOLS = [
  { value: "R_100", label: "Volatility 100" },
  { value: "R_50", label: "Volatility 50" },
  { value: "R_25", label: "Volatility 25" },
  { value: "R_10", label: "Volatility 10" },
  { value: "1HZ100V", label: "Volatility 100 (1s)" },
  { value: "1HZ50V", label: "Volatility 50 (1s)" },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "bg-gray-500/20 text-gray-400",
    running: "bg-green-500/20 text-green-400 animate-pulse",
    paused: "bg-yellow-500/20 text-yellow-400",
    stopped: "bg-red-500/20 text-red-400",
    error: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium ${colors[status] || colors.idle}`}>
      {status.toUpperCase()}
    </span>
  );
}

function BotCard({
  strategy, botState, onStart, onStop, onPause, onResume,
}: {
  strategy: { name: string; description: string; contractType: string };
  botState: BotState | undefined;
  onStart: (config: BotConfig) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [symbol, setSymbol] = useState("R_100");
  const [stake, setStake] = useState(1);
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState("t");
  const [takeProfit, setTakeProfit] = useState(50);
  const [stopLoss, setStopLoss] = useState(20);
  const [martingale, setMartingale] = useState(2);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(5);

  const isRunning = botState?.status === "running";
  const isPaused = botState?.status === "paused";
  const isStopped = botState?.status === "stopped" || botState?.status === "idle";

  const handleStart = () => {
    onStart({
      id: strategy.name.toLowerCase().replace(/\s+/g, "-"),
      name: strategy.name, symbol, contractType: strategy.contractType,
      stake, duration, durationUnit, maxLosses: 0, maxConsecutiveLosses,
      takeProfit, stopLoss, martingaleMultiplier: martingale, baseStake: stake,
    });
    setShowConfig(false);
  };

  const pnl = (botState?.totalProfit || 0) - (botState?.totalLoss || 0);
  const winRate = botState && botState.tradeCount > 0
    ? ((botState.winCount / botState.tradeCount) * 100).toFixed(1)
    : "—";

  return (
    <div className={`stat-card ${isRunning ? "border-green-500/30" : ""}`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1 mr-2">
          <h3 className="font-semibold text-sm sm:text-base">{strategy.name}</h3>
          <p className="text-[10px] sm:text-xs text-[#71717a] mt-0.5 line-clamp-2">{strategy.description}</p>
        </div>
        <StatusBadge status={botState?.status || "idle"} />
      </div>

      {/* Stats */}
      {botState && botState.tradeCount > 0 && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3 p-2 rounded-lg bg-[#070709]/50">
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Trades</p>
            <p className="text-xs sm:text-sm font-bold">{botState.tradeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Win Rate</p>
            <p className="text-xs sm:text-sm font-bold">{winRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">P&L</p>
            <p className={`text-xs sm:text-sm font-bold ${pnl >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
              ${pnl.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Config Panel */}
      {showConfig && isStopped && (
        <div className="space-y-2.5 sm:space-y-3 mb-3 p-3 rounded-lg bg-[#070709]/50">
          <div>
            <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Symbol</label>
            <select
              value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm"
            >
              {SYMBOLS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          {/* Stake + Duration — stack on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Stake ($)</label>
              <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} min={0.35} step={0.5}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Duration</label>
              <div className="flex gap-1.5">
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1}
                  className="w-20 bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm" />
                <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}
                  className="flex-1 bg-[#070709] border border-white/[0.08] rounded-lg px-2 py-2 text-sm">
                  <option value="t">ticks</option>
                  <option value="m">min</option>
                  <option value="h">hr</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Take Profit ($)</label>
              <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(Number(e.target.value))} min={1}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Stop Loss ($)</label>
              <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} min={1}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Martingale</label>
              <input type="number" value={martingale} onChange={(e) => setMartingale(Number(e.target.value))} min={1} max={10} step={0.5}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Max Losses</label>
              <input type="number" value={maxConsecutiveLosses} onChange={(e) => setMaxConsecutiveLosses(Number(e.target.value))} min={1}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isStopped && (
          <>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-[#070709] border border-white/[0.08] hover:border-white/[0.15] transition-colors"
            >
              {showConfig ? "Cancel" : "Configure"}
            </button>
            {showConfig && (
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-[#00e676] hover:bg-[#00c853] text-black font-semibold transition-colors"
              >
                Start Bot
              </button>
            )}
          </>
        )}
        {isRunning && (
          <>
            <button onClick={onPause} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 transition-colors">
              Pause
            </button>
            <button onClick={onStop} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors">
              Stop
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button onClick={onResume} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-[#00e676] hover:bg-[#00c853] text-black font-semibold transition-colors">
              Resume
            </button>
            <button onClick={onStop} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors">
              Stop
            </button>
          </>
        )}
      </div>

      {/* Trade Log */}
      {botState && botState.tradeLog.length > 0 && (
        <details className="mt-2 sm:mt-3">
          <summary className="text-[10px] sm:text-xs text-[#71717a] cursor-pointer hover:text-[#f4f4f5]">
            Trade Log ({botState.tradeLog.length})
          </summary>
          <div className="mt-2 max-h-32 sm:max-h-40 overflow-y-auto space-y-1 text-[10px] sm:text-xs font-mono no-overscroll">
            {botState.tradeLog.slice(0, 20).map((entry, i) => (
              <div key={i} className={`p-1.5 rounded ${
                entry.type === "error" ? "bg-red-500/10 text-red-400" :
                entry.type === "buy" ? "bg-blue-500/10 text-blue-400" :
                entry.type === "sell" ? (entry.profit && entry.profit > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400") :
                "bg-[#070709]/50 text-[#71717a]"
              }`}>
                {entry.message}
              </div>
            ))}
          </div>
        </details>
      )}

      {botState?.lastError && (
        <div className="mt-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-[10px] sm:text-xs">
          {botState.lastError}
        </div>
      )}
    </div>
  );
}

export default function BotsPage() {
  const { bots, startBot, stopBot, pauseBot, resumeBot, connectionStatus, strategies } = useBotEngine();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">Trading Bots</h1>
          <p className="text-[10px] sm:text-sm text-[#71717a] mt-0.5">Automated trading strategies</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-[#00e676]" : "bg-[#ff1744]"}`} />
          <span className="text-[10px] sm:text-xs text-[#71717a]">{connectionStatus === "connected" ? "Live" : "Off"}</span>
        </div>
      </div>

      {/* Active Bots Summary */}
      {Array.from(bots.values()).some((b) => b.status === "running") && (
        <div className="stat-card border-green-500/20 bg-green-500/5">
          <h3 className="font-semibold text-green-400 text-xs sm:text-sm mb-2">
            Active Bots ({Array.from(bots.values()).filter((b) => b.status === "running").length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {Array.from(bots.entries())
              .filter(([, state]) => state.status === "running")
              .map(([id, state]) => {
                const pnl = state.totalProfit - state.totalLoss;
                return (
                  <div key={id} className="text-center p-2 rounded-lg bg-[#070709]/50">
                    <p className="text-[10px] sm:text-xs text-[#71717a] truncate">{id}</p>
                    <p className={`text-xs sm:text-sm font-bold ${pnl >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
                      ${pnl.toFixed(2)}
                    </p>
                    <p className="text-[9px] sm:text-xs text-[#52525b]">{state.tradeCount} trades</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {Object.entries(strategies).map(([id, strategy]) => (
          <BotCard
            key={id}
            strategy={strategy}
            botState={bots.get(id)}
            onStart={startBot}
            onStop={() => stopBot(id)}
            onPause={() => pauseBot(id)}
            onResume={() => resumeBot(id)}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="stat-card border-yellow-500/20 bg-yellow-500/5">
        <p className="text-[10px] sm:text-xs text-yellow-400 leading-relaxed">
          <strong>Risk Warning:</strong> Trading bots involve significant financial risk.
          Always start with small stakes and use stop-loss limits. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
