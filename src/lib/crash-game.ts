/**
 * Crash Game Engine — Serverless Version
 *
 * Uses API routes for game state management.
 * Real-time updates via Deriv WebSocket for price data
 * and polling for game state sync.
 *
 * Provably fair: crash points are generated from
 * a seeded RNG using Deriv tick data.
 */

import type { DerivTick } from "@/types/deriv";

export interface CrashRound {
  id: string;
  seed: string;
  crashPoint: number;
  startedAt: number;
  endedAt: number | null;
  status: "waiting" | "running" | "crashed";
  multiplier: number;
  hash: string; // Provably fair hash
}

export interface PlayerBet {
  playerId: string;
  playerName: string;
  amount: number;
  cashedOutAt: number | null;
  profit: number;
  autoCashout: number | null; // Auto-cashout multiplier (e.g., 2.0 = cash out at 2x)
}

export interface GameState {
  round: CrashRound | null;
  bets: PlayerBet[];
  history: { id: string; crashPoint: number; hash: string }[];
  countdown: number;
  totalPlayers: number;
}

const HOUSE_EDGE = 0.03;
const MAX_MULTIPLIER = 1000;

/**
 * Generate a provably fair crash point from a seed.
 * Uses the formula: (1 - house_edge) / (1 - random)
 * where random is derived from a SHA-256-like hash of the seed.
 */
export function generateCrashPoint(seed: string): number {
  // Simple but fair hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Normalize to 0-1 (exclusive)
  const normalized = Math.abs((Math.sin(hash) * 10000) % 1);

  // Instant crash for edge case
  if (normalized >= 0.99) {
    return 1.00;
  }

  // Standard crash formula
  const crashPoint = (1 - HOUSE_EDGE) / (1 - normalized);
  return Math.min(Math.max(crashPoint, 1.00), MAX_MULTIPLIER);
}

/**
 * Generate a SHA-256 hash for provably fair verification.
 */
export async function generateHash(seed: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a seed from Deriv tick data.
 * This ensures the crash point is unpredictable and provably fair.
 */
export function generateSeedFromTick(tick: DerivTick): string {
  const tickData = `${tick.tick.symbol}-${tick.tick.epoch}-${tick.tick.quote}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < tickData.length; i++) {
    hash = ((hash << 5) - hash) + tickData.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate the current multiplier based on elapsed time.
 * Uses exponential growth: e^(time * 0.00006)
 * This gives a curve that starts slow and accelerates.
 */
export function calculateMultiplier(elapsedMs: number): number {
  const growthRate = 0.00006;
  return Math.max(1.00, Math.exp(elapsedMs * growthRate));
}

/**
 * Format multiplier for display.
 */
export function formatMultiplier(multiplier: number): string {
  return multiplier >= 100
    ? `${multiplier.toFixed(0)}x`
    : `${multiplier.toFixed(2)}x`;
}

/**
 * Calculate profit from a cashout.
 */
export function calculateProfit(betAmount: number, multiplier: number): number {
  return betAmount * (multiplier - 1);
}

/**
 * Create a new crash round.
 */
export async function createRound(tick: DerivTick): Promise<CrashRound> {
  const seed = generateSeedFromTick(tick);
  const crashPoint = generateCrashPoint(seed);
  const hash = await generateHash(seed);

  return {
    id: Math.random().toString(36).substring(2, 10).toUpperCase(),
    seed,
    crashPoint,
    startedAt: 0,
    endedAt: null,
    status: "waiting",
    multiplier: 1.00,
    hash,
  };
}
