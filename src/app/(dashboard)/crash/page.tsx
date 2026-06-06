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
  } | null;
  bets: { playerId: string; playerName: string; amount: number; cashedOutAt: number | null; profit: number }[];
  history: { id: string; crashPoint: number; hash: string }[];
  countdown: number;
  totalPlayers: number;
}

export default function CrashGamePage() {
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const playerIdRef = useRef(Math.random().toString(36).substring(2, 10));

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [lastProfit, setLastProfit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll game state
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/crash");
        const data: GameState = await res.json();
        setGameState(data);

        // Reset bet state on new round
        if (data.round?.status === "waiting") {
          const myBet = data.bets.find((b) => b.playerId === playerIdRef.current);
          if (myBet) {
            setHasBet(true);
            if (myBet.cashedOutAt) {
              setCashedOut(true);
              setLastProfit(myBet.profit);
            }
          }
        }
      } catch {
        // ignore poll errors
      }
    };

    poll();
    const interval = setInterval(poll, 500);
    return () => clearInterval(interval);
  }, []);

  // Place bet
  const placeBet = async () => {
    try {
      setError(null);
      const res = await fetch("/api/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bet",
          playerId: playerIdRef.current,
          amount: betAmount,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setHasBet(true);
        setGameState(data.gameState);
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
      const w = canvas.width;
      const h = canvas.height;

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
        ctx.fillText("Loading...", w / 2, h / 2);
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const { round } = gameState;
      const multiplier = round.multiplier;

      // Draw the crash curve
      ctx.beginPath();
      ctx.strokeStyle = round.status === "crashed" ? "#ff4444" : "#00ff88";
      ctx.lineWidth = 3;

      const maxDisplay = Math.max(multiplier * 1.2, 5);
      const points = 100;
      for (let i = 0; i <= points; i++) {
        const t = (i / points) * multiplier;
        const x = (t / maxDisplay) * (w - 100) + 50;
        const y = h - 50 - (Math.log(t + 1) / Math.log(maxDisplay + 1)) * (h - 100);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw multiplier text
      const multText = multiplier >= 100 ? `${multiplier.toFixed(0)}x` : `${multiplier.toFixed(2)}x`;
      ctx.fillStyle = round.status === "crashed" ? "#ff4444" : "#00ff88";
      ctx.font = "bold 52px monospace";
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
        ctx.fillText("● LIVE", w / 2, h / 2 + 30);
      }

      // My bet status
      if (hasBet) {
        ctx.font = "14px monospace";
        if (cashedOut) {
          ctx.fillStyle = "#00ff88";
          ctx.fillText(`✓ Cashed out: +$${lastProfit?.toFixed(2)}`, w / 2, h / 2 + 55);
        } else if (round.status === "crashed") {
          ctx.fillStyle = "#ff4444";
          ctx.fillText(`✗ Lost $${betAmount.toFixed(2)}`, w / 2, h / 2 + 55);
        } else {
          ctx.fillStyle = "#ffaa00";
          const currentProfit = betAmount * (multiplier - 1);
          ctx.fillText(`In game: $${currentProfit.toFixed(2)} profit if cashout now`, w / 2, h / 2 + 55);
        }
      }

      // History bar at bottom
      const historyY = h - 25;
      const barWidth = 14;
      const barGap = 3;
      gameState.history.slice(0, 30).forEach((hist, i) => {
        const x = w - 50 - i * (barWidth + barGap);
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
  }, [gameState, hasBet, cashedOut, lastProfit, betAmount]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">🚀 Crash Game</h1>
          <p className="text-gray-400">Please log in to play</p>
          <a href="/login" className="px-6 py-3 rounded-xl bg-sentienx-brand text-white font-medium inline-block hover:bg-sentienx-brand-dark transition-colors">
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🚀 Crash Game</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Players: {gameState?.totalPlayers || 0}</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400">Live</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="bg-[#111118] rounded-xl overflow-hidden border border-[#1a1a2e]">
          <canvas ref={canvasRef} width={800} height={400} className="w-full" />
        </div>

        {/* Controls */}
        <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Bet Amount ($)</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                disabled={hasBet}
                min={1}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand disabled:opacity-50"
              />
              <div className="flex gap-1 mt-2">
                {[1, 5, 10, 25, 50, 100].map((a) => (
                  <button key={a} onClick={() => setBetAmount(a)} className="px-2 py-1 rounded bg-[#1a1a2e] text-xs hover:bg-[#2a2a3e] transition-colors">${a}</button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={placeBet}
                disabled={hasBet || gameState?.round?.status === "running"}
                className="w-full py-3 rounded-lg bg-sentienx-brand hover:bg-sentienx-brand-dark text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasBet ? "✓ Bet Placed" : `Place Bet $${betAmount}`}
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={cashOut}
                disabled={!hasBet || cashedOut || gameState?.round?.status !== "running"}
                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {cashedOut ? `+$${lastProfit?.toFixed(2)}` : "💰 CASH OUT"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">
          <h3 className="text-sm font-medium text-gray-400 mb-3">📊 Round History</h3>
          <div className="flex gap-2 flex-wrap">
            {gameState?.history.slice(0, 20).map((h) => (
              <span
                key={h.id}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  h.crashPoint < 2 ? "bg-red-500/20 text-red-400" : h.crashPoint < 5 ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                }`}
              >
                {h.crashPoint.toFixed(2)}x
              </span>
            ))}
            {(!gameState?.history || gameState.history.length === 0) && (
              <span className="text-gray-500 text-sm">No rounds yet</span>
            )}
          </div>
        </div>

        {/* Provably Fair Info */}
        <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">
          <h3 className="text-sm font-medium text-gray-400 mb-2">🔒 Provably Fair</h3>
          <p className="text-xs text-gray-500">
            Each round's crash point is determined by a SHA-256 hash of a seed derived from Deriv market data.
            Neither the house nor players can predict or manipulate the outcome.
          </p>
          {gameState?.round?.hash && (
            <p className="text-xs text-gray-600 mt-1 font-mono">
              Current round hash: {gameState.round.hash.substring(0, 32)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
