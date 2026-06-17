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
 <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status] || colors.idle}`}>
 {status.toUpperCase()}
 </span>
 );
}

function BotCard({
 strategy,
 botState,
 config,
 onStart,
 onStop,
 onPause,
 onResume,
}: {
 strategy: { name: string; description: string; contractType: string };
 botState: BotState | undefined;
 config: BotConfig | undefined;
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
 name: strategy.name,
 symbol,
 contractType: strategy.contractType,
 stake,
 duration,
 durationUnit,
 maxLosses: 0,
 maxConsecutiveLosses,
 takeProfit,
 stopLoss,
 martingaleMultiplier: martingale,
 baseStake: stake,
 });
 setShowConfig(false);
 };

 const pnl = (botState?.totalProfit || 0) - (botState?.totalLoss || 0);
 const winRate = botState && botState.tradeCount > 0
 ? ((botState.winCount / botState.tradeCount) * 100).toFixed(1)
 : "—";

 return (
 <div className={`stat-card ${isRunning ? "border-green-500/30" : ""}`}>
 <div className="flex items-start justify-between mb-3">
 <div>
 <h3 className="font-semibold">{strategy.name}</h3>
 <p className="text-xs text-sentienx-text-muted mt-0.5">{strategy.description}</p>
 </div>
 <StatusBadge status={botState?.status || "idle"} />
 </div>

 {/* Stats */}
 {botState && botState.tradeCount > 0 && (
 <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg bg-sentienx-bg/50">
 <div className="text-center">
 <p className="text-xs text-sentienx-text-muted">Trades</p>
 <p className="text-sm font-bold">{botState.tradeCount}</p>
 </div>
 <div className="text-center">
 <p className="text-xs text-sentienx-text-muted">Win Rate</p>
 <p className="text-sm font-bold">{winRate}%</p>
 </div>
 <div className="text-center">
 <p className="text-xs text-sentienx-text-muted">P&L</p>
 <p className={`text-sm font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
 ${pnl.toFixed(2)}
 </p>
 </div>
 </div>
 )}

 {/* Config Panel */}
 {showConfig && isStopped && (
 <div className="space-y-3 mb-3 p-3 rounded-lg bg-sentienx-bg/50">
 <div>
 <label className="text-xs text-sentienx-text-muted block mb-1">Symbol</label>
 <select
 value={symbol}
 onChange={(e) => setSymbol(e.target.value)}
 className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-2 py-1.5 text-sm"
 >
 {SYMBOLS.map((s) => (
 <option key={s.value} value={s.value}>{s.label}</option>
 ))}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-xs text-sentienx-text-muted block mb-1">Stake ($)</label>
 <input
 type="number"
 value={stake}
 onChange={(e) => setStake(Number(e.target.value))}
 min={0.35}
 step={0.5}
 className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-2 py-1.5 text-sm"
 />
 </div>
 <div>
 <label className="text-xs text-sentienx-text-muted block mb-1">Duration</label>
 <div className="flex gap-1">
 <input
 type="number"
 value={duration}
 onChange={(e) => setDuration(Number(e.target.value))}
 min={1}
 className="w-16 bg-sentienx-bg border border-sentienx-border rounded-lg px-2 py-1.5 text-sm"
 />
 <select
 value={durationUnit}
 onChange={(e) => setDurationUnit(e.target.value)}
 className="bg-sentienx-bg border border-sentienx-border rounded-lg px-1 py-1.5 text-sm"
 >
 <option value="t">ticks</option>
 <option value="m">min</option>
 <option value="h">hr</option>
 </select>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-xs text-sentienx-text-muted block mb-1">Take Profit ($)</label>
 <input
 type="number"
 value={takeProfit}
 onChange={(e) => setTakeProfit(Number(e.target.value))}
 min={1}
 className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-2 py-1.5 text-sm"
 />
 </div>
 <div>
 <label className="text-xs text-sentienx-text-muted block mb-1">Stop Loss ($)</label>
 <input
 type="number"
 value={stopLoss}
 onChange={(e) => setStopLoss(Number(e.target.value))}
 min={1}
 className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-2 py-1.5 text-sm"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-xs text-sentienx-text-muted block mb-1">Martingale</label>
 <input
 type="number"
 value={martingale}
 onChange={(e) => setMartingale(Number(e.target.value))}
 min={1}
 max={10}
 step={0.5}
 className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-2 py-1.5 text-sm"
 />
 </div>
 <div>
 <label className="text-xs text-sentienx-text-muted block mb-1">Max Consec. Losses</label>
 <input
 type="number"
 value={maxConsecutiveLosses}
 onChange={(e) => setMaxConsecutiveLosses(Number(e.target.value))}
 min={1}
 className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-2 py-1.5 text-sm"
 />
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
 className="flex-1 py-2 rounded-lg text-sm font-medium bg-sentienx-bg border border-sentienx-border hover:border-sentienx-border-hover transition-colors"
 >
 {showConfig ? "Cancel" : "Configure"}
 </button>
 {showConfig && (
 <button
 onClick={handleStart}
 className="flex-1 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
 >
 Start Bot
 </button>
 )}
 </>
 )}
 {isRunning && (
 <>
 <button
 onClick={onPause}
 className="flex-1 py-2 rounded-lg text-sm font-medium bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 transition-colors"
 >
 Pause
 </button>
 <button
 onClick={onStop}
 className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
 >
 Stop
 </button>
 </>
 )}
 {isPaused && (
 <>
 <button
 onClick={onResume}
 className="flex-1 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
 >
 Resume
 </button>
 <button
 onClick={onStop}
 className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
 >
 Stop
 </button>
 </>
 )}
 </div>

 {/* Trade Log */}
 {botState && botState.tradeLog.length > 0 && (
 <details className="mt-3">
 <summary className="text-xs text-sentienx-text-muted cursor-pointer hover:text-sentienx-text">
 Trade Log ({botState.tradeLog.length})
 </summary>
 <div className="mt-2 max-h-40 overflow-y-auto space-y-1 text-xs font-mono">
 {botState.tradeLog.slice(0, 20).map((entry, i) => (
 <div
 key={i}
 className={`p-1.5 rounded ${
 entry.type === "error" ? "bg-red-500/10 text-red-400" :
 entry.type === "buy" ? "bg-blue-500/10 text-blue-400" :
 entry.type === "sell" ? (entry.profit && entry.profit > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400") :
 "bg-sentienx-bg/50 text-sentienx-text-muted"
 }`}
 >
 {entry.message}
 </div>
 ))}
 </div>
 </details>
 )}

 {/* Error */}
 {botState?.lastError && (
 <div className="mt-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
 {botState.lastError}
 </div>
 )}
 </div>
 );
}

