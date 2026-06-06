import { NextResponse } from "next/server";
import {
  GameState,
  CrashRound,
  PlayerBet,
  createRound,
  calculateMultiplier,
  generateCrashPoint,
  generateHash,
} from "@/lib/crash-game";
import type { DerivTick } from "@/types/deriv";

// In-memory game state (use Redis/DB in production)
let gameState: GameState = {
  round: null,
  bets: [],
  history: [],
  countdown: 0,
  totalPlayers: 0,
};

let roundTimer: ReturnType<typeof setTimeout> | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;

// Simulated tick data for demo (replace with real Deriv WS data)
function generateDemoTick(): DerivTick {
  const symbols = ["R_100", "R_50", "R_25", "1HZ100V"];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  return {
    tick: {
      ask: 0,
      bid: 0,
      epoch: Math.floor(Date.now() / 1000),
      id: Math.random().toString(36),
      pip_size: 2,
      quote: 50000 + Math.random() * 10000,
      symbol,
    },
  };
}

async function startNewRound() {
  const tick = generateDemoTick();
  const round = await createRound(tick);
  round.status = "waiting";

  gameState.round = round;
  gameState.bets = [];
  gameState.countdown = 5;

  // Countdown
  let countdown = 5;
  roundTimer = setInterval(() => {
    countdown--;
    gameState.countdown = countdown;

    if (countdown <= 0) {
      if (roundTimer) clearInterval(roundTimer);
      runRound();
    }
  }, 1000);
}

function runRound() {
  if (!gameState.round) return;

  gameState.round.status = "running";
  gameState.round.startedAt = Date.now();

  tickInterval = setInterval(() => {
    if (!gameState.round || gameState.round.status !== "running") return;

    const elapsed = Date.now() - (gameState.round.startedAt || Date.now());
    const multiplier = calculateMultiplier(elapsed);
    gameState.round.multiplier = multiplier;

    // Auto-cashout for players with auto-cashout set
    gameState.bets.forEach((bet) => {
      if (!bet.cashedOutAt && multiplier >= 2) {
        // Simplified: auto-cashout at 2x for demo
        bet.cashedOutAt = multiplier;
        bet.profit = bet.amount * (multiplier - 1);
      }
    });

    // Check crash
    if (multiplier >= gameState.round.crashPoint) {
      crashRound();
    }
  }, 50);
}

async function crashRound() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }

  if (!gameState.round) return;

  const crashPoint = gameState.round.crashPoint;
  gameState.round.status = "crashed";
  gameState.round.endedAt = Date.now();
  gameState.round.multiplier = crashPoint;

  // Add to history
  gameState.history.unshift({
    id: gameState.round.id,
    crashPoint,
    hash: gameState.round.hash,
  });
  if (gameState.history.length > 50) gameState.history.pop();

  // Start new round after delay
  roundTimer = setTimeout(() => {
    startNewRound();
  }, 5000);
}

// Start the game loop
if (!gameState.round) {
  startNewRound();
}

/**
 * GET — Get current game state
 */
export async function GET() {
  return NextResponse.json(gameState);
}

/**
 * POST — Place a bet or cash out
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { action, playerId, playerName, amount } = body;

  if (action === "bet") {
    if (gameState.round?.status !== "waiting") {
      return NextResponse.json({ error: "Round already started" }, { status: 400 });
    }

    const bet: PlayerBet = {
      playerId: playerId || Math.random().toString(36).substring(2, 10),
      playerName: playerName || "Anonymous",
      amount: amount || 10,
      cashedOutAt: null,
      profit: 0,
    };

    gameState.bets.push(bet);
    gameState.totalPlayers = gameState.bets.length;

    return NextResponse.json({ success: true, bet, gameState });
  }

  if (action === "cashout") {
    if (gameState.round?.status !== "running") {
      return NextResponse.json({ error: "Round not running" }, { status: 400 });
    }

    const bet = gameState.bets.find((b) => b.playerId === playerId && !b.cashedOutAt);
    if (!bet) {
      return NextResponse.json({ error: "No active bet found" }, { status: 400 });
    }

    const multiplier = gameState.round.multiplier;
    bet.cashedOutAt = multiplier;
    bet.profit = bet.amount * (multiplier - 1);

    return NextResponse.json({ success: true, multiplier, profit: bet.profit, gameState });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
