"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBotEngine, type BotConfig, type BotState } from "@/lib/bot-engine";

const SYMBOLS = [
  { value: "R_100", label: "Volatility 100" },
  { value: "R_75", label: "Volatility 75" },
  { value: "R_50", label: "Volatility 50" },
  { value: "R_25", label: "Volatility 25" },
  { value: "R_10", label: "Volatility 10" },
  { value: "1HZ100V", label: "Volatility 100 (1s)" },
  { value: "BOOM_1000", label: "Boom 1000" },
  { value: "CRASH_1000", label: "Crash 1000" },
  { value: "BOOM_500", label: "Boom 500" },
  { value: "CRASH_500", label: "Crash 500" },
];

const STRATEGIES = [
  {
    value: "confluence",
    label: "Math-First Confluence",
    desc: "7-signal confluence engine. Only trades when multiple indicators agree. Best for all market conditions.",
    contractType: "CALL",
  },
  {
    value: "trend",
    label: "Trend Follower",
    desc: "EMA crossover + momentum. Follows the prevailing trend. Best in high volatility.",
    contractType: "CALL",
  },
  {
    value: "meanReversion",
    label: "Mean Reversion",
    desc: "RSI extremes + Bollinger Band reversals. Bets on price returning to average. Best in low volatility.",
    contractType: "CALL",
  },
  {
    value: "digit_over",
    label: "Digit Over 2",
    desc: "Predicts last digit > 2. Positive EV digit strategy.",
    contractType: "DIGITOVER",
  },
  {
    value: "digit_under",
    label: "Digit Under 7",
    desc: "Predicts last digit < 7. Positive EV digit strategy.",
    contractType: "DIGITUNDER",
  },
];