export default function BotsPage() {
 const { bots, startBot, stopBot, pauseBot, resumeBot, connectionStatus, strategies } = useBotEngine();

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
 <div>
 <h1 className="text-2xl font-bold">Trading Bots</h1>
 <p className="text-sentienx-text-muted mt-1">
 Automated trading strategies powered by Deriv API
 </p>
 </div>
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"}`} />
 <span className="text-sm text-sentienx-text-muted">
 {connectionStatus === "connected" ? "Connected" : "Disconnected"}
 </span>
 </div>
 </div>

 {/* Active Bots Summary */}
 {Array.from(bots.values()).some((b) => b.status === "running") && (
 <div className="stat-card border-green-500/20 bg-green-500/5">
 <h3 className="font-semibold text-green-400 mb-2">
 Active Bots ({Array.from(bots.values()).filter((b) => b.status === "running").length})
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {Array.from(bots.entries())
 .filter(([, state]) => state.status === "running")
 .map(([id, state]) => {
 const pnl = state.totalProfit - state.totalLoss;
 return (
 <div key={id} className="text-center p-2 rounded-lg bg-sentienx-bg/50">
 <p className="text-xs text-sentienx-text-muted truncate">{id}</p>
 <p className={`text-sm font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
 ${pnl.toFixed(2)}
 </p>
 <p className="text-xs text-sentienx-text-dim">{state.tradeCount} trades</p>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Bot Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {Object.entries(strategies).map(([id, strategy]) => (
 <BotCard
 key={id}
 strategy={strategy}
 botState={bots.get(id)}
 config={undefined}
 onStart={startBot}
 onStop={() => stopBot(id)}
 onPause={() => pauseBot(id)}
 onResume={() => resumeBot(id)}
 />
 ))}
 </div>

 {/* Disclaimer */}
 <div className="stat-card border-yellow-500/20 bg-yellow-500/5">
 <p className="text-xs text-yellow-400">
 <strong>Risk Warning:</strong> Trading bots involve significant financial risk. 
 Always start with small stakes and use stop-loss limits. Past performance does not guarantee future results.
 Only trade with money you can afford to lose.
 </p>
 </div>
 </div>
 );
}
