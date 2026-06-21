// sentienx-bot-engine/src/risk/index.ts
// Risk Manager -- mathematical position sizing and circuit breakers
// Philosophy: the ONLY reliable edge is proper risk management
// Kelly Criterion + circuit breakers + regime-adjusted sizing

import type {
  BotConfig,
  BotState,
  CircuitBreakerState,
  StakeRecommendation,
  TradeResult,
  VolatilityRegime,
} from '../types';
import { KellyCriterion } from '../utils/math';

/**
 * Calculate optimal stake using Kelly Criterion with safety adjustments.
 *
 * Kelly formula: f* = (bp - q) / b
 *   b = payout ratio (e.g., 0.85 for 85%)
 *   p = estimated win probability
 *   q = 1 - p
 *
 * We use Half-Kelly (or less) because:
 * 1. Full Kelly assumes perfect edge estimation (we don't have that)
 * 2. Half-Kelly gives 75% of the growth with 50% less variance
 * 3. Quarter-Kelly is even safer for uncertain edges
 */
export function calculateStake(
  balance: number,
  payoutRatio: number,
  estimatedWinRate: number,
  config: BotConfig,
  regime: VolatilityRegime,
  recentResults: TradeResult[]
): StakeRecommendation {
  // ─── Kelly Calculation ─────────────────────────────────────
  const kelly = KellyCriterion(payoutRatio, estimatedWinRate);

  // Apply Kelly fraction (half-kelly, quarter-kelly, etc.)
  const fractionalKelly = kelly * config.kellyFraction;

  // ─── Regime Adjustment ─────────────────────────────────────
  const regimeMultiplier = config.regimeAdjustments[regime].stakeMultiplier;

  // ─── Recent Performance Adjustment ─────────────────────────
  // If we're on a losing streak, reduce stake
  let streakMultiplier = 1.0;
  const recent = recentResults.slice(-10);
  if (recent.length >= 3) {
    const last3 = recent.slice(-3);
    const allLosses = last3.every((t) => t.outcome === 'LOSS');
    if (allLosses) {
      streakMultiplier = 0.5; // Halve stake after 3 consecutive losses
    }
    const last5 = recent.slice(-5);
    const fiveLosses = last5.length === 5 && last5.every((t) => t.outcome === 'LOSS');
    if (fiveLosses) {
      streakMultiplier = 0.25; // Quarter stake after 5 consecutive losses
    }
  }

  // ─── Final Calculation ─────────────────────────────────────
  const rawStake = balance * fractionalKelly * regimeMultiplier * streakMultiplier;

  // Apply limits
  const maxStake = balance * config.maxStakePercent;
  const minStake = 0.35; // Deriv minimum

  const finalStake = Math.max(minStake, Math.min(rawStake, maxStake, balance));

  // If Kelly says 0 or negative edge, don't trade
  if (kelly <= 0) {
    return {
      amount: 0,
      kellyFraction: 0,
      maxAllowed: maxStake,
      reason: `No edge: Kelly=${kelly.toFixed(4)}. Win rate ${(estimatedWinRate * 100).toFixed(1)}% insufficient for payout ${(payoutRatio * 100).toFixed(0)}%.`,
    };
  }

  return {
    amount: Math.round(finalStake * 100) / 100,
    kellyFraction: fractionalKelly,
    maxAllowed: maxStake,
    reason: `Kelly=${kelly.toFixed(4)}, frac=${config.kellyFraction}, regime=${regime}(${regimeMultiplier}), streak=${streakMultiplier}. Raw=$${rawStake.toFixed(2)}, final=$${finalStake.toFixed(2)}`,
  };
}

/**
 * Check all circuit breaker conditions.
 * Returns updated circuit breaker state and whether trading should halt.
 */
export function checkCircuitBreaker(
  state: BotState,
  config: BotConfig
): CircuitBreakerState {
  const cb = { ...state.circuitBreaker };
  cb.triggered = false;
  cb.reason = null;

  // ─── Consecutive Losses ────────────────────────────────────
  let consecutiveLosses = 0;
  for (let i = state.trades.length - 1; i >= 0; i--) {
    if (state.trades[i].outcome === 'LOSS') consecutiveLosses++;
    else break;
  }
  cb.consecutiveLosses = consecutiveLosses;

  if (consecutiveLosses >= config.maxConsecutiveLosses) {
    cb.triggered = true;
    cb.reason = `Circuit broken: ${consecutiveLosses} consecutive losses (limit: ${config.maxConsecutiveLosses})`;
    return cb;
  }

  // ─── Daily Loss Limit ──────────────────────────────────────
  const today = new Date().toDateString();
  const todayTrades = state.trades.filter(
    (t) => new Date(t.timestamp).toDateString() === today
  );
  const dailyPnL = todayTrades.reduce((sum, t) => sum + t.profit, 0);
  cb.dailyPnL = dailyPnL;

  if (dailyPnL <= -state.initialBalance * config.dailyLossLimitPercent) {
    cb.triggered = true;
    cb.reason = `Circuit broken: Daily loss $${Math.abs(dailyPnL).toFixed(2)} exceeds limit ($${(state.initialBalance * config.dailyLossLimitPercent).toFixed(2)})`;
    return cb;
  }

  // ─── Maximum Drawdown ──────────────────────────────────────
  if (state.balance > cb.peakBalance) {
    cb.peakBalance = state.balance;
  }
  const drawdown = cb.peakBalance > 0
    ? (cb.peakBalance - state.balance) / cb.peakBalance
    : 0;
  cb.currentBalance = state.balance;
  cb.maxDrawdown = Math.max(cb.maxDrawdown, drawdown);

  if (drawdown >= config.maxDrawdownPercent) {
    cb.triggered = true;
    cb.reason = `Circuit broken: Drawdown ${(drawdown * 100).toFixed(1)}% exceeds limit (${(config.maxDrawdownPercent * 100).toFixed(0)}%)`;
    return cb;
  }

  // ─── Minimum Balance ───────────────────────────────────────
  if (state.balance < config.minBalance) {
    cb.triggered = true;
    cb.reason = `Circuit broken: Balance $${state.balance.toFixed(2)} below minimum ($${config.minBalance})`;
    return cb;
  }

  return cb;
}