const PRESETS = [
  {
    value: "conservative",
    label: "Conservative",
    desc: "High confluence threshold (0.75), low Kelly fraction (0.2), max 2% stake per trade",
    settings: { minConfluenceScore: 0.75, kellyFraction: 0.2, maxStakePercent: 0.02 },
  },
  {
    value: "moderate",
    label: "Moderate",
    desc: "Medium confluence (0.6), medium Kelly (0.35), max 5% stake per trade",
    settings: { minConfluenceScore: 0.6, kellyFraction: 0.35, maxStakePercent: 0.05 },
  },
  {
    value: "aggressive",
    label: "Aggressive",
    desc: "Lower confluence (0.45), higher Kelly (0.5), max 8% stake per trade",
    settings: { minConfluenceScore: 0.45, kellyFraction: 0.5, maxStakePercent: 0.08 },
  },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "bg-gray-500/20 text-gray-400",
    running: "bg-green-500/20 text-green-400 animate-pulse",
    paused: "bg-yellow-500/20 text-yellow-400",
    stopped: "bg-red-500/20 text-red-400",
    error: "bg-red-500/20 text-red-400",
    circuit_broken: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium ${colors[status] || colors.idle}`}>
      {status.toUpperCase().replace("_", " ")}
    </span>
  );
}

// ─── Bot Configuration Form ──────────────────────────────────────

function BotConfigForm({
  onStart,
  onCancel,
}: {
  onStart: (config: BotConfig) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const [strategy, setStrategy] = useState("confluence");
  const [symbol, setSymbol] = useState("R_100");
  const [stake, setStake] = useState(1);
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState("t");
  const [preset, setPreset] = useState("moderate");
  const [minConfluenceScore, setMinConfluenceScore] = useState(0.6);
  const [kellyFraction, setKellyFraction] = useState(0.35);
  const [maxStakePercent, setMaxStakePercent] = useState(0.05);
  const [takeProfit, setTakeProfit] = useState(50);
  const [stopLoss, setStopLoss] = useState(20);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(5);

  const selectedStrategy = STRATEGIES.find((s) => s.value === strategy);
  const selectedPreset = PRESETS.find((p) => p.value === preset);

  const handlePresetChange = (val: string) => {
    setPreset(val);
    const p = PRESETS.find((pr) => pr.value === val);
    if (p) {
      setMinConfluenceScore(p.settings.minConfluenceScore);
      setKellyFraction(p.settings.kellyFraction);
      setMaxStakePercent(p.settings.maxStakePercent);
    }
  };

  const handleStart = () => {
    onStart({
      id: `${strategy}_${symbol}_${Date.now()}`,
      name: selectedStrategy?.label || strategy,
      symbol,
      contractType: selectedStrategy?.contractType || "CALL",
      stake,
      duration,
      durationUnit,
      maxLosses: 0,
      maxConsecutiveLosses,
      takeProfit,
      stopLoss,
      martingaleMultiplier: 1,
      baseStake: stake,
      minConfluenceScore,
      kellyFraction,
      strategy: preset as "conservative" | "moderate" | "aggressive",
    });
  };

  return (
    <div className="stat-card space-y-4 sm:space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s ? "bg-[#6366f1] text-white" : "bg-white/[0.05] text-[#71717a]"
            }`}>{s}</div>
            {s < 3 && <div className={`w-8 sm:w-12 h-px ${step > s ? "bg-[#6366f1]" : "bg-white/[0.06]"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Strategy & Symbol */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Choose Strategy</h3>
            <p className="text-[10px] sm:text-xs text-[#71717a] mb-3">Select the trading strategy for your bot</p>
            <div className="space-y-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStrategy(s.value)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    strategy === s.value
                      ? "border-[#6366f1] bg-[#6366f1]/5"
                      : "border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]"
                  }`}
                >
                  <p className="text-xs sm:text-sm font-medium">{s.label}</p>
                  <p className="text-[10px] sm:text-xs text-[#71717a] mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
            >
              {SYMBOLS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Duration</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                className="w-20 bg-[#070709] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className="flex-1 bg-[#070709] border border-white/[0.08] rounded-lg px-2 py-2.5 text-sm min-h-[44px]"
              >
                <option value="t">Ticks</option>
                <option value="s">Seconds</option>
                <option value="m">Minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Risk & Stake */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Risk Preset</h3>
            <p className="text-[10px] sm:text-xs text-[#71717a] mb-3">Choose a risk level or customize below</p>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePresetChange(p.value)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    preset === p.value
                      ? "border-[#6366f1] bg-[#6366f1]/5"
                      : "border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]"
                  }`}
                >
                  <p className="text-xs sm:text-sm font-medium">{p.label}</p>
                  <p className="text-[10px] sm:text-xs text-[#71717a] mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Base Stake ($)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              min={0.35}
              step={0.5}
              className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Take Profit ($)</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                min={1}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Stop Loss ($)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                min={1}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Advanced & Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Advanced Parameters</h3>
            <p className="text-[10px] sm:text-xs text-[#71717a] mb-3">Fine-tune the math-first engine</p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">
                  Min Confluence Score: {minConfluenceScore.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={minConfluenceScore}
                  onChange={(e) => setMinConfluenceScore(Number(e.target.value))}
                  className="w-full accent-[#6366f1]"
                />
                <div className="flex justify-between text-[9px] text-[#52525b]">
                  <span>More trades</span>
                  <span>Fewer, higher quality</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">
                  Kelly Fraction: {kellyFraction.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={kellyFraction}
                  onChange={(e) => setKellyFraction(Number(e.target.value))}
                  className="w-full accent-[#6366f1]"
                />
                <div className="flex justify-between text-[9px] text-[#52525b]">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Max Consecutive Losses</label>
                <input
                  type="number"
                  value={maxConsecutiveLosses}
                  onChange={(e) => setMaxConsecutiveLosses(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
                />
                <p className="text-[9px] text-[#52525b] mt-0.5">Circuit breaker: bot pauses after this many consecutive losses</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-xl bg-[#070709]/50 border border-white/[0.06] space-y-1.5">
            <p className="text-xs font-semibold text-[#818cf8]">Configuration Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:text-xs">
              <span className="text-[#71717a]">Strategy</span>
              <span className="text-right">{selectedStrategy?.label}</span>
              <span className="text-[#71717a]">Symbol</span>
              <span className="text-right">{SYMBOLS.find((s) => s.value === symbol)?.label}</span>
              <span className="text-[#71717a]">Stake</span>
              <span className="text-right">${stake}</span>
              <span className="text-[#71717a]">Duration</span>
              <span className="text-right">{duration} {durationUnit === "t" ? "ticks" : durationUnit === "s" ? "sec" : "min"}</span>
              <span className="text-[#71717a]">Risk</span>
              <span className="text-right">{selectedPreset?.label}</span>
              <span className="text-[#71717a]">Confluence</span>
              <span className="text-right">{minConfluenceScore.toFixed(2)}</span>
              <span className="text-[#71717a]">Kelly</span>
              <span className="text-right">{kellyFraction.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-2 pt-2">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#070709] border border-white/[0.08] hover:border-white/[0.15] transition-colors min-h-[48px]"
          >
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors min-h-[48px]"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#00e676] hover:bg-[#00c853] text-black font-semibold transition-colors min-h-[48px]"
          >
            Start Bot
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-4 py-3 rounded-lg text-xs sm:text-sm font-medium text-[#71717a] hover:text-[#f4f4f5] transition-colors min-h-[48px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Bot Card ────────────────────────────────────────────────────

function BotCard({
  strategy,
  botState,
  onStart,
  onStop,
  onPause,
  onResume,
}: {
  strategy: { name: string; description: string; contractType: string };
  botState: BotState | undefined;
  onStart: (config: BotConfig) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const isRunning = botState?.status === "running";
  const isPaused = botState?.status === "paused";
  const isStopped = botState?.status === "stopped" || botState?.status === "idle" || botState?.status === "circuit_broken";

  const pnl = (botState?.totalProfit || 0) - (botState?.totalLoss || 0);
  const winRate = botState?.winRate ?? 0;

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2 sm:mb-3 p-2 rounded-lg bg-[#070709]/50">
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Trades</p>
            <p className="text-xs sm:text-sm font-bold">{botState.tradeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Win Rate</p>
            <p className="text-xs sm:text-sm font-bold">{(winRate * 100).toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">P&L</p>
            <p className={`text-xs sm:text-sm font-bold ${pnl >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
              ${pnl.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Factor</p>
            <p className="text-xs sm:text-sm font-bold">{botState.profitFactor.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Math-First Info */}
      {botState && botState.status !== "idle" && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3 p-2 rounded-lg bg-[#070709]/50">
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Regime</p>
            <p className="text-[10px] sm:text-sm font-bold text-[#818cf8]">{botState.regime}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Confluence</p>
            <p className="text-[10px] sm:text-sm font-bold">{botState.confluenceScore.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Kelly $</p>
            <p className="text-[10px] sm:text-sm font-bold text-[#00e676]">${botState.kellyStake.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isStopped && (
          <button
            onClick={() => {
              const defaultConfig: BotConfig = {
                id: strategy.name.toLowerCase().replace(/\s+/g, "-"),
                name: strategy.name,
                symbol: "R_100",
                contractType: strategy.contractType,
                stake: 1,
                duration: 5,
                durationUnit: "t",
                maxLosses: 0,
                maxConsecutiveLosses: 5,
                takeProfit: 50,
                stopLoss: 20,
                martingaleMultiplier: 1,
                baseStake: 1,
                minConfluenceScore: 0.6,
                kellyFraction: 0.35,
                strategy: "moderate",
              };
              onStart(defaultConfig);
            }}
            className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#00e676] hover:bg-[#00c853] text-black font-semibold transition-colors min-h-[48px]"
          >
            Quick Start
          </button>
        )}
        {isRunning && (
          <>
            <button onClick={onPause} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 transition-colors min-h-[48px]">
              Pause
            </button>
            <button onClick={onStop} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors min-h-[48px]">
              Stop
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button onClick={onResume} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#00e676] hover:bg-[#00c853] text-black font-semibold transition-colors min-h-[48px]">
              Resume
            </button>
            <button onClick={onStop} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors min-h-[48px]">
              Stop
            </button>
          </>
        )}
      </div>

      {/* Trade Log */}
      {botState && botState.tradeLog.length > 0 && (
        <details className="mt-2 sm:mt-3">
          <summary className="text-[10px] sm:text-xs text-[#71717a] cursor-pointer hover:text-[#f4f4f5] py-1">
            Trade Log ({botState.tradeLog.length})
          </summary>
          <div className="mt-2 max-h-32 sm:max-h-48 overflow-y-auto space-y-1 text-[10px] sm:text-xs font-mono no-overscroll">
            {botState.tradeLog.slice(0, 30).map((entry, i) => (
              <div key={i} className={`p-1.5 rounded ${
                entry.type === "error" ? "bg-red-500/10 text-red-400" :
                entry.type === "buy" ? "bg-blue-500/10 text-blue-400" :
                entry.type === "sell" ? (entry.profit && entry.profit > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400") :
                entry.type === "analysis" ? "bg-purple-500/10 text-purple-400" :
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

// ─── Main Page ────────────────────────────────────────────────────

export default function BotsPage() {
  const { bots, startBot, stopBot, pauseBot, resumeBot, connectionStatus, strategies } = useBotEngine();
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<"bots" | "create">("bots");

  const runningCount = Array.from(bots.values()).filter((b) => b.status === "running").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">Trading Bots</h1>
          <p className="text-[10px] sm:text-sm text-[#71717a] mt-0.5">Math-first confluence engine with Kelly Criterion sizing</p>
        </div>
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs text-green-400">{runningCount} running</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-[#00e676]" : connectionStatus === "demo" ? "bg-yellow-500" : "bg-[#ff1744]"}`} />
            <span className="text-[10px] sm:text-xs text-[#71717a]">{connectionStatus === "connected" ? "Live" : connectionStatus === "demo" ? "Demo" : "Off"}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <button
          onClick={() => setActiveTab("bots")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            activeTab === "bots" ? "bg-[#6366f1] text-white" : "text-[#71717a] hover:text-[#f4f4f5]"
          }`}
        >
          My Bots
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            activeTab === "create" ? "bg-[#6366f1] text-white" : "text-[#71717a] hover:text-[#f4f4f5]"
          }`}
        >
          Create Bot
        </button>
      </div>

      {/* Create Bot Tab */}
      {activeTab === "create" && (
        <BotConfigForm
          onStart={(config) => {
            startBot(config);
            setActiveTab("bots");
          }}
          onCancel={() => setActiveTab("bots")}
        />
      )}

      {/* Bots Tab */}
      {activeTab === "bots" && (
        <>
          {/* Math-First Info Banner */}
          <div className="stat-card border-[#818cf8]/20 bg-[#818cf8]/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#818cf8]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[#818cf8] text-sm font-bold">M</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#818cf8] text-xs sm:text-sm">Math-First Engine Active</h3>
                <p className="text-[10px] sm:text-xs text-[#71717a] mt-0.5 leading-relaxed">
                  7-signal confluence scoring, regime-adaptive thresholds, Kelly Criterion position sizing.
                  Edge comes from filtering and risk management, not prediction.
                </p>
              </div>
            </div>
          </div>

          {/* Bot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
              The math-first engine uses confluence filtering and Kelly Criterion sizing to manage risk,
              but cannot predict random tick movements. Always start with small stakes and use stop-loss limits.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
