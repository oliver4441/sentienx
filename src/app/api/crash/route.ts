import { NextResponse } from "next/server";
import {
  GameState,
  CrashRound,
  PlayerBet,
  createRound,
  calculateMultiplier,
} from "@/lib/crash-game";
import { ensureConnection, getLatestTick, subscribeSymbol } from "@/lib/deriv-tick-stream";
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

// Ensure Deriv WS connection is active
ensureConnection("R_100");
subscribeSymbol("R_100");
subscribeSymbol("1HZ100V");

// Generate a tick — uses real Deriv data when available
function getGameTick(): DerivTick {
  const realTick = getLatestTick();
  if (realTick) {
    return realTick;
  }
  // Fallback to deterministic seed from time if WS not ready yet
  const epoch = Math.floor(Date.now() / 1000);
  return {
    tick: {
      ask: 0,
      bid: 0,
      epoch,
      id: `fallback-${epoch}`,
      pip_size: 2,
      quote: 50000 + (epoch % 1000),
      symbol: "R_100",
    },
  };
}

async function startNewRound() {
  const tick = getGameTick();
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
    if (gameState.round.status === "running") {
      gameState.bets.forEach((bet) => {
        if (!bet.cashedOutAt && bet.autoCashout && multiplier >= bet.autoCashout) {
          bet.cashedOutAt = multiplier;
          bet.profit = bet.amount * (multiplier - 1);
        }
      });
    }

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

  // Mark players who didn't cash out as losers
  gameState.bets.forEach((bet) => {
    if (!bet.cashedOutAt) {
      bet.cashedOutAt = 0; // Lost
      bet.profit = -bet.amount;
    }
  });

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

// Start the game loop on first module load
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
  const { action, playerId, playerName, amount, autoCashout } = body;

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
      autoCashout: autoCashout || null,
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
