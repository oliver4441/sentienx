"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";

interface GameState {
 round: {
 id: string;
 crashPoint: number;
 status: "waiting" | "running" | "crashed";
 multiplier: number;
 startedAt: number;
 hash: string;
 seed: string;
 } | null;
 bets: {
 playerId: string;
 playerName: string;
 amount: number;
 cashedOutAt: number | null;
 profit: number;
 autoCashout: number | null;
 }[];
 history: { id: string; crashPoint: number; hash: string }[];
 countdown: number;
 totalPlayers: number;
}

export default function CrashGamePage() {
 const { isAuthenticated, accountInfo, accessToken } = useAuth();
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const animFrameRef = useRef<number>(0);
 const playerIdRef = useRef(Math.random().toString(36).substring(2, 10));

 const [gameState, setGameState] = useState<GameState | null>(null);
 const [betAmount, setBetAmount] = useState(10);
 const [autoCashout, setAutoCashout] = useState<number | null>(null);
 const [hasBet, setHasBet] = useState(false);
 const [cashedOut, setCashedOut] = useState(false);
 const [lastProfit, setLastProfit] = useState<number | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [balance, setBalance] = useState<number>(0);
 const [loading, setLoading] = useState(true);

 const lastRoundIdRef = useRef<string | null>(null);

 // Get player name from Deriv account
 const playerName = accountInfo?.authorize?.fullname ||
 accountInfo?.authorize?.loginid ||
 "Player";

 // Fetch real balance from Deriv
 const fetchBalance = useCallback(async () => {
 if (!accessToken) return;
 try {
 const res = await fetch("/api/user/balance", {
 headers: { Authorization: `Bearer ${accessToken}` },
 });
 if (res.ok) {
 const data = await res.json();
 setBalance(data.balance ?? 0);
 }
 } catch {
 // ignore
 }
 }, [accessToken]);

 useEffect(() => {
 if (isAuthenticated && accessToken) {
 fetchBalance();
 // Refresh balance every 10 seconds
 const iv = setInterval(fetchBalance, 10000);
 return () => clearInterval(iv);
 }
 }, [isAuthenticated, accessToken, fetchBalance]);

 // Poll game state
 useEffect(() => {
 let alive = true;

 const poll = async () => {
 try {
 const res = await fetch("/api/crash");
 if (!alive) return;
 const data: GameState = await res.json();
 setGameState(data);
 setLoading(false);

 const currentRoundId = data.round?.id || null;
 const roundChanged = currentRoundId !== lastRoundIdRef.current;

 if (roundChanged && data.round?.status === "waiting") {
 const myBet = data.bets.find((b) => b.playerId === playerIdRef.current);
 if (myBet) {
 setHasBet(true);
 setCashedOut(false);
 setLastProfit(null);
 } else {
 setHasBet(false);
 setCashedOut(false);
 setLastProfit(null);
 }
 }

 if (data.round?.status === "crashed") {
 const myBet = data.bets.find((b) => b.playerId === playerIdRef.current);
 if (myBet) {
 setHasBet(true);
 setCashedOut(true);
 setLastProfit(myBet.profit);
 // Refresh balance after round ends
 fetchBalance();
 }
 }

 lastRoundIdRef.current = currentRoundId;
 } catch {
 // ignore poll errors
 }
 };

 poll();
 const interval = setInterval(poll, 250);
 return () => { alive = false; clearInterval(interval); };
 }, [fetchBalance]);

 // Place bet
 const placeBet = async () => {
 try {
 setError(null);
 if (betAmount > balance) {
 setError("Insufficient balance. Please deposit first.");
 return;
 }
 const res = await fetch("/api/crash", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 action: "bet",
 playerId: playerIdRef.current,
 playerName,
 amount: betAmount,
 autoCashout,
 }),
 });
 const data = await res.json();
 if (data.error) {
 setError(data.error);
 } else {
 setHasBet(true);
 setGameState(data.gameState);
 setBalance((prev) => Math.max(0, prev - betAmount));
 }
 } catch {
 setError("Failed to place bet");
 }
 };

 // Cash out
 const cashOut = async () => {
 try {
 setError(null);
 const res = await fetch("/api/crash", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 action: "cashout",
 playerId: playerIdRef.current,
 }),
 });
 const data = await res.json();
 if (data.error) {
 setError(data.error);
 } else {
 setCashedOut(true);
 setLastProfit(data.profit);
 setGameState(data.gameState);
 // Refresh balance after cashout
 setTimeout(fetchBalance, 500);
 }
 } catch {
 setError("Failed to cash out");
 }
 };

 // Canvas rendering
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 const ctx = canvas.getContext("2d");
 if (!ctx) return;

 const render = () => {
 const dpr = window.devicePixelRatio || 1;
 const rect = canvas.getBoundingClientRect();
 canvas.width = rect.width * dpr;
 canvas.height = rect.height * dpr;
 ctx.scale(dpr, dpr);

 const w = rect.width;
 const h = rect.height;

 // Clear
 ctx.fillStyle = "#0a0a0f";
 ctx.fillRect(0, 0, w, h);

 // Draw grid
 ctx.strokeStyle = "#1a1a2e";
 ctx.lineWidth = 1;
 for (let x = 0; x < w; x += 40) {
 ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
 }
 for (let y = 0; y < h; y += 40) {
 ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
 }

 if (!gameState?.round) {
 ctx.fillStyle = "#666";
 ctx.font = "24px monospace";
 ctx.textAlign = "center";
 ctx.fillText(loading ? "Connecting to Deriv..." : "Waiting for round...", w / 2, h / 2);
 animFrameRef.current = requestAnimationFrame(render);
 return;
 }

 const { round } = gameState;
 const multiplier = round.multiplier;

 // Draw the crash curve
 ctx.beginPath();
 ctx.strokeStyle = round.status === "crashed" ? "#ff4444" : "#00ff88";
 ctx.lineWidth = 3;
 ctx.shadowColor = round.status === "crashed" ? "#ff4444" : "#00ff88";
 ctx.shadowBlur = 10;

 const maxDisplay = Math.max(multiplier * 1.2, 5);
 const points = 100;
 for (let i = 0; i <= points; i++) {
 const t = (i / points) * multiplier;
 const x = (t / maxDisplay) * (w - 100) + 50;
 const y = h - 50 - (Math.log(t + 1) / Math.log(maxDisplay + 1)) * (h - 100);
 if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
 }
 ctx.stroke();
 ctx.shadowBlur = 0;

 // Draw multiplier text
 const multText = multiplier >= 100 ? `${multiplier.toFixed(0)}x` : `${multiplier.toFixed(2)}x`;
 ctx.fillStyle = round.status === "crashed" ? "#ff4444" : "#00ff88";
 ctx.font = `bold ${Math.min(52, w / 10)}px monospace`;
 ctx.textAlign = "center";
 ctx.fillText(multText, w / 2, h / 2 - 10);

 // Status
 ctx.font = "16px monospace";
 if (round.status === "waiting") {
 ctx.fillStyle = "#ffaa00";
 ctx.fillText(`Starting in ${gameState.countdown || 5}s`, w / 2, h / 2 + 30);
 } else if (round.status === "crashed") {
 ctx.fillStyle = "#ff4444";
 ctx.font = "bold 20px monospace";
 ctx.fillText(`CRASHED at ${round.crashPoint.toFixed(2)}x`, w / 2, h / 2 + 30);
 } else {
 ctx.fillStyle = "#00ff88";
 ctx.fillText(" LIVE", w / 2, h / 2 + 30);
 }

 // My bet status
 if (hasBet) {
 ctx.font = "14px monospace";
 if (cashedOut) {
 ctx.fillStyle = lastProfit !== null && lastProfit >= 0 ? "#00ff88" : "#ff4444";
 ctx.fillText(
 lastProfit !== null && lastProfit >= 0
 ? ` Cashed out: +$${lastProfit.toFixed(2)}`
 : ` Lost $${betAmount.toFixed(2)}`,
 w / 2, h / 2 + 55
 );
 } else if (round.status === "crashed") {
 ctx.fillStyle = "#ff4444";
 ctx.fillText(` CRASHED — Lost $${betAmount.toFixed(2)}`, w / 2, h / 2 + 55);
 } else if (round.status === "running") {
 ctx.fillStyle = "#ffaa00";
 const currentProfit = betAmount * (multiplier - 1);
 ctx.fillText(
 `In game — $${currentProfit.toFixed(2)} if cashout now`,
 w / 2, h / 2 + 55
 );
 } else {
 ctx.fillStyle = "#ffaa00";
 ctx.fillText(`Bet placed — $${betAmount.toFixed(2)}`, w / 2, h / 2 + 55);
 }
 }

 // History bar at bottom
 const historyY = h - 25;
 const barWidth = Math.max(12, Math.min(16, (w - 100) / 30));
 const barGap = 3;
 gameState.history.slice(0, 30).forEach((hist, i) => {
 const x = w - 50 - i * (barWidth + barGap);
 if (x < 0) return;
 ctx.fillStyle = hist.crashPoint < 2 ? "#ff4444" : hist.crashPoint < 5 ? "#ffaa00" : "#00ff88";
 ctx.fillRect(x, historyY, barWidth, 15);
 ctx.fillStyle = "#fff";
 ctx.font = "8px monospace";
 ctx.textAlign = "center";
 ctx.fillText(`${hist.crashPoint.toFixed(1)}`, x + barWidth / 2, historyY + 11);
 });

 animFrameRef.current = requestAnimationFrame(render);
 };

 animFrameRef.current = requestAnimationFrame(render);
 return () => cancelAnimationFrame(animFrameRef.current);
 }, [gameState, hasBet, cashedOut, lastProfit, betAmount, loading]);

 if (!isAuthenticated) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
 <div className="text-center space-y-4">
 <h1 className="text-3xl font-bold text-white"> Crash Game</h1>
 <p className="text-gray-400">Please log in to play</p>
 <a href="/login" className="px-6 py-3 rounded-xl bg-sentienx-brand text-white font-medium inline-block hover:bg-sentienx-brand-dark transition-colors">
 Log In
 </a>
 </div>
 </div>
 );
 }

 const currentMultiplier = gameState?.round?.multiplier || 1;
 const potentialProfit = betAmount * (currentMultiplier - 1);
 const currency = accountInfo?.authorize?.currency || "USD";

 return (
 <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
 <div className="max-w-6xl mx-auto space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold"> Crash Game</h1>
 <div className="flex items-center gap-4 text-sm">
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111118] border border-[#1a1a2e]">
 <span className="text-gray-400">Balance:</span>
 <span className="text-green-400 font-bold">{currency} {balance.toFixed(2)}</span>
 </div>
 <div className="flex items-center gap-2 text-gray-400">
 <span>Players: {gameState?.totalPlayers || 0}</span>
 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 <span className="text-green-400">Live</span>
 </div>
 <span className="text-xs text-gray-600">Powered by Deriv</span>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 {/* Game Canvas — takes 3 cols */}
 <div className="lg:col-span-3 space-y-4">
 <div className="bg-[#111118] rounded-xl overflow-hidden border border-[#1a1a2e]">
 <canvas
 ref={canvasRef}
 className="w-full"
 style={{ height: "400px" }}
 />
 </div>

 {/* Controls */}
 <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {/* Bet Amount */}
 <div>
 <label className="text-sm text-gray-400 block mb-1">Bet Amount ({currency})</label>
 <input
 type="number"
 value={betAmount}
 onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
 disabled={hasBet}
 min={1}
 max={balance}
 className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand disabled:opacity-50"
 />
 <div className="flex gap-1 mt-2 flex-wrap">
 {[1, 5, 10, 25, 50, 100].map((a) => (
 <button
 key={a}
 onClick={() => !hasBet && setBetAmount(Math.min(a, balance))}
 disabled={hasBet}
 className="px-2 py-1 rounded bg-[#1a1a2e] text-xs hover:bg-[#2a2a3e] transition-colors disabled:opacity-40"
 >
 {currency}{a}
 </button>
 ))}
 <button
 onClick={() => !hasBet && setBetAmount(Math.floor(balance))}
 disabled={hasBet || balance <= 0}
 className="px-2 py-1 rounded bg-sentienx-brand/20 text-sentienx-brand text-xs hover:bg-sentienx-brand/30 transition-colors disabled:opacity-40"
 >
 MAX
 </button>
 </div>
 </div>

 {/* Auto Cashout */}
 <div>
 <label className="text-sm text-gray-400 block mb-1">Auto Cashout (optional)</label>
 <input
 type="number"
 value={autoCashout || ""}
 onChange={(e) => setAutoCashout(e.target.value ? Number(e.target.value) : null)}
 disabled={hasBet}
 min={1.01}
 step={0.5}
 placeholder="e.g. 2.0"
 className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand disabled:opacity-50"
 />
 <div className="flex gap-1 mt-2 flex-wrap">
 {[1.5, 2, 3, 5, 10].map((m) => (
 <button
 key={m}
 onClick={() => !hasBet && setAutoCashout(m)}
 className="px-2 py-1 rounded bg-[#1a1a2e] text-xs hover:bg-[#2a2a3e] transition-colors"
 >
 {m}x
 </button>
 ))}
 </div>
 </div>

 {/* Place Bet */}
 <div className="flex items-end">
 <button
 onClick={placeBet}
 disabled={hasBet || gameState?.round?.status === "running" || betAmount > balance || betAmount <= 0}
 className="w-full py-3 rounded-lg bg-sentienx-brand hover:bg-sentienx-brand-dark text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {hasBet ? " Bet Placed" : `Place Bet ${currency}${betAmount}`}
 </button>
 </div>

 {/* Cash Out */}
 <div className="flex items-end">
 <button
 onClick={cashOut}
 disabled={!hasBet || cashedOut || gameState?.round?.status !== "running"}
 className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
 >
 {cashedOut
 ? lastProfit !== null && lastProfit >= 0
 ? `+${currency}${lastProfit.toFixed(2)}`
 : `-${currency}${betAmount.toFixed(2)}`
 : gameState?.round?.status === "running"
 ? ` CASH OUT ${currency}${potentialProfit.toFixed(2)}`
 : " CASH OUT"}
 </button>
 </div>
 </div>

 {error && (
 <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
 {error}
 </div>
 )}
 </div>
 </div>

 {/* Sidebar — Players & History */}
 <div className="space-y-4">
 {/* Current Players */}
 <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">
 <h3 className="text-sm font-medium text-gray-400 mb-3"> Players ({gameState?.totalPlayers || 0})</h3>
 <div className="space-y-2 max-h-48 overflow-y-auto">
 {gameState?.bets?.map((bet) => (
 <div
 key={bet.playerId}
 className={`flex items-center justify-between text-xs p-2 rounded-lg ${
 bet.playerId === playerIdRef.current
 ? "bg-sentienx-brand/10 border border-sentienx-brand/20"
 : "bg-[#0a0a0f]"
 }`}
 >
 <span className={bet.playerId === playerIdRef.current ? "text-sentienx-brand font-medium" : "text-gray-300"}>
 {bet.playerId === playerIdRef.current ? "You" : bet.playerName}
 </span>
 <div className="flex items-center gap-2">
 <span className="text-gray-400">{currency}{bet.amount}</span>
 {bet.cashedOutAt !== null && bet.cashedOutAt > 0 ? (
 <span className="text-green-400 font-medium">@{bet.cashedOutAt.toFixed(2)}x</span>
 ) : bet.cashedOutAt === -1 ? (
 <span className="text-red-400">Lost</span>
 ) : gameState?.round?.status === "crashed" ? (
 <span className="text-red-400">Lost</span>
 ) : gameState?.round?.status === "running" ? (
 <span className="text-yellow-400">Playing</span>
 ) : (
 <span className="text-gray-500">Betting</span>
 )}
 </div>
 </div>
 ))}
 {(!gameState?.bets || gameState.bets.length === 0) && (
 <p className="text-gray-500 text-xs text-center py-2">No players yet</p>
 )}
 </div>
 </div>

 {/* Round History */}
 <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">
 <h3 className="text-sm font-medium text-gray-400 mb-3"> History</h3>
 <div className="flex gap-1.5 flex-wrap">
 {gameState?.history.slice(0, 20).map((h) => (
 <span
 key={h.id}
 className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
 h.crashPoint < 2
 ? "bg-red-500/20 text-red-400"
 : h.crashPoint < 5
 ? "bg-yellow-500/20 text-yellow-400"
 : "bg-green-500/20 text-green-400"
 }`}
 >
 {h.crashPoint.toFixed(2)}x
 </span>
 ))}
 {(!gameState?.history || gameState.history.length === 0) && (
 <span className="text-gray-500 text-xs">No rounds yet</span>
 )}
 </div>
 </div>

 {/* Provably Fair */}
 <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">
 <h3 className="text-sm font-medium text-gray-400 mb-2"> Provably Fair</h3>
 <p className="text-xs text-gray-500">
 Crash points are generated from SHA-256 hashes of Deriv market tick data.
 Neither players nor the house can predict outcomes.
 </p>
 {gameState?.round?.hash && (
 <div className="mt-2 space-y-1">
 <p className="text-xs text-gray-600 font-mono break-all">
 Hash: {gameState.round.hash.substring(0, 24)}...
 </p>
 <p className="text-xs text-gray-600 font-mono break-all">
 Seed: {gameState.round.seed}
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