/**
 * Initialize circuit breaker state
 */
export function initCircuitBreaker(initialBalance: number): CircuitBreakerState {
  return {
    consecutiveLosses: 0,
    maxConsecutiveLosses: 5,
    dailyPnL: 0,
    dailyLossLimit: initialBalance * 0.1,
    maxDrawdown: 0,
    peakBalance: initialBalance,
    currentBalance: initialBalance,
    triggered: false,
    reason: null,
  };
}

/**
 * Monte Carlo simulation for risk analysis.
 * Simulates N trading sessions with given parameters to estimate
 * probability of ruin, expected drawdown, etc.
 */
export function monteCarloSimulation(params: {
  initialBalance: number;
  winRate: number;
  payoutRatio: number;
  stakePercent: number;
  numTrades: number;
  numSimulations: number;
}): {
  ruinProbability: number;     // Probability of losing everything
  medianFinalBalance: number;
  worstCaseBalance: number;    // 5th percentile
  bestCaseBalance: number;     // 95th percentile
  medianMaxDrawdown: number;
  probabilityOfProfit: number;
} {
  const { initialBalance, winRate, payoutRatio, stakePercent, numTrades, numSimulations } = params;

  const finalBalances: number[] = [];
  const maxDrawdowns: number[] = [];
  let ruinCount = 0;
  let profitCount = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    let balance = initialBalance;
    let peak = balance;
    let maxDD = 0;

    for (let trade = 0; trade < numTrades; trade++) {
      const stake = balance * stakePercent;
      if (stake < 0.35 || balance < 0.35) {
        ruinCount++;
        balance = 0;
        break;
      }

      const won = Math.random() < winRate;
      if (won) {
        balance += stake * payoutRatio;
      } else {
        balance -= stake;
      }

      if (balance > peak) peak = balance;
      const dd = peak > 0 ? (peak - balance) / peak : 0;
      if (dd > maxDD) maxDD = dd;
    }

    finalBalances.push(balance);
    maxDrawdowns.push(maxDD);
    if (balance > initialBalance) profitCount++;
  }

  const sorted = [...finalBalances].sort((a, b) => a - b);
  const sortedDD = [...maxDrawdowns].sort((a, b) => a - b);

  return {
    ruinProbability: ruinCount / numSimulations,
    medianFinalBalance: sorted[Math.floor(numSimulations / 2)],
    worstCaseBalance: sorted[Math.floor(numSimulations * 0.05)],
    bestCaseBalance: sorted[Math.floor(numSimulations * 0.95)],
    medianMaxDrawdown: sortedDD[Math.floor(numSimulations / 2)],
    probabilityOfProfit: profitCount / numSimulations,
  };
}

/**
 * Calculate recommended parameters based on Monte Carlo results.
 * Finds the optimal stake % that maximizes growth while keeping
 * ruin probability below acceptable threshold.
 */
export function optimizeStakeSize(params: {
  initialBalance: number;
  winRate: number;
  payoutRatio: number;
  numTrades: number;
  maxRuinProbability: number;  // e.g., 0.01 for 1% max ruin
  numSimulations?: number;
}): { optimalStakePercent: number; expectedGrowthRate: number; ruinProbability: number } {
  const { initialBalance, winRate, payoutRatio, numTrades, maxRuinProbability, numSimulations = 5000 } = params;

  let bestStake = 0.01;
  let bestGrowth = -Infinity;
  let bestRuin = 1;

  // Test stake sizes from 0.5% to 5%
  for (let stakePercent = 0.005; stakePercent <= 0.05; stakePercent += 0.005) {
    const result = monteCarloSimulation({
      initialBalance,
      winRate,
      payoutRatio,
      stakePercent,
      numTrades,
      numSimulations: Math.min(numSimulations, 1000), // Faster for optimization
    });

    if (result.ruinProbability <= maxRuinProbability) {
      // Geometric growth rate
      const growthRate = Math.log(result.medianFinalBalance / initialBalance) / numTrades;
      if (growthRate > bestGrowth) {
        bestGrowth = growthRate;
        bestStake = stakePercent;
        bestRuin = result.ruinProbability;
      }
    }
  }

  return {
    optimalStakePercent: Math.round(bestStake * 10000) / 10000,
    expectedGrowthRate: bestGrowth,
    ruinProbability: bestRuin,
  };
}
